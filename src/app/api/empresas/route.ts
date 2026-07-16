/**
 * API Route: Empresas (plataforma)
 * GET: Listar empresas con resumen (solo ADMIN)
 * POST: Crear empresa completa: empresa + sucursales + dueño (solo ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { crearEmpresaSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const empresas = await prisma.empresa.findMany({
      include: {
        sucursales: {
          select: { id: true, nombre: true, activo: true },
          orderBy: { nombre: 'asc' },
        },
        usuarios: {
          where: { rol: 'DUENO' },
          select: { id: true, nombre: true, usuario: true, activo: true },
          orderBy: { nombre: 'asc' },
        },
        _count: {
          select: { ordenesTrabajo: true, usuarios: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(
      empresas.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        activo: e.activo,
        sucursales: e.sucursales,
        duenos: e.usuarios,
        totalOTs: e._count.ordenesTrabajo,
        totalUsuarios: e._count.usuarios,
        createdAt: e.createdAt,
      }))
    )
  } catch (error) {
    console.error('Error al obtener empresas:', error)
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validation = crearEmpresaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { nombre, sucursales, dueno } = validation.data

    // Nombre de empresa único en la plataforma
    const empresaExistente = await prisma.empresa.findUnique({
      where: { nombre: nombre.trim() },
    })
    if (empresaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con ese nombre' },
        { status: 400 }
      )
    }

    // Usuario del dueño único en la plataforma
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: dueno.usuario.trim() },
    })
    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario del dueño ya existe' },
        { status: 400 }
      )
    }

    // Nombres de sucursales sin repetir
    const nombresSucursales = sucursales.map((s) => s.trim()).filter(Boolean)
    if (new Set(nombresSucursales.map((s) => s.toLowerCase())).size !== nombresSucursales.length) {
      return NextResponse.json(
        { error: 'Los nombres de las sucursales no pueden repetirse' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(dueno.password, 10)

    const empresa = await prisma.$transaction(async (tx) => {
      const nuevaEmpresa = await tx.empresa.create({
        data: { nombre: nombre.trim(), activo: true },
      })

      await tx.sucursal.createMany({
        data: nombresSucursales.map((n) => ({
          empresaId: nuevaEmpresa.id,
          nombre: n,
          activo: true,
        })),
      })

      await tx.usuario.create({
        data: {
          nombre: dueno.nombre.trim(),
          usuario: dueno.usuario.trim(),
          password: hashedPassword,
          rol: 'DUENO',
          empresaId: nuevaEmpresa.id,
          activo: true,
        },
      })

      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'EMPRESA_CREATED',
          entidad: 'Empresa',
          entidadId: nuevaEmpresa.id,
          datos: JSON.stringify({
            nombre: nuevaEmpresa.nombre,
            sucursales: nombresSucursales,
            dueno: dueno.usuario.trim(),
          }),
        },
      })

      return nuevaEmpresa
    })

    const completa = await prisma.empresa.findUnique({
      where: { id: empresa.id },
      include: {
        sucursales: { select: { id: true, nombre: true, activo: true } },
        usuarios: {
          where: { rol: 'DUENO' },
          select: { id: true, nombre: true, usuario: true, activo: true },
        },
      },
    })

    return NextResponse.json(
      {
        id: completa!.id,
        nombre: completa!.nombre,
        activo: completa!.activo,
        sucursales: completa!.sucursales,
        duenos: completa!.usuarios,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear empresa:', error)
    return NextResponse.json({ error: 'Error al crear empresa' }, { status: 500 })
  }
}
