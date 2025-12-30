/**
 * API Route: Reporte de Métricas Operativas
 * GET: Obtener métricas operativas por período
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

    if (!hasPermission(session.user.role, 'reporte:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'fechaDesde y fechaHasta son requeridas' },
        { status: 400 }
      )
    }

    const desde = new Date(fechaDesde)
    const hasta = new Date(fechaHasta)
    hasta.setHours(23, 59, 59, 999)

    // Obtener OTs del período
    const ots = await prisma.ordenTrabajo.findMany({
      where: {
        fechaIngreso: {
          gte: desde,
          lte: hasta,
        },
      },
      include: {
        estadosHistorial: {
          orderBy: { fechaHora: 'asc' },
        },
      },
    })

    // Contar por estado
    const porEstado = {
      EN_COLA: 0,
      EN_PROCESO: 0,
      LISTO: 0,
      ENTREGADO: 0,
      CANCELADO: 0,
    }

    ots.forEach((ot) => {
      porEstado[ot.estado as keyof typeof porEstado]++
    })

    // Calcular tiempos promedio por estado
    const tiemposPorEstado: Record<string, number[]> = {
      EN_COLA: [],
      EN_PROCESO: [],
      LISTO: [],
      TOTAL: [],
    }

    ots.forEach((ot) => {
      if (ot.estadosHistorial.length >= 2) {
        const historial = ot.estadosHistorial
        const fechaIngreso = new Date(ot.fechaIngreso)

        // Tiempo en cada estado
        for (let i = 0; i < historial.length - 1; i++) {
          const estado = historial[i].estadoNuevo
          const inicio = i === 0 ? fechaIngreso : new Date(historial[i].fechaHora)
          const fin = new Date(historial[i + 1].fechaHora)
          const minutos = (fin.getTime() - inicio.getTime()) / (1000 * 60)

          if (estado === 'EN_COLA' || estado === 'EN_PROCESO' || estado === 'LISTO') {
            if (!tiemposPorEstado[estado]) {
              tiemposPorEstado[estado] = []
            }
            tiemposPorEstado[estado].push(minutos)
          }
        }

        // Tiempo total (desde ingreso hasta último cambio)
        if (historial.length > 0) {
          const ultimoEstado = historial[historial.length - 1]
          const tiempoTotal = (new Date(ultimoEstado.fechaHora).getTime() - fechaIngreso.getTime()) / (1000 * 60)
          tiemposPorEstado.TOTAL.push(tiempoTotal)
        }
      }
    })

    const promedios = Object.entries(tiemposPorEstado).reduce(
      (acc, [estado, tiempos]) => {
        if (tiempos.length > 0) {
          acc[estado] = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length
        } else {
          acc[estado] = 0
        }
        return acc
      },
      {} as Record<string, number>
    )

    // OTs canceladas con motivos (simplificado - habría que agregar motivo en cancelación)
    const canceladas = ots.filter((ot) => ot.estado === 'CANCELADO')

    return NextResponse.json({
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
      resumen: {
        totalOTs: ots.length,
        porEstado,
        canceladas: canceladas.length,
      },
      tiemposPromedio: {
        enCola: Math.round(promedios.EN_COLA || 0),
        enProceso: Math.round(promedios.EN_PROCESO || 0),
        listo: Math.round(promedios.LISTO || 0),
        total: Math.round(promedios.TOTAL || 0),
      },
    })
  } catch (error) {
    console.error('Error al obtener métricas operativas:', error)
    return NextResponse.json(
      { error: 'Error al obtener métricas operativas' },
      { status: 500 }
    )
  }
}

