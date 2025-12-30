/**
 * API Route: Cierre de Caja individual
 * GET: Obtener detalle de un cierre
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'cierre:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const cierre = await prisma.cierreCaja.findUnique({
      where: { id: params.id },
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
                estado: true,
                fechaIngreso: true,
              },
            },
          },
        },
      },
    })

    if (!cierre) {
      return NextResponse.json(
        { error: 'Cierre de caja no encontrado' },
        { status: 404 }
      )
    }

    // Obtener pagos del período para el detalle
    const pagos = await prisma.pago.findMany({
      where: {
        fechaHora: {
          gte: cierre.fechaDesde,
          lte: cierre.fechaHasta,
        },
      },
      include: {
        ordenTrabajo: {
          select: {
            id: true,
            patente: true,
            descripcionVehiculo: true,
            total: true,
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
        estado: ot.ordenTrabajo.estado,
        fechaIngreso: ot.ordenTrabajo.fechaIngreso,
      })),
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
      createdAt: cierre.createdAt,
    }

    return NextResponse.json(cierreFormateado)
  } catch (error) {
    console.error('Error al obtener cierre:', error)
    return NextResponse.json(
      { error: 'Error al obtener cierre de caja' },
      { status: 500 }
    )
  }
}

