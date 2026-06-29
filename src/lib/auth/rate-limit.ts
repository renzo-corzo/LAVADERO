/**
 * Rate limiting para el login (defensa básica contra fuerza bruta).
 *
 * Implementación en memoria del proceso: simple y sin dependencias, suficiente
 * para un despliegue de instancia única. En entornos serverless con múltiples
 * instancias (p. ej. varias lambdas), el estado NO se comparte entre ellas, por
 * lo que conviene migrar a un store compartido (Redis/Upstash) si se escala.
 */

interface IntentoLogin {
  fallos: number
  primerFalloEn: number
  bloqueadoHasta?: number
}

const MAX_FALLOS = 5
const VENTANA_MS = 15 * 60 * 1000 // 15 minutos para acumular fallos
const BLOQUEO_MS = 15 * 60 * 1000 // 15 minutos de bloqueo al superar el máximo

const intentos = new Map<string, IntentoLogin>()

/** Evita crecimiento ilimitado del Map descartando entradas viejas. */
function limpiarExpirados(ahora: number): void {
  for (const [clave, dato] of intentos) {
    const expiraEn = dato.bloqueadoHasta ?? dato.primerFalloEn + VENTANA_MS
    if (ahora > expiraEn) intentos.delete(clave)
  }
}

/**
 * Indica si la clave (usuario/IP) puede intentar autenticarse.
 * @returns allowed=false con retryAfterMs si está bloqueada.
 */
export function checkLoginRateLimit(clave: string): {
  allowed: boolean
  retryAfterMs?: number
} {
  const ahora = Date.now()
  const dato = intentos.get(clave)
  if (!dato) return { allowed: true }

  if (dato.bloqueadoHasta && ahora < dato.bloqueadoHasta) {
    return { allowed: false, retryAfterMs: dato.bloqueadoHasta - ahora }
  }
  return { allowed: true }
}

/** Registra un intento fallido y activa el bloqueo al superar el umbral. */
export function registrarFalloLogin(clave: string): void {
  const ahora = Date.now()
  limpiarExpirados(ahora)

  const dato = intentos.get(clave)
  if (!dato || ahora > dato.primerFalloEn + VENTANA_MS) {
    intentos.set(clave, { fallos: 1, primerFalloEn: ahora })
    return
  }

  dato.fallos += 1
  if (dato.fallos >= MAX_FALLOS) {
    dato.bloqueadoHasta = ahora + BLOQUEO_MS
  }
  intentos.set(clave, dato)
}

/** Limpia el estado tras un login exitoso. */
export function registrarLoginExitoso(clave: string): void {
  intentos.delete(clave)
}
