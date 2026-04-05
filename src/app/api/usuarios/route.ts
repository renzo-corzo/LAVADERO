/**
 * API Route: Usuarios
 * GET: Listar usuarios (restringido por rol)
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

    const role = session.user.role
    if (role === 'CLIENTE' || role === 'LAVADOR') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const rolParam = searchParams.get('rol')
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'
    const incluirClientes = searchParams.get('incluirClientes') === 'true'

    if (role === 'ENCARGADO') {
      if (rolParam !== 'LAVADOR' || incluirInactivos || incluirClientes) {
        return NextResponse.json(
          { error: 'Sin permisos: solo se permite listar lavadores activos (rol=LAVADOR)' },
          { status: 403 }
        )
      }
    }

    const where: Record<string, unknown> = {}

    if (rolParam) {
      where.rol = rolParam
    } else if (!incluirClientes) {
      where.rol = { not: 'CLIENTE' }
    }

    if (!incluirInactivos) {
      where.activo = true
    }

    if (role === 'DUENO') {
      if (incluirInactivos && !hasPermission(role, 'usuario:view')) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
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

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: username },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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
