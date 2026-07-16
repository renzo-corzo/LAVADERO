/**
 * API Route: Reporte de Comisiones
 * GET: Obtener reporte de comisiones por período
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { crearFechaLocal } from '@/lib/utils-fechas'

export const dynamic = 'force-dynamic'

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
    const clienteId = searchParams.get('clienteId') // Filtro por cliente

    // Scoping multi-tenant: comisiones solo de OTs de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const where: any = {}
    if (scope.empresaId) {
      where.ordenTrabajo = { empresaId: scope.empresaId }
    }

    if (fechaDesde && fechaHasta) {
      const desdeLocal = crearFechaLocal(fechaDesde)
      desdeLocal.setHours(0, 0, 0, 0)
      
      const hastaLocal = crearFechaLocal(fechaHasta)
      hastaLocal.setHours(23, 59, 59, 999)
      
      where.fechaGeneracion = {
        gte: desdeLocal,
        lte: hastaLocal,
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
            clienteId: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
              },
            },
          },
        },
      },
      orderBy: { fechaGeneracion: 'desc' },
    })

    // Filtrar por cliente después de obtener (ya que Prisma no permite filtrar por relación anidada fácilmente)
    const comisionesFiltradas = clienteId
      ? comisiones.filter((c) => c.ordenTrabajo.clienteId === clienteId)
      : comisiones

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

    comisionesFiltradas.forEach((c) => {
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
      pendientes: comisionesFiltradas.filter((c) => c.estado === 'PENDIENTE').length,
      liquidadas: comisionesFiltradas.filter((c) => c.estado === 'LIQUIDADA').length,
      totalPendiente: comisionesFiltradas
        .filter((c) => c.estado === 'PENDIENTE')
        .reduce((sum, c) => sum + Number(c.monto), 0),
      totalLiquidadas: comisionesFiltradas
        .filter((c) => c.estado === 'LIQUIDADA')
        .reduce((sum, c) => sum + Number(c.monto), 0),
    }

    return NextResponse.json({
      periodo: fechaDesde && fechaHasta ? { desde: fechaDesde, hasta: fechaHasta } : null,
      totales,
      porEmpleado: Object.values(porEmpleado),
      comisiones: comisionesFiltradas.map((c) => ({
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

