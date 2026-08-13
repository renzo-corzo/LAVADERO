/**
 * Envío de notificaciones Web Push (server-side).
 * Usa VAPID (claves en env). Si una suscripción está vencida (410/404) se borra.
 *
 * Env requeridas: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

import webpush from 'web-push'
import { prisma } from '@/lib/db/client'

let configurado = false

function configurarVapid(): boolean {
  if (configurado) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@lavadero.app'
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  configurado = true
  return true
}

export function pushDisponible(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  url?: string // a dónde ir al tocar la notificación
  tag?: string // agrupa/reemplaza notificaciones del mismo tipo
}

/**
 * Envía una notificación a TODAS las suscripciones de un usuario (varios
 * dispositivos). Devuelve cuántas se enviaron OK. Limpia las vencidas.
 */
export async function enviarPushAUsuario(usuarioId: string, payload: PushPayload): Promise<number> {
  if (!configurarVapid()) return 0
  const subs = await prisma.pushSubscription.findMany({ where: { usuarioId } })
  if (subs.length === 0) return 0

  const data = JSON.stringify(payload)
  let enviados = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        )
        enviados++
      } catch (err: any) {
        // 410 Gone / 404: la suscripción ya no existe → borrarla
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {})
        } else {
          console.error('[push] error enviando:', err?.statusCode, err?.body || err?.message)
        }
      }
    })
  )

  return enviados
}
