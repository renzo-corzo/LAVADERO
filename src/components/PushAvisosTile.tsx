/**
 * Tile "Activar avisos" para el panel Más (solo DUEÑO).
 * - Sin activar: pide permiso + se suscribe a push.
 * - Activado: al tocar envía una notificación de prueba.
 * Se oculta si el navegador no soporta push.
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function PushAvisosTile({ onDone }: { onDone?: () => void }) {
  const { data: session } = useSession()
  const [soportado, setSoportado] = useState(false)
  const [suscripto, setSuscripto] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    setSoportado(ok)
    if (!ok) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSuscripto(!!sub))
      .catch(() => {})
  }, [])

  if (session?.user.role !== 'DUENO' || !soportado) return null

  const activar = async () => {
    setOcupado(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        toast.error('No se activaron los avisos', {
          description: 'El navegador bloqueó el permiso de notificaciones.',
        })
        return
      }
      const { key } = await fetch('/api/push/public-key').then((r) => r.json())
      if (!key) {
        toast.error('Los avisos no están configurados en el servidor todavía.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (res.ok) {
        setSuscripto(true)
        toast.success('Avisos activados en este equipo ✅')
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'No se pudieron activar los avisos')
      }
    } catch (e) {
      console.error('[push] activar:', e)
      toast.error('No se pudieron activar los avisos en este dispositivo')
    } finally {
      setOcupado(false)
      onDone?.()
    }
  }

  const probar = async () => {
    setOcupado(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) toast.success('Notificación de prueba enviada')
      else toast.error(d.error || 'No se pudo enviar la prueba')
    } finally {
      setOcupado(false)
      onDone?.()
    }
  }

  return (
    <button
      type="button"
      onClick={suscripto ? probar : activar}
      disabled={ocupado}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-aqua-line bg-aqua-bg p-3.5 text-center active:bg-white disabled:opacity-60"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal/12 text-xl">🔔</span>
      <span className="text-[11px] font-semibold text-ink">
        {suscripto ? 'Probar aviso' : 'Activar avisos'}
      </span>
    </button>
  )
}
