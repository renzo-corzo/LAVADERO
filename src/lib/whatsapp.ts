/**
 * Utilidades para avisar al cliente por WhatsApp (link wa.me / esquema app).
 *
 * No envía nada automáticamente: abre WhatsApp con el mensaje pre-cargado para
 * que el operador toque "enviar". En móvil usa el esquema `whatsapp://` (abre la
 * app sin cambiar de pestaña); en escritorio usa `wa.me` en pestaña aparte.
 */

/**
 * Normaliza un teléfono argentino a formato WhatsApp (solo dígitos, con país).
 * Best-effort: el operador confirma el chat al abrirse WhatsApp.
 */
export function telefonoParaWhatsApp(tel: string | null | undefined): string | null {
  const digits = (tel || '').replace(/\D/g, '')
  if (digits.length < 8) return null
  if (digits.startsWith('54')) return digits
  const sinCero = digits.replace(/^0/, '') // quita 0 de larga distancia
  return `549${sinCero}` // 54 (país) + 9 (móvil)
}

export type VarianteMensaje = 'recibido' | 'listo'

interface DatosMensaje {
  telefono: string | null | undefined
  nombre?: string | null
  patente?: string | null
  servicio?: string | null
  variante: VarianteMensaje
}

function armarMensaje(d: DatosMensaje): string {
  const nombre = d.nombre?.trim() || 'Hola'
  const patente = d.patente ? ` (patente ${d.patente})` : ''
  if (d.variante === 'listo') {
    return (
      `¡Hola ${nombre}! ✅ Tu vehículo${patente} ya está *listo para retirar* ` +
      `en el lavadero. ¡Te esperamos!`
    )
  }
  return (
    `¡Hola ${nombre}! 🚗 Recibimos tu vehículo${patente} en el lavadero` +
    (d.servicio ? ` para *${d.servicio}*` : '') +
    `. Te avisamos apenas esté listo. ¡Gracias!`
  )
}

/** Arma los links de WhatsApp (app y web). Devuelve null si el teléfono no sirve. */
export function linksWhatsAppOT(d: DatosMensaje): { app: string; web: string } | null {
  const numero = telefonoParaWhatsApp(d.telefono)
  if (!numero) return null
  const texto = encodeURIComponent(armarMensaje(d))
  return {
    app: `whatsapp://send?phone=${numero}&text=${texto}`,
    web: `https://wa.me/${numero}?text=${texto}`,
  }
}

function esMovil(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Abre WhatsApp con el mensaje. En móvil siempre funciona (navega a la app).
 * En escritorio abre una pestaña; devuelve false si el navegador la bloqueó
 * (para que el caller ofrezca un fallback manual).
 */
export function abrirWhatsApp(links: { app: string; web: string }): boolean {
  if (esMovil()) {
    window.location.href = links.app
    return true
  }
  const w = window.open(links.web, '_blank')
  return !!w
}
