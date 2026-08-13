/**
 * Cron: recordatorio de OTs sin cerrar de días anteriores.
 * Para cada DUEÑO con avisos activos, cuenta las OTs de su empresa que quedaron
 * abiertas (EN_COLA/EN_PROCESO/LISTO con ingreso anterior a hoy) y, si hay,
 * le manda una notificación push.
 *
 * Protegido con CRON_SECRET. Llamar con:
 *   Authorization: Bearer <CRON_SECRET>   o   ?secret=<CRON_SECRET>
 * Ideal para un Render Cron Job o cron externo (ej. una vez a la tarde).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { inicioDelDiaLocal, obtenerFechaLocal } from '@/lib/utils-fechas'
import { enviarPushAUsuario, pushDisponible } from '@/lib/push'

export const dynamic = 'force-dynamic'

function autorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const query = request.nextUrl.searchParams.get('secret')
  return bearer === secret || query === secret
}

async function ejecutar(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!pushDisponible()) {
    return NextResponse.json({ error: 'Push no configurado' }, { status: 503 })
  }

  const inicioHoy = inicioDelDiaLocal(obtenerFechaLocal(new Date()))

  // Dueños con al menos una suscripción push activa
  const duenos = await prisma.usuario.findMany({
    where: { rol: 'DUENO', activo: true, pushSubscriptions: { some: {} } },
    select: { id: true, empresaId: true },
  })

  let notificados = 0
  const detalle: { usuarioId: string; pendientes: number; enviados: number }[] = []

  for (const d of duenos) {
    if (!d.empresaId) continue
    const pendientes = await prisma.ordenTrabajo.count({
      where: {
        empresaId: d.empresaId,
        estado: { in: ['EN_COLA', 'EN_PROCESO', 'LISTO'] },
        esExterna: false,
        fechaIngreso: { lt: inicioHoy },
      },
    })
    if (pendientes === 0) continue

    const enviados = await enviarPushAUsuario(d.id, {
      title: 'Órdenes sin cerrar',
      body:
        pendientes === 1
          ? 'Tenés 1 auto de días anteriores sin cerrar. Tocá para revisarlo.'
          : `Tenés ${pendientes} autos de días anteriores sin cerrar. Tocá para revisarlos.`,
      url: '/tablero',
      tag: 'pendientes-cierre',
    })
    if (enviados > 0) notificados++
    detalle.push({ usuarioId: d.id, pendientes, enviados })
  }

  return NextResponse.json({ ok: true, duenosRevisados: duenos.length, notificados, detalle })
}

export async function POST(request: NextRequest) {
  return ejecutar(request)
}
export async function GET(request: NextRequest) {
  return ejecutar(request)
}
