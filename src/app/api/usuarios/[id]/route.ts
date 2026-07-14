/**
 * API Route: Usuario Individual
 * GET: Obtener un usuario específico
 * PUT: Actualizar usuario
 * DELETE: Desactivar usuario (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Un usuario ADMIN solo lo puede ver otro ADMIN
    if (usuario.rol === 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:edit')) {
      return NextResponse.json({ error: 'Sin permisos. Solo DUEÑO puede editar usuarios' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, usuario: username, rol, activo } = body

    // Validaciones
    if (!nombre || !username || !rol) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, usuario, rol' },
        { status: 400 }
      )
    }

    // Solo un ADMIN puede asignar el rol ADMIN
    const rolesPermitidos =
      session.user.role === 'ADMIN'
        ? ['ADMIN', 'DUENO', 'ENCARGADO', 'LAVADOR']
        : ['DUENO', 'ENCARGADO', 'LAVADOR']
    if (!rolesPermitidos.includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { id: true, usuario: true, rol: true, activo: true },
    })

    if (!usuarioExistente) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Un usuario ADMIN solo puede ser gestionado por otro ADMIN (se oculta al resto)
    if (usuarioExistente.rol === 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Evitar escalamiento: los usuarios del portal (CLIENTE) se gestionan desde Clientes -> Acceso Portal
    if (usuarioExistente.rol === 'CLIENTE') {
      return NextResponse.json(
        { error: 'Este usuario pertenece al portal del cliente. Gestioná su acceso desde Clientes → Acceso Portal.' },
        { status: 400 }
      )
    }

    // Verificar que el username no esté ocupado por otro usuario
    if (username !== usuarioExistente.usuario) {
      const usernameOcupado = await prisma.usuario.findUnique({
        where: { usuario: username },
      })
      if (usernameOcupado) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        nombre: nombre.trim(),
        usuario: username.trim(),
        rol,
        activo: activo !== undefined ? activo : usuarioExistente.activo,
      },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'USUARIO_UPDATED',
        entidad: 'Usuario',
        entidadId: params.id,
        datos: JSON.stringify({
          cambios: {
            nombre,
            usuario: username,
            rol,
            activo,
          },
        }),
      },
    })

    return NextResponse.json(usuarioActualizado)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:delete')) {
      return NextResponse.json({ error: 'Sin permisos. Solo DUEÑO puede desactivar usuarios' }, { status: 403 })
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Un usuario ADMIN solo lo puede desactivar otro ADMIN (se oculta al resto)
    if (usuario.rol === 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir desactivarse a sí mismo
    if (usuario.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propio usuario' },
        { status: 400 }
      )
    }

    // Soft delete: desactivar
    const usuarioDesactivado = await prisma.usuario.update({
      where: { id: params.id },
      data: { activo: false },
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'USUARIO_DEACTIVATED',
        entidad: 'Usuario',
        entidadId: params.id,
        datos: JSON.stringify({
          usuarioDesactivado: usuario.usuario,
        }),
      },
    })

    return NextResponse.json({ message: 'Usuario desactivado correctamente' })
  } catch (error) {
    console.error('Error al desactivar usuario:', error)
    return NextResponse.json(
      { error: 'Error al desactivar usuario' },
      { status: 500 }
    )
  }
}





