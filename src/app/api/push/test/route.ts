/**
 * POST: envía una notificación de PRUEBA al usuario logueado.
 * Sirve para verificar de punta a punta que los avisos llegan.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { enviarPushAUsuario, pushDisponible } from '@/lib/push'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user.role !== 'DUENO') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    if (!pushDisponible()) {
      return NextResponse.json({ error: 'Las notificaciones no están configuradas en el servidor' }, { status: 503 })
    }

    const enviados = await enviarPushAUsuario(session.user.id, {
      title: 'Lavadero — prueba',
      body: 'Los avisos están funcionando ✅',
      url: '/tablero',
      tag: 'prueba',
    })

    if (enviados === 0) {
      return NextResponse.json(
        { error: 'No hay avisos activos en este equipo. Activá los avisos primero.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ ok: true, enviados })
  } catch (error) {
    console.error('Error en push de prueba:', error)
    return NextResponse.json({ error: 'Error al enviar la prueba' }, { status: 500 })
  }
}
