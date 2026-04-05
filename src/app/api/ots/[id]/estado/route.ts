/**
 * API Route: Cambiar Estado de OT
 * PUT: Cambiar el estado de una OT
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { isValidEstadoTransition } from '@/lib/reglas-negocio'
import { hasEstadoTransitionPermission } from '@/lib/auth'
import { verificarYCalcularComisiones } from '@/lib/comisiones'
import { cambiarEstadoOTSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validación con Zod
    const validationResult = cambiarEstadoOTSchema.safeParse(body)
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

    const { nuevoEstado, motivo } = validationResult.data

    const otActual = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id },
      include: {
        empleados: { select: { empleadoId: true } },
      },
    })

    if (!otActual) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    if (session.user.role === 'LAVADOR') {
      const asignado = otActual.empleados.some((e) => e.empleadoId === session.user.id)
      if (!asignado) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
    }

    const validacion = isValidEstadoTransition(
      otActual.estado as any,
      nuevoEstado as any,
      session.user.role
    )

    if (!validacion.valid) {
      console.error('[estado-route] Transición inválida')
      return NextResponse.json(
        { error: validacion.reason || 'Transición de estado no permitida' },
        { status: 400 }
      )
    }

    if (
      !hasEstadoTransitionPermission(
        session.user.role,
        otActual.estado as any,
        nuevoEstado as any
      )
    ) {
      return NextResponse.json({ error: 'Sin permisos para esta transición' }, { status: 403 })
    }

    const ot = await prisma.$transaction(async (tx) => {
      const otActualizada = await tx.ordenTrabajo.update({
        where: { id: params.id },
        data: {
          estado: nuevoEstado as any,
        },
        include: {
          servicio: true,
          extras: {
            include: {
              extra: true,
            },
          },
          empleados: {
            include: {
              empleado: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      })

      // Registrar cambio en historial
      await tx.estadoHistorial.create({
        data: {
          ordenTrabajoId: params.id,
          estadoAnterior: otActual.estado as any,
          estadoNuevo: nuevoEstado as any,
          usuarioId: session.user.id,
          fechaHora: new Date(),
        },
      })

      // Registrar en log de auditoría
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'OT_STATE_CHANGED',
          entidad: 'OrdenTrabajo',
          entidadId: params.id,
          datos: JSON.stringify({
            estadoAnterior: otActual.estado,
            estadoNuevo: nuevoEstado,
            motivo: motivo || null,
          }),
        },
      })

      return otActualizada
    })

    // Si la OT pasó a ENTREGADO, verificar si está pagada para calcular comisiones
    if (nuevoEstado === 'ENTREGADO') {
      // Obtener pagos de la OT
      const pagos = await prisma.pago.findMany({
        where: { ordenTrabajoId: params.id },
      })

      const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)

      // Si está completamente pagada, calcular comisiones
      if (totalPagado >= Number(ot.total)) {
        await verificarYCalcularComisiones(params.id)
      }
    }

    // Formatear respuesta
    const otFormateada = {
      ...ot,
      extras: ot.extras.map((e: any) => e.extra),
      empleados: ot.empleados.map((e: any) => e.empleado),
      precio: Number(ot.total),
      servicio: {
        ...ot.servicio,
        precio: Number(ot.servicio.precio),
      },
    }

    return NextResponse.json(otFormateada)
  } catch (error) {
    console.error('Error al cambiar estado de OT:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado de orden de trabajo' },
      { status: 500 }
    )
  }
}

