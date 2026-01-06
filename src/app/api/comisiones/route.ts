/**
 * API Route: Comisiones
 * GET: Listar comisiones (filtradas por empleado, estado, etc.)
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

    if (!hasPermission(session.user.role, 'comision:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const empleadoId = searchParams.get('empleadoId')
    const estado = searchParams.get('estado') // PENDIENTE | LIQUIDADA
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (empleadoId) {
      where.empleadoId = empleadoId
    }

    if (estado) {
      where.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      where.fechaGeneracion = {}
      if (fechaDesde) {
        where.fechaGeneracion.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta)
        fechaHastaDate.setHours(23, 59, 59, 999)
        where.fechaGeneracion.lte = fechaHastaDate
      }
    }

    const comisiones = await prisma.comision.findMany({
      where,
      include: {
        ordenTrabajo: {
          select: {
            id: true,
            patente: true,
            nombreCliente: true,
            total: true,
            fechaIngreso: true,
            servicio: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        empleado: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
          },
        },
      },
      orderBy: { fechaGeneracion: 'desc' },
    })

    return NextResponse.json(
      comisiones.map((c) => ({
        ...c,
        monto: Number(c.monto),
        porcentaje: Number(c.porcentaje),
        ordenTrabajo: {
          ...c.ordenTrabajo,
          total: Number(c.ordenTrabajo.total),
        },
      }))
    )
  } catch (error) {
    console.error('Error al obtener comisiones:', error)
    return NextResponse.json(
      { error: 'Error al obtener comisiones' },
      { status: 500 }
    )
  }
}




