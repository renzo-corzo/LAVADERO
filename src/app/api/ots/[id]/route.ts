/**
 * API Route: OT individual
 * GET: Obtener OT por ID
 * PUT: Actualizar OT (solo EN_COLA o EN_PROCESO)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { canEditOT } from '@/lib/reglas-negocio'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ENCARGADO y DUENO pueden ver OTs
    if (!hasPermission(session.user.role, 'ot:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const ot = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id },
      include: {
        servicio: true,
        extras: {
          include: {
            extra: true,
          },
        },
        usuarioCreador: {
          select: {
            id: true,
            nombre: true,
          },
        },
        estadosHistorial: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { fechaHora: 'desc' },
        },
      },
    })

    if (!ot) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }


    // Obtener pagos para calcular estado de pago
    const pagos = await prisma.pago.findMany({
      where: { ordenTrabajoId: params.id },
      select: { monto: true },
    })
    const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const pendiente = Number(ot.total) - totalPagado

    // Formatear respuesta
    const otFormateada = {
      ...ot,
      extras: ot.extras.map((e) => e.extra),
      precio: Number(ot.total),
      totalPagado,
      pendiente,
      estaPagada: pendiente <= 0,
      servicio: {
        ...ot.servicio,
        precio: Number(ot.servicio.precio),
      },
    }

    return NextResponse.json(otFormateada)
  } catch (error) {
    console.error('Error al obtener OT:', error)
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
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

    if (!hasPermission(session.user.role, 'ot:edit')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Obtener OT actual
    const otActual = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id },
    })

    if (!otActual) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que se puede editar
    if (!canEditOT(otActual.estado)) {
      return NextResponse.json(
        { error: 'Solo se pueden editar OTs en estado EN_COLA o EN_PROCESO' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      servicioId,
      extrasIds = [],
      patente,
      tipoVehiculo,
      descripcionVehiculo,
      nombreCliente,
      telefonoCliente,
      horarioDeseado,
      observaciones,
      precioAjustado,
      justificacionPrecio,
    } = body

    // Validaciones
    if (!servicioId || !patente || !nombreCliente || !telefonoCliente || !horarioDeseado) {
      return NextResponse.json(
        { error: 'Servicio, patente, nombre del cliente, teléfono, horario deseado y al menos un empleado son obligatorios' },
        { status: 400 }
      )
    }
    
    // Validar que patente no esté vacío
    if (!patente.trim()) {
      return NextResponse.json(
        { error: 'La patente es obligatoria y no puede estar vacía' },
        { status: 400 }
      )
    }
    
    // Validar que nombre y teléfono no estén vacíos
    if (!nombreCliente.trim() || !telefonoCliente.trim()) {
      return NextResponse.json(
        { error: 'El nombre y teléfono del cliente son obligatorios' },
        { status: 400 }
      )
    }

    // Recalcular total si cambió servicio o extras
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
    })

    if (!servicio || !servicio.activo) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o inactivo' },
        { status: 400 }
      )
    }

    let extras: any[] = []
    if (extrasIds.length > 0) {
      extras = await prisma.extra.findMany({
        where: {
          id: { in: extrasIds },
          activo: true,
        },
      })
    }

    // Calcular total
    let total = Number(servicio.precio)
    extras.forEach((extra) => {
      total += Number(extra.precio)
    })

    // Si hay precio ajustado, usar ese
    if (precioAjustado !== undefined && precioAjustado !== null) {
      total = parseFloat(precioAjustado)
      if (!justificacionPrecio) {
        return NextResponse.json(
          { error: 'Justificación requerida si se ajusta el precio' },
          { status: 400 }
        )
      }
    }

    // Actualizar OT con transacción
    const ot = await prisma.$transaction(async (tx) => {
      // Eliminar relaciones existentes
      await tx.ordenTrabajoExtra.deleteMany({
        where: { ordenTrabajoId: params.id },
      })

      // Actualizar OT
      const otActualizada = await tx.ordenTrabajo.update({
        where: { id: params.id },
        data: {
          patente: patente.trim(),
          tipoVehiculo: tipoVehiculo || null,
          descripcionVehiculo: descripcionVehiculo || null,
          nombreCliente: nombreCliente.trim(),
          telefonoCliente: telefonoCliente.trim(),
          horarioDeseado: horarioDeseado ? new Date(horarioDeseado) : null,
          servicioId,
          observaciones: observaciones || null,
          total,
          precioAjustado: precioAjustado ? parseFloat(precioAjustado) : null,
          justificacionPrecio: justificacionPrecio || null,
          extras: {
            create: extrasIds.map((extraId: string) => ({
              extraId,
            })),
          },
        },
        include: {
          servicio: true,
          extras: {
            include: {
              extra: true,
            },
          },
        },
      })

      // Registrar en log de auditoría
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'OT_UPDATED',
          entidad: 'OrdenTrabajo',
          entidadId: params.id,
          datos: JSON.stringify({
            servicioId,
            total,
          }),
        },
      })

      return otActualizada
    })

    // Obtener pagos para calcular estado de pago
    const pagosActualizados = await prisma.pago.findMany({
      where: { ordenTrabajoId: params.id },
      select: { monto: true },
    })
    const totalPagado = pagosActualizados.reduce((sum, p) => sum + Number(p.monto), 0)
    const pendiente = Number(ot.total) - totalPagado

    // Formatear respuesta
    const otFormateada = {
      ...ot,
      extras: ot.extras.map((e) => e.extra),
      precio: Number(ot.total),
      totalPagado,
      pendiente,
      estaPagada: pendiente <= 0,
      servicio: {
        ...ot.servicio,
        precio: Number(ot.servicio.precio),
      },
    }

    return NextResponse.json(otFormateada)
  } catch (error) {
    console.error('Error al actualizar OT:', error)
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    )
  }
}

