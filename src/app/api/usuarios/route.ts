/**
 * API Route: Usuarios
 * GET: Listar usuarios (con filtros)
 * POST: Crear nuevo usuario (solo DUEÑO)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { crearUsuarioSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const rol = searchParams.get('rol')
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'

    // Construir where clause
    const where: any = {}
    
    // Si no es para selección de empleados, verificar permisos
    if (!rol && !incluirInactivos) {
      // Si no hay filtros, solo mostrar activos por defecto
      where.activo = true
    } else {
      if (!incluirInactivos && !rol) {
        where.activo = true
      }
    }

    if (rol) {
      where.rol = rol
      // Para selección de empleados, solo activos
      if (!incluirInactivos) {
        where.activo = true
      }
    }

    // Para gestión de usuarios (sin filtro de rol), verificar permisos
    // Si es para el tablero/filtros, permitir a todos los roles autenticados ver usuarios activos
    // Si es para gestión completa (con incluirInactivos), solo DUEÑO
    if (!rol) {
      if (incluirInactivos) {
        // Solo DUEÑO puede ver usuarios inactivos
        if (!hasPermission(session.user.role, 'usuario:view')) {
          return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
        }
      }
      // Si no se pide incluir inactivos, cualquier usuario autenticado puede ver usuarios activos
      // (útil para filtros del tablero)
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:create')) {
      return NextResponse.json({ error: 'Sin permisos. Solo DUEÑO puede crear usuarios' }, { status: 403 })
    }

    const body = await request.json()

    // Validación con Zod
    const validationResult = crearUsuarioSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { nombre, usuario: username, password, rol } = validationResult.data
    const activo = body.activo !== undefined ? body.activo : true

    // Verificar que el usuario no exista
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: username },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        usuario: username.trim(),
        password: hashedPassword,
        rol: rol as any,
        activo: activo !== undefined ? activo : true,
      },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'USUARIO_CREATED',
        entidad: 'Usuario',
        entidadId: nuevoUsuario.id,
        datos: JSON.stringify({
          nombre: nuevoUsuario.nombre,
          usuario: nuevoUsuario.usuario,
          rol: nuevoUsuario.rol,
        }),
      },
    })

    return NextResponse.json(nuevoUsuario, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

