/**
 * API Route: Extras
 * GET: Listar extras
 * POST: Crear extra
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const activo = searchParams.get('activo')

    const extras = await prisma.extra.findMany({
      where: activo !== null ? { activo: activo === 'true' } : undefined,
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(extras)
  } catch (error) {
    console.error('Error al obtener extras:', error)
    return NextResponse.json(
      { error: 'Error al obtener extras' },
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

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, precio, duracionEstimada, descripcion, activo } = body

    // Validaciones
    if (!nombre || !precio) {
      return NextResponse.json(
        { error: 'Nombre y precio son obligatorios' },
        { status: 400 }
      )
    }

    if (precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a cero' },
        { status: 400 }
      )
    }

    // Verificar que el nombre sea único
    const existente = await prisma.extra.findUnique({
      where: { nombre },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un extra con ese nombre' },
        { status: 400 }
      )
    }

    const extra = await prisma.extra.create({
      data: {
        nombre,
        precio: parseFloat(precio),
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
      },
    })

    return NextResponse.json(extra, { status: 201 })
  } catch (error) {
    console.error('Error al crear extra:', error)
    return NextResponse.json(
      { error: 'Error al crear extra' },
      { status: 500 }
    )
  }
}




