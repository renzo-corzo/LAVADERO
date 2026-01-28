/**
 * API Route: Servicio individual
 * GET: Obtener servicio por ID
 * PUT: Actualizar servicio
 * DELETE: Eliminar servicio (soft delete - desactivar)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const servicio = await prisma.servicio.findUnique({
      where: { id: params.id },
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al obtener servicio:', error)
    return NextResponse.json(
      { error: 'Error al obtener servicio' },
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

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, precio, duracionEstimada, tipoVehiculo, descripcion, activo } = body

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

    // Verificar que el nombre sea único (excepto el actual)
    const existente = await prisma.servicio.findUnique({
      where: { nombre },
    })

    if (existente && existente.id !== params.id) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con ese nombre' },
        { status: 400 }
      )
    }

    const servicio = await prisma.servicio.update({
      where: { id: params.id },
      data: {
        nombre,
        precio: parseFloat(precio),
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        tipoVehiculo: tipoVehiculo || null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
      },
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al actualizar servicio:', error)
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
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

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Soft delete: desactivar en lugar de eliminar
    const servicio = await prisma.servicio.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al eliminar servicio:', error)
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    )
  }
}





