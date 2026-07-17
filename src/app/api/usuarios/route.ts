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
import { empresaScope } from '@/lib/empresa'
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

    // Scoping multi-tenant: cada empresa ve solo sus usuarios
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const where: Record<string, unknown> = {}
    if (scope.empresaId) {
      where.empresaId = scope.empresaId
    }

    if (rolParam) {
      // Los usuarios ADMIN solo los puede listar otro ADMIN
      if (rolParam === 'ADMIN' && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      where.rol = rolParam
    } else {
      const excluir: string[] = []
      if (!incluirClientes) excluir.push('CLIENTE')
      if (role !== 'ADMIN') excluir.push('ADMIN') // ocultar ADMIN a quien no es ADMIN
      if (excluir.length === 1) where.rol = { not: excluir[0] }
      else if (excluir.length > 1) where.rol = { notIn: excluir }
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
        empresa: { select: { id: true, nombre: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: [{ empresa: { nombre: 'asc' } }, { nombre: 'asc' }],
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

    const { nombre, usuario: username, password, rol, sucursalId } = validationResult.data
    const activo = body.activo !== undefined ? body.activo : true

    // Solo un ADMIN puede crear otro ADMIN
    if (rol === 'ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sin permisos para crear un usuario ADMIN' },
        { status: 403 }
      )
    }

    // Scoping multi-tenant: el usuario nuevo pertenece a la empresa del creador
    // (ADMIN de plataforma se crea sin empresa; el resto la necesita)
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    const empresaIdNuevo = rol === 'ADMIN' ? null : scope.empresaId
    if (rol !== 'ADMIN' && !empresaIdNuevo) {
      return NextResponse.json(
        { error: 'Debe indicar la empresa (contexto de plataforma)' },
        { status: 400 }
      )
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: username },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // La sucursal asignada debe pertenecer a la misma empresa
    const sucursalAsignada =
      rol === 'ENCARGADO' || rol === 'LAVADOR' ? sucursalId || null : null
    if (sucursalAsignada) {
      const sucursalValida = await prisma.sucursal.findFirst({
        where: { id: sucursalAsignada, empresaId: empresaIdNuevo! },
        select: { id: true },
      })
      if (!sucursalValida) {
        return NextResponse.json(
          { error: 'La sucursal no pertenece a la empresa' },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        usuario: username.trim(),
        password: hashedPassword,
        rol,
        empresaId: empresaIdNuevo,
        // Solo los empleados operativos llevan sucursal
        sucursalId: sucursalAsignada,
        activo: activo !== undefined ? activo : true,
      },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        sucursalId: true,
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
