/**
 * API Route: Cierres de Caja
 * GET: Listar cierres de caja
 * POST: Crear nuevo cierre de caja
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

    if (!hasPermission(session.user.role, 'cierre:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const desde = searchParams.get('desde') // formato: YYYY-MM-DD
    const hasta = searchParams.get('hasta') // formato: YYYY-MM-DD

    const where: any = {}
    if (desde) {
      const fechaDesde = new Date(desde)
      fechaDesde.setHours(0, 0, 0, 0)
      where.fechaCierre = { gte: fechaDesde }
    }
    if (hasta) {
      const fechaHasta = new Date(hasta)
      fechaHasta.setHours(23, 59, 59, 999)
      where.fechaCierre = {
        ...where.fechaCierre,
        lte: fechaHasta,
      }
    }

    const cierres = await prisma.cierreCaja.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        ots: {
          include: {
            ordenTrabajo: {
              select: {
                id: true,
                patente: true,
                descripcionVehiculo: true,
                total: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaCierre: 'desc',
      },
    })

    // Formatear respuesta
    const cierresFormateados = cierres.map((cierre) => ({
      id: cierre.id,
      fechaDesde: cierre.fechaDesde,
      fechaHasta: cierre.fechaHasta,
      fechaCierre: cierre.fechaCierre,
      totalEfectivo: Number(cierre.totalEfectivo),
      totalTransferencia: Number(cierre.totalTransferencia),
      totalGeneral: Number(cierre.totalGeneral),
      observaciones: cierre.observaciones,
      usuarioId: cierre.usuarioId,
      usuario: {
        id: cierre.usuario.id,
        nombre: cierre.usuario.nombre,
      },
      ots: cierre.ots.map((ot) => ({
        id: ot.ordenTrabajo.id,
        patente: ot.ordenTrabajo.patente,
        descripcionVehiculo: ot.ordenTrabajo.descripcionVehiculo,
        total: Number(ot.ordenTrabajo.total),
      })),
      createdAt: cierre.createdAt,
    }))

    return NextResponse.json(cierresFormateados)
  } catch (error) {
    console.error('Error al obtener cierres:', error)
    return NextResponse.json(
      { error: 'Error al obtener cierres de caja' },
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

    if (!hasPermission(session.user.role, 'cierre:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { fechaDesde, fechaHasta, observaciones } = body

    // Validaciones
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Fecha desde y fecha hasta son obligatorias' },
        { status: 400 }
      )
    }

    const fechaInicio = new Date(fechaDesde)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaHasta)
    fechaFin.setHours(23, 59, 59, 999)

    if (fechaInicio > fechaFin) {
      return NextResponse.json(
        { error: 'La fecha desde no puede ser mayor que la fecha hasta' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un cierre para este período (opcional, se puede permitir solapamiento)
    // Por ahora no validamos solapamiento para permitir flexibilidad

    // Obtener todos los pagos del período
    const pagos = await prisma.pago.findMany({
      where: {
        fechaHora: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        ordenTrabajo: {
          select: {
            id: true,
            patente: true,
            descripcionVehiculo: true,
            total: true,
            estado: true,
          },
        },
      },
    })

    // Calcular totales por medio de pago
    let totalEfectivo = 0
    let totalTransferencia = 0
    const otsCobradasIds = new Set<string>()

    pagos.forEach((pago) => {
      if (pago.medioPago === 'EFECTIVO') {
        totalEfectivo += Number(pago.monto)
      } else if (pago.medioPago === 'TRANSFERENCIA') {
        totalTransferencia += Number(pago.monto)
      }
      otsCobradasIds.add(pago.ordenTrabajoId)
    })

    const totalGeneral = totalEfectivo + totalTransferencia

    // Obtener OTs únicas que tienen pagos en el período
    const otsCobradas = Array.from(otsCobradasIds)

    // Crear cierre con transacción
    const cierre = await prisma.$transaction(async (tx) => {
      const nuevoCierre = await tx.cierreCaja.create({
        data: {
          fechaDesde: fechaInicio,
          fechaHasta: fechaFin,
          fechaCierre: new Date(),
          totalEfectivo,
          totalTransferencia,
          totalGeneral,
          observaciones: observaciones || null,
          usuarioId: session.user.id,
          ots: {
            create: otsCobradas.map((otId) => ({
              ordenTrabajoId: otId,
            })),
          },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
          ots: {
            include: {
              ordenTrabajo: {
                select: {
                  id: true,
                  patente: true,
                  descripcionVehiculo: true,
                  total: true,
                },
              },
            },
          },
        },
      })

      // Registrar en log de auditoría
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'CIERRE_CAJA_CREATED',
          entidad: 'CierreCaja',
          entidadId: nuevoCierre.id,
          datos: JSON.stringify({
            fechaDesde: fechaInicio,
            fechaHasta: fechaFin,
            totalEfectivo,
            totalTransferencia,
            totalGeneral,
            cantidadOTs: otsCobradas.length,
          }),
        },
      })

      return nuevoCierre
    })

    // Formatear respuesta
    const cierreFormateado = {
      id: cierre.id,
      fechaDesde: cierre.fechaDesde,
      fechaHasta: cierre.fechaHasta,
      fechaCierre: cierre.fechaCierre,
      totalEfectivo: Number(cierre.totalEfectivo),
      totalTransferencia: Number(cierre.totalTransferencia),
      totalGeneral: Number(cierre.totalGeneral),
      observaciones: cierre.observaciones,
      usuarioId: cierre.usuarioId,
      usuario: {
        id: cierre.usuario.id,
        nombre: cierre.usuario.nombre,
      },
      ots: cierre.ots.map((ot) => ({
        id: ot.ordenTrabajo.id,
        patente: ot.ordenTrabajo.patente,
        descripcionVehiculo: ot.ordenTrabajo.descripcionVehiculo,
        total: Number(ot.ordenTrabajo.total),
      })),
      createdAt: cierre.createdAt,
    }

    return NextResponse.json(cierreFormateado, { status: 201 })
  } catch (error) {
    console.error('Error al crear cierre:', error)
    return NextResponse.json(
      { error: 'Error al crear cierre de caja' },
      { status: 500 }
    )
  }
}





