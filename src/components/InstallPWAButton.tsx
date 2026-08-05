/**
 * Botón "Instalar app" para el panel móvil.
 * - Android/Chrome: dispara el prompt nativo de instalación.
 * - iPhone (sin prompt): muestra el instructivo Compartir → Agregar a inicio.
 * Se oculta si la app ya está instalada (display-mode: standalone).
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function InstallPWAButton({ onDone }: { onDone?: () => void }) {
  const [instalable, setInstalable] = useState(false)
  const [instalada, setInstalada] = useState(false)

  useEffect(() => {
    // Ya instalada / abierta como app
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    setInstalada(standalone)

    if ((window as any).__deferredInstallPrompt) setInstalable(true)
    const onInstallable = () => setInstalable(true)
    const onInstalled = () => {
      setInstalada(true)
      setInstalable(false)
    }
    window.addEventListener('pwa-installable', onInstallable)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('pwa-installable', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (instalada) return null

  const esIOS = /iPhone|iPad|iPod/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )

  const instalar = async () => {
    const prompt = (window as any).__deferredInstallPrompt
    if (prompt) {
      prompt.prompt()
      await prompt.userChoice.catch(() => {})
      ;(window as any).__deferredInstallPrompt = null
      setInstalable(false)
      onDone?.()
      return
    }
    // iOS u otros sin prompt nativo
    if (esIOS) {
      toast('Instalar en iPhone', {
        description: 'Tocá Compartir (cuadro con flecha) y elegí "Agregar a inicio".',
        duration: 8000,
      })
    } else {
      toast('Instalar app', {
        description: 'Abrí el menú del navegador y elegí "Instalar app" o "Agregar a inicio".',
        duration: 8000,
      })
    }
    onDone?.()
  }

  // En Android mostramos el botón cuando es instalable; en iOS siempre (con instructivo)
  if (!instalable && !esIOS) return null

  return (
    <button
      type="button"
      onClick={instalar}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-brand/30 bg-brand/5 p-3.5 text-center active:bg-white"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal/15 text-xl">📲</span>
      <span className="text-[11px] font-semibold text-brand">Instalar app</span>
    </button>
  )
}
