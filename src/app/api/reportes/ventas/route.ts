/**
 * API Route: Reporte de Ventas
 * GET: Obtener reporte de ventas por período
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { crearFechaLocal } from '@/lib/utils-fechas'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'reporte:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const clienteId = searchParams.get('clienteId') // Filtro por cliente

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'fechaDesde y fechaHasta son requeridas' },
        { status: 400 }
      )
    }

    // Normalizar fechas para evitar problemas de timezone
    // Las fechas vienen en formato YYYY-MM-DD desde el input date
    const desdeLocal = crearFechaLocal(fechaDesde)
    desdeLocal.setHours(0, 0, 0, 0)
    
    const hastaLocal = crearFechaLocal(fechaHasta)
    hastaLocal.setHours(23, 59, 59, 999)

    // Construir filtro de where
    const where: any = {
      estado: 'ENTREGADO',
      fechaIngreso: {
        gte: desdeLocal,
        lte: hastaLocal,
      },
    }

    // Agregar filtro por cliente si se especifica
    if (clienteId) {
      where.clienteId = clienteId
    }

    console.log('[Reporte Ventas] Filtros aplicados:', {
      fechaDesde,
      fechaHasta,
      desde: desdeLocal.toISOString(),
      hasta: hastaLocal.toISOString(),
      clienteId,
      where,
    })

    // Obtener OTs entregadas y pagadas en el período
    const ots = await prisma.ordenTrabajo.findMany({
      where,
      include: {
        servicio: true,
        extras: {
          include: {
            extra: true,
          },
        },
        pagos: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            descuentoPorcentaje: true,
          },
        },
      },
    })

    console.log(`[Reporte Ventas] OTs encontradas: ${ots.length}`)

    // Filtrar solo las que están completamente pagadas
    const otsPagadas = ots.filter((ot) => {
      const totalPagado = ot.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const estaPagada = totalPagado >= Number(ot.total)
      
      if (!estaPagada) {
        console.log(`[Reporte Ventas] OT ${ot.id} no pagada completamente:`, {
          total: Number(ot.total),
          totalPagado,
          pagos: ot.pagos.length,
        })
      }
      
      return estaPagada
    })

    console.log(`[Reporte Ventas] OTs completamente pagadas: ${otsPagadas.length}`)

    // Calcular totales por medio de pago
    const totalesPorMedioPago = {
      EFECTIVO: 0,
      TRANSFERENCIA: 0,
    }

    otsPagadas.forEach((ot) => {
      ot.pagos.forEach((pago) => {
        totalesPorMedioPago[pago.medioPago as 'EFECTIVO' | 'TRANSFERENCIA'] += Number(pago.monto)
      })
    })

    // Calcular servicios más vendidos
    const serviciosContador: Record<string, { nombre: string; cantidad: number; total: number }> =
      {}
    otsPagadas.forEach((ot) => {
      const servicioId = ot.servicio.id
      if (!serviciosContador[servicioId]) {
        serviciosContador[servicioId] = {
          nombre: ot.servicio.nombre,
          cantidad: 0,
          total: 0,
        }
      }
      serviciosContador[servicioId].cantidad++
      serviciosContador[servicioId].total += Number(ot.servicio.precio)
    })

    const serviciosRanking = Object.values(serviciosContador)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Calcular extras más vendidos
    const extrasContador: Record<string, { nombre: string; cantidad: number; total: number }> = {}
    otsPagadas.forEach((ot) => {
      ot.extras.forEach((extraOt) => {
        const extraId = extraOt.extra.id
        if (!extrasContador[extraId]) {
          extrasContador[extraId] = {
            nombre: extraOt.extra.nombre,
            cantidad: 0,
            total: 0,
          }
        }
        extrasContador[extraId].cantidad++
        extrasContador[extraId].total += Number(extraOt.extra.precio)
      })
    })

    const extrasRanking = Object.values(extrasContador)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Calcular total general
    const totalGeneral = otsPagadas.reduce((sum, ot) => sum + Number(ot.total), 0)

    // Ventas por día (para gráfico)
    const ventasPorDia: Record<string, number> = {}
    otsPagadas.forEach((ot) => {
      const fecha = ot.fechaIngreso.toISOString().split('T')[0]
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = 0
      }
      ventasPorDia[fecha] += Number(ot.total)
    })

    // Obtener información del cliente si se filtró
    let clienteFiltro = null
    if (clienteId && otsPagadas.length > 0 && otsPagadas[0].cliente) {
      clienteFiltro = {
        id: otsPagadas[0].cliente.id,
        nombre: otsPagadas[0].cliente.nombre,
        tipo: otsPagadas[0].cliente.tipo,
      }
    } else if (clienteId) {
      // Si se filtró por cliente pero no hay OTs, obtener el cliente de la BD
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: {
          id: true,
          nombre: true,
          tipo: true,
        },
      })
      if (cliente) {
        clienteFiltro = cliente
      }
    }

    return NextResponse.json({
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
      clienteFiltro,
      resumen: {
        totalVentas: totalGeneral,
        cantidadOTs: otsPagadas.length,
        totalesPorMedioPago,
        // Información de diagnóstico (solo en desarrollo)
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            otsEncontradas: ots.length,
            otsCompletamentePagadas: otsPagadas.length,
            otsNoPagadas: ots.length - otsPagadas.length,
          },
        }),
      },
      ventasPorDia: Object.entries(ventasPorDia)
        .map(([fecha, monto]) => ({ fecha, monto }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      serviciosRanking,
      extrasRanking,
    })
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte de ventas' },
      { status: 500 }
    )
  }
}

