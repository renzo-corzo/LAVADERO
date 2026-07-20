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
import { empresaScope } from '@/lib/empresa'
import { validarSucursalDeEmpresa, verificarNombreDisponible } from '@/lib/catalogo-sucursal'

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

    // Scoping multi-tenant: solo servicios de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const servicio = await prisma.servicio.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
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

    // Scoping multi-tenant: solo se puede editar un servicio de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    const actual = await prisma.servicio.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    // Sucursal destino: si no viene en el body, se mantiene la actual.
    // Un empleado con sucursal propia no puede mover el servicio a otra.
    const sucursalId = session.user.sucursalId
      ? actual.sucursalId
      : body.sucursalId !== undefined
        ? body.sucursalId || null
        : actual.sucursalId
    const errSucursal = await validarSucursalDeEmpresa(sucursalId, actual.empresaId)
    if (errSucursal) {
      return NextResponse.json({ error: errSucursal }, { status: 400 })
    }

    // Nombre libre en el ámbito destino (sin chocar consigo mismo)
    const errNombre = await verificarNombreDisponible(
      'servicio',
      actual.empresaId,
      nombre,
      sucursalId,
      params.id
    )
    if (errNombre) {
      return NextResponse.json({ error: errNombre }, { status: 400 })
    }

    const servicio = await prisma.servicio.update({
      where: { id: params.id },
      data: {
        nombre,
        sucursalId,
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

    // Scoping multi-tenant: solo se puede desactivar un servicio de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    const actual = await prisma.servicio.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
      select: { id: true },
    })
    if (!actual) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
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





