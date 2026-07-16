/**
 * API Route: Sucursales
 * GET: Listar sucursales (cualquier usuario interno; para selectores)
 * POST: Crear sucursal (solo DUEÑO/ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { crearSucursalSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role === 'CLIENTE') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const incluirInactivas = request.nextUrl.searchParams.get('incluirInactivas') === 'true'
    const puedeGestionar = session.user.role === 'DUENO' || session.user.role === 'ADMIN'

    const sucursales = await prisma.sucursal.findMany({
      where: incluirInactivas && puedeGestionar ? {} : { activo: true },
      select: { id: true, nombre: true, direccion: true, activo: true },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(sucursales)
  } catch (error) {
    console.error('Error al obtener sucursales:', error)
    return NextResponse.json({ error: 'Error al obtener sucursales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'DUENO' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validation = crearSucursalSchema.safeParse(body)
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

    const { nombre, direccion } = validation.data

    const existente = await prisma.sucursal.findUnique({ where: { nombre } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe una sucursal con ese nombre' }, { status: 400 })
    }

    const sucursal = await prisma.sucursal.create({
      data: { nombre: nombre.trim(), direccion: direccion?.trim() || null },
      select: { id: true, nombre: true, direccion: true, activo: true },
    })

    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'SUCURSAL_CREATED',
        entidad: 'Sucursal',
        entidadId: sucursal.id,
        datos: JSON.stringify({ nombre: sucursal.nombre }),
      },
    })

    return NextResponse.json(sucursal, { status: 201 })
  } catch (error) {
    console.error('Error al crear sucursal:', error)
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 })
  }
}
