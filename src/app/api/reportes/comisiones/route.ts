/**
 * API Route: Reporte de Comisiones
 * GET: Obtener reporte de comisiones por período
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
    const empleadoId = searchParams.get('empleadoId')

    const where: any = {}

    if (fechaDesde && fechaHasta) {
      const desde = new Date(fechaDesde)
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      where.fechaGeneracion = {
        gte: desde,
        lte: hasta,
      }
    }

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    // Obtener comisiones
    const comisiones = await prisma.comision.findMany({
      where,
      include: {
        empleado: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
          },
        },
        ordenTrabajo: {
          select: {
            id: true,
            patente: true,
            total: true,
          },
        },
      },
      orderBy: { fechaGeneracion: 'desc' },
    })

    // Agrupar por empleado
    const porEmpleado: Record<
      string,
      {
        empleado: { id: string; nombre: string; usuario: string }
        pendientes: number
        liquidadas: number
        totalPendiente: number
        totalLiquidadas: number
        cantidad: number
      }
    > = {}

    comisiones.forEach((c) => {
      if (!porEmpleado[c.empleadoId]) {
        porEmpleado[c.empleadoId] = {
          empleado: c.empleado,
          pendientes: 0,
          liquidadas: 0,
          totalPendiente: 0,
          totalLiquidadas: 0,
          cantidad: 0,
        }
      }

      porEmpleado[c.empleadoId].cantidad++
      if (c.estado === 'PENDIENTE') {
        porEmpleado[c.empleadoId].pendientes++
        porEmpleado[c.empleadoId].totalPendiente += Number(c.monto)
      } else {
        porEmpleado[c.empleadoId].liquidadas++
        porEmpleado[c.empleadoId].totalLiquidadas += Number(c.monto)
      }
    })

    // Calcular totales generales
    const totales = {
      pendientes: comisiones.filter((c) => c.estado === 'PENDIENTE').length,
      liquidadas: comisiones.filter((c) => c.estado === 'LIQUIDADA').length,
      totalPendiente: comisiones
        .filter((c) => c.estado === 'PENDIENTE')
        .reduce((sum, c) => sum + Number(c.monto), 0),
      totalLiquidadas: comisiones
        .filter((c) => c.estado === 'LIQUIDADA')
        .reduce((sum, c) => sum + Number(c.monto), 0),
    }

    return NextResponse.json({
      periodo: fechaDesde && fechaHasta ? { desde: fechaDesde, hasta: fechaHasta } : null,
      totales,
      porEmpleado: Object.values(porEmpleado),
      comisiones: comisiones.map((c) => ({
        ...c,
        monto: Number(c.monto),
        porcentaje: Number(c.porcentaje),
      })),
    })
  } catch (error) {
    console.error('Error al obtener reporte de comisiones:', error)
    return NextResponse.json(
      { error: 'Error al obtener reporte de comisiones' },
      { status: 500 }
    )
  }
}

