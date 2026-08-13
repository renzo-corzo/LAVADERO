/**
 * Suscripción a notificaciones push.
 * POST: guarda (o actualiza) la suscripción del usuario logueado. Solo DUEÑO.
 * DELETE: borra una suscripción por endpoint (desactivar avisos en este equipo).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (session.user.role !== 'DUENO') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const endpoint: string | undefined = body?.endpoint
    const p256dh: string | undefined = body?.keys?.p256dh
    const auth: string | undefined = body?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    // upsert por endpoint: si el dispositivo ya estaba, reasigna al usuario actual
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { usuarioId: session.user.id, p256dh, auth },
      create: { usuarioId: session.user.id, endpoint, p256dh, auth },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al suscribir push:', error)
    return NextResponse.json({ error: 'Error al suscribir' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const endpoint: string | undefined = body?.endpoint
    if (!endpoint) return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 })

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, usuarioId: session.user.id },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al desuscribir push:', error)
    return NextResponse.json({ error: 'Error al desuscribir' }, { status: 500 })
  }
}
