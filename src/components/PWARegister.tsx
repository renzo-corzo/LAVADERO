/**
 * Registra el service worker de la PWA (solo en cliente y en producción-like).
 * También expone el prompt de instalación de Android vía un evento global
 * que el botón "Instalar app" puede usar.
 */

'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Registrar el SW (Next sirve /sw.js desde public en cualquier entorno)
    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('[PWA] No se pudo registrar el service worker:', err)
      })
    }
    // Esperar a que la página cargue para no competir con el arranque
    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar)

    // Guardar el prompt de instalación (Android/Chrome) para dispararlo luego
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      ;(window as any).__deferredInstallPrompt = e
      window.dispatchEvent(new Event('pwa-installable'))
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => {
      window.removeEventListener('load', registrar)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  return null
}
