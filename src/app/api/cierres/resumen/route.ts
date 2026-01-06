/**
 * API Route: Resumen de Cierre (pre-cierre)
 * GET: Obtener resumen de pagos para un período antes de cerrar
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

    if (!hasPermission(session.user.role, 'cierre:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'fechaDesde y fechaHasta son obligatorias' },
        { status: 400 }
      )
    }

    const fechaInicio = new Date(fechaDesde)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaHasta)
    fechaFin.setHours(23, 59, 59, 999)

    // Obtener pagos del período
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
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaHora: 'desc',
      },
    })

    // Calcular totales
    let totalEfectivo = 0
    let totalTransferencia = 0
    const otsCobradasIds = new Set<string>()
    const otsDetalle: any[] = []

    pagos.forEach((pago) => {
      if (pago.medioPago === 'EFECTIVO') {
        totalEfectivo += Number(pago.monto)
      } else if (pago.medioPago === 'TRANSFERENCIA') {
        totalTransferencia += Number(pago.monto)
      }

      if (!otsCobradasIds.has(pago.ordenTrabajoId)) {
        otsCobradasIds.add(pago.ordenTrabajoId)
        otsDetalle.push({
          id: pago.ordenTrabajo.id,
          patente: pago.ordenTrabajo.patente,
          descripcionVehiculo: pago.ordenTrabajo.descripcionVehiculo,
          total: Number(pago.ordenTrabajo.total),
          estado: pago.ordenTrabajo.estado,
        })
      }
    })

    const totalGeneral = totalEfectivo + totalTransferencia

    // Verificar OTs entregadas sin pago
    const otsEntregadasSinPago = await prisma.ordenTrabajo.findMany({
      where: {
        estado: 'ENTREGADO',
        fechaIngreso: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        id: {
          notIn: Array.from(otsCobradasIds),
        },
      },
      select: {
        id: true,
        patente: true,
        descripcionVehiculo: true,
        total: true,
      },
    })

    return NextResponse.json({
      resumen: {
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin,
        totalEfectivo,
        totalTransferencia,
        totalGeneral,
        cantidadPagos: pagos.length,
        cantidadOTs: otsCobradasIds.size,
      },
      pagos: pagos.map((pago) => ({
        id: pago.id,
        monto: Number(pago.monto),
        medioPago: pago.medioPago,
        referencia: pago.referencia,
        fechaHora: pago.fechaHora,
        ot: {
          id: pago.ordenTrabajo.id,
          patente: pago.ordenTrabajo.patente,
          descripcionVehiculo: pago.ordenTrabajo.descripcionVehiculo,
          total: Number(pago.ordenTrabajo.total),
        },
        usuario: {
          id: pago.usuario.id,
          nombre: pago.usuario.nombre,
        },
      })),
      otsCobradas: otsDetalle,
      advertencias: {
        otsEntregadasSinPago: otsEntregadasSinPago.map((ot) => ({
          id: ot.id,
          patente: ot.patente,
          descripcionVehiculo: ot.descripcionVehiculo,
          total: Number(ot.total),
        })),
      },
    })
  } catch (error) {
    console.error('Error al obtener resumen:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen de cierre' },
      { status: 500 }
    )
  }
}




