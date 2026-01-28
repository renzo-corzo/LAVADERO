/**
 * API Route: Liquidar Comisiones
 * POST: Liquidar comisiones pendientes de un empleado en un período
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'comision:liquidar')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { empleadoId, fechaDesde, fechaHasta } = body

    if (!empleadoId || !fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: empleadoId, fechaDesde, fechaHasta' },
        { status: 400 }
      )
    }

    // Validar que el empleado existe
    const empleado = await prisma.usuario.findUnique({
      where: { id: empleadoId },
    })

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Validar fechas
    const desde = new Date(fechaDesde)
    const hasta = new Date(fechaHasta)
    hasta.setHours(23, 59, 59, 999)

    if (desde > hasta) {
      return NextResponse.json(
        { error: 'La fecha desde debe ser anterior a la fecha hasta' },
        { status: 400 }
      )
    }

    // Obtener comisiones pendientes del empleado en el período
    const comisionesPendientes = await prisma.comision.findMany({
      where: {
        empleadoId,
        estado: 'PENDIENTE',
        fechaGeneracion: {
          gte: desde,
          lte: hasta,
        },
      },
    })

    if (comisionesPendientes.length === 0) {
      return NextResponse.json(
        { error: 'No hay comisiones pendientes para liquidar en el período seleccionado' },
        { status: 400 }
      )
    }

    // Calcular monto total
    const montoTotal = comisionesPendientes.reduce((sum, c) => sum + Number(c.monto), 0)

    // Crear liquidación y actualizar comisiones en una transacción
    const liquidacion = await prisma.$transaction(async (tx) => {
      // Crear liquidación
      const nuevaLiquidacion = await tx.liquidacionComision.create({
        data: {
          empleadoId,
          fechaDesde: desde,
          fechaHasta: hasta,
          montoTotal,
          usuarioId: session.user.id,
        },
      })

      // Actualizar comisiones a LIQUIDADA y asociarlas a la liquidación
      for (const comision of comisionesPendientes) {
        await tx.comision.update({
          where: { id: comision.id },
          data: {
            estado: 'LIQUIDADA',
            fechaLiquidacion: new Date(),
            usuarioLiquidacionId: session.user.id,
          },
        })

        // Asociar comisión a la liquidación
        await tx.liquidacionComisionComision.create({
          data: {
            liquidacionId: nuevaLiquidacion.id,
            comisionId: comision.id,
          },
        })
      }

      return nuevaLiquidacion
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'COMISIONES_LIQUIDADAS',
        entidad: 'LiquidacionComision',
        entidadId: liquidacion.id,
        datos: JSON.stringify({
          empleadoId,
          fechaDesde,
          fechaHasta,
          montoTotal,
          cantidadComisiones: comisionesPendientes.length,
        }),
      },
    })

    return NextResponse.json({
      id: liquidacion.id,
      empleadoId,
      fechaDesde: desde,
      fechaHasta: hasta,
      montoTotal: Number(montoTotal),
      cantidadComisiones: comisionesPendientes.length,
    })
  } catch (error) {
    console.error('Error al liquidar comisiones:', error)
    return NextResponse.json(
      { error: 'Error al liquidar comisiones' },
      { status: 500 }
    )
  }
}





