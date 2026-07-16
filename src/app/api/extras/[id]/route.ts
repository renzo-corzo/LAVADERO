/**
 * API Route: Extra individual
 * GET: Obtener extra por ID
 * PUT: Actualizar extra
 * DELETE: Eliminar extra (soft delete - desactivar)
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

    const extra = await prisma.extra.findUnique({
      where: { id: params.id },
    })

    if (!extra) {
      return NextResponse.json(
        { error: 'Extra no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(extra)
  } catch (error) {
    console.error('Error al obtener extra:', error)
    return NextResponse.json(
      { error: 'Error al obtener extra' },
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

    // La duración se carga en MINUTOS (tope 8 horas): evita errores de tipeo
    // que bloquean todos los horarios del día.
    if (duracionEstimada != null && duracionEstimada !== '') {
      const dur = parseInt(duracionEstimada)
      if (isNaN(dur) || dur <= 0 || dur > 480) {
        return NextResponse.json(
          { error: 'La duración se carga en minutos (entre 1 y 480, máx. 8 horas)' },
          { status: 400 }
        )
      }
    }

    // Verificar que el nombre sea único (excepto el actual)
    const existente = await prisma.extra.findUnique({
      where: { nombre },
    })

    if (existente && existente.id !== params.id) {
      return NextResponse.json(
        { error: 'Ya existe un extra con ese nombre' },
        { status: 400 }
      )
    }

    const extra = await prisma.extra.update({
      where: { id: params.id },
      data: {
        nombre,
        precio: parseFloat(precio),
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
      },
    })

    return NextResponse.json(extra)
  } catch (error) {
    console.error('Error al actualizar extra:', error)
    return NextResponse.json(
      { error: 'Error al actualizar extra' },
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
    const extra = await prisma.extra.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json(extra)
  } catch (error) {
    console.error('Error al eliminar extra:', error)
    return NextResponse.json(
      { error: 'Error al eliminar extra' },
      { status: 500 }
    )
  }
}





