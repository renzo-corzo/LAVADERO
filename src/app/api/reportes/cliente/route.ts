/**
 * API: Reporte por Concesionaria (Portal Cliente)
 * - CLIENTE: solo puede ver su propia concesionaria (session.user.clienteId)
 * - DUENO/ENCARGADO: puede ver cualquier concesionaria pasando clienteId
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'

export const dynamic = 'force-dynamic'

function parseDateYYYYMMDD(s: string): Date | null {
  // Espera YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00.000`)
  return isNaN(d.getTime()) ? null : d
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = session.user.role
    const { searchParams } = request.nextUrl

    const desdeStr = searchParams.get('desde') // YYYY-MM-DD
    const hastaStr = searchParams.get('hasta') // YYYY-MM-DD
    const estadoRaw = searchParams.get('estado')
    const estado = estadoRaw && estadoRaw.trim() ? estadoRaw.trim() : null

    // Resolver clienteId según rol
    let clienteId: string | null = null
    if (role === 'CLIENTE') {
      if (!hasPermission(role, 'portal:report:view')) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      clienteId = session.user.clienteId || null
    } else {
      // Internos
      if (!hasPermission(role, 'reporte:view') && !hasPermission(role, 'portal:manage')) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      clienteId = searchParams.get('clienteId')
    }

    if (!clienteId) {
      return NextResponse.json({ error: 'Falta clienteId' }, { status: 400 })
    }

    // Rango de fechas (por defecto últimos 30 días)
    const hoy = new Date()
    const hace30 = new Date()
    hace30.setDate(hoy.getDate() - 30)

    const desde = desdeStr ? parseDateYYYYMMDD(desdeStr) : hace30
    const hasta = hastaStr ? parseDateYYYYMMDD(hastaStr) : hoy

    if (!desde || !hasta) {
      return NextResponse.json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' }, { status: 400 })
    }

    // hasta fin del día
    const hastaFin = new Date(hasta)
    hastaFin.setHours(23, 59, 59, 999)

    // Scoping multi-tenant: el cliente consultado debe ser de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
      select: { id: true, nombre: true, tipo: true, activo: true },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const ots = await prisma.ordenTrabajo.findMany({
      where: {
        clienteId,
        ...(estado ? { estado: estado as any } : {}),
        fechaIngreso: {
          gte: desde,
          lte: hastaFin,
        },
      },
      include: {
        servicio: { select: { nombre: true } },
        extras: { include: { extra: { select: { nombre: true } } } },
      },
      orderBy: { fechaIngreso: 'desc' },
    })

    const filas = ots.map((ot) => ({
      id: ot.id,
      fechaIngreso: ot.fechaIngreso,
      patente: ot.patente,
      nombreCliente: ot.nombreCliente,
      servicio: ot.servicio.nombre,
      extras: ot.extras.map((e) => e.extra.nombre),
      estado: ot.estado,
      total: Number(ot.total),
    }))

    const totalGeneral = filas.reduce((sum, f) => sum + Number(f.total || 0), 0)

    return NextResponse.json({
      cliente,
      filtro: {
        desde: desde.toISOString().slice(0, 10),
        hasta: hasta.toISOString().slice(0, 10),
        estado: estado || 'TODOS',
      },
      resumen: {
        cantidadOTs: filas.length,
        totalGeneral,
      },
      ots: filas,
    })
  } catch (error) {
    console.error('Error en reporte cliente:', error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}

