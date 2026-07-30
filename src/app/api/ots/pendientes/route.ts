/**
 * API Route: OTs pendientes de cierre de días anteriores
 * GET: Órdenes en estado NO terminal (EN_COLA/EN_PROCESO/LISTO) cuyo ingreso
 *      fue ANTES de hoy. Son las que quedaron "colgadas" y el filtro de "hoy"
 *      del tablero esconde, así que nadie las cierra.
 *
 * Mismo scoping que /api/ots (empresa, sucursal, rol).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getOtAccessScope } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { inicioDelDiaLocal } from '@/lib/utils-fechas'
import { obtenerFechaLocal } from '@/lib/utils-fechas'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const otScope = getOtAccessScope(session.user.role)
    if (otScope === 'none') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const sucursalIdParam = request.nextUrl.searchParams.get('sucursalId')?.trim() || null

    // Inicio de hoy (local): todo lo ingresado ANTES de esto es de días anteriores
    const inicioHoy = inicioDelDiaLocal(obtenerFechaLocal(new Date()))

    const where: any = {
      estado: { in: ['EN_COLA', 'EN_PROCESO', 'LISTO'] },
      esExterna: false, // las externas no ocupan el lavadero ni se "cierran" igual
      fechaIngreso: { lt: inicioHoy },
    }
    if (scope.empresaId) where.empresaId = scope.empresaId
    if (otScope === 'assigned') where.empleados = { some: { empleadoId: session.user.id } }
    if (session.user.sucursalId) {
      where.sucursalId = session.user.sucursalId
    } else if (sucursalIdParam) {
      where.sucursalId = sucursalIdParam
    }

    const ots = await prisma.ordenTrabajo.findMany({
      where,
      select: {
        id: true,
        patente: true,
        nombreCliente: true,
        estado: true,
        fechaIngreso: true,
        total: true,
      },
      orderBy: { fechaIngreso: 'asc' },
      take: 100,
    })

    return NextResponse.json({
      total: ots.length,
      ots: ots.map((ot) => ({
        id: ot.id,
        patente: ot.patente,
        nombreCliente: ot.nombreCliente,
        estado: ot.estado,
        fechaIngreso: ot.fechaIngreso,
        total: Number(ot.total),
      })),
    })
  } catch (error) {
    console.error('Error al obtener OTs pendientes:', error)
    return NextResponse.json({ error: 'Error al obtener pendientes' }, { status: 500 })
  }
}
