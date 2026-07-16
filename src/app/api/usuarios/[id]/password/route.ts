/**
 * API Route: Cambiar Contraseña de Usuario
 * PUT: Cambiar la contraseña de un usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import bcrypt from 'bcryptjs'

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
      return NextResponse.json({ error: 'Sin permisos. Solo DUEÑO puede cambiar contraseñas' }, { status: 403 })
    }

    const body = await request.json()
    const { nuevaPassword } = body

    if (!nuevaPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña es requerida' },
        { status: 400 }
      )
    }

    if (nuevaPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Scoping multi-tenant
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // La clave de un ADMIN solo la puede cambiar otro ADMIN
    if (usuario.rol === 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Usuarios de otra empresa: no existen para este usuario
    if (scope.empresaId && usuario.rol !== 'ADMIN' && usuario.empresaId !== scope.empresaId) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'USUARIO_PASSWORD_CHANGED',
        entidad: 'Usuario',
        entidadId: params.id,
        datos: JSON.stringify({
          usuarioModificado: usuario.usuario,
        }),
      },
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}





