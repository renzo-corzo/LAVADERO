/**
 * Reglas de negocio
 * Implementación de las reglas definidas en 03-REGLAS-DE-NEGOCIO.md
 */

import { OTEstado, UserRole } from '@/types'

/**
 * Verificar si una transición de estado es válida
 */
export function isValidEstadoTransition(
  estadoActual: OTEstado,
  estadoNuevo: OTEstado,
  userRole: UserRole
): { valid: boolean; reason?: string } {
  // RN-010 a RN-017: Transiciones válidas

  if (estadoActual === estadoNuevo) {
    return { valid: false, reason: 'El estado no ha cambiado' }
  }

  // EN_COLA → EN_PROCESO (LAVADOR, ENCARGADO, DUEÑO)
  if (estadoActual === 'EN_COLA' && estadoNuevo === 'EN_PROCESO') {
    return { valid: true }
  }

  // EN_COLA → CANCELADO (ENCARGADO, DUENO, requiere motivo)
  if (estadoActual === 'EN_COLA' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'ENCARGADO' || userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo ENCARGADO o DUEÑO pueden cancelar' }
  }

  // EN_PROCESO → LISTO (LAVADOR, ENCARGADO, DUEÑO)
  if (estadoActual === 'EN_PROCESO' && estadoNuevo === 'LISTO') {
    return { valid: true }
  }

  // EN_PROCESO → CANCELADO (ENCARGADO, DUENO, requiere motivo)
  if (estadoActual === 'EN_PROCESO' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'ENCARGADO' || userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo ENCARGADO o DUEÑO pueden cancelar' }
  }

  // LISTO → ENTREGADO (solo ENCARGADO y DUEÑO — cobro/entrega administrativa)
  if (estadoActual === 'LISTO' && estadoNuevo === 'ENTREGADO') {
    if (userRole === 'ENCARGADO' || userRole === 'DUENO') {
      return { valid: true }
    }
    return {
      valid: false,
      reason: 'Solo ENCARGADO o DUEÑO pueden marcar la OT como entregada',
    }
  }

  // LISTO → CANCELADO (solo DUENO, requiere motivo especial)
  if (estadoActual === 'LISTO' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo DUENO puede cancelar una OT LISTA' }
  }

  // ENTREGADO es final (no se puede cambiar)
  if (estadoActual === 'ENTREGADO') {
    return { valid: false, reason: 'ENTREGADO es un estado final' }
  }

  // Otras transiciones no permitidas
  return { valid: false, reason: 'Transición no permitida' }
}

/**
 * Verificar si una OT puede editarse
 */
export function canEditOT(estado: OTEstado): boolean {
  // RN-020: Solo EN_COLA o EN_PROCESO pueden editarse
  return estado === 'EN_COLA' || estado === 'EN_PROCESO'
}

/**
 * Verificar si una OT puede cancelarse
 */
export function canCancelOT(estado: OTEstado, userRole: UserRole): boolean {
  // RN-024 a RN-027
  if (estado === 'ENTREGADO') {
    return false
  }
  if (estado === 'LISTO') {
    return userRole === 'DUENO'
  }
  return userRole === 'ENCARGADO' || userRole === 'DUENO'
}

/** Datos de personalización de precio del cliente (concesionaria). */
export interface ClientePricing {
  usaMontosFijos?: boolean | null
  montosFijosServicios?: unknown // Json: { [servicioId]: number }
  montosFijosExtras?: unknown // Json: { [extraId]: number }
  descuentoPorcentaje?: number | null
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Convierte un Json arbitrario en un mapa { clave: number } descartando valores no numéricos. */
function asNumberRecord(v: unknown): Record<string, number> {
  if (!isPlainObject(v)) return {}
  const out: Record<string, number> = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[k] = val
  }
  return out
}

/**
 * Calcula el total de una OT aplicando, en este orden de prioridad:
 *  1. precioAjustado (override manual) si viene definido.
 *  2. Montos fijos por servicio/extra del cliente (si usaMontosFijos).
 *  3. Precio de catálogo + descuento porcentual del cliente.
 *
 * Fuente única de verdad usada tanto al crear como al editar una OT.
 */
export function calcularTotalOT(params: {
  servicioId: string
  precioServicio: number
  extras: Array<{ id: string; precio: number }>
  cliente?: ClientePricing | null
  precioAjustado?: number | null
}): number {
  const { servicioId, precioServicio, extras, cliente, precioAjustado } = params

  // El precio ajustado manual sobrescribe cualquier otra regla.
  if (precioAjustado !== undefined && precioAjustado !== null) {
    return precioAjustado
  }

  const usaMontosFijos = Boolean(cliente?.usaMontosFijos)
  const montosFijosServicios = asNumberRecord(cliente?.montosFijosServicios)
  const montosFijosExtras = asNumberRecord(cliente?.montosFijosExtras)

  let total = usaMontosFijos
    ? montosFijosServicios[servicioId] ?? precioServicio
    : precioServicio

  for (const extra of extras) {
    total += usaMontosFijos
      ? montosFijosExtras[extra.id] ?? extra.precio
      : extra.precio
  }

  // El descuento porcentual aplica solo si NO usa montos fijos.
  if (!usaMontosFijos && cliente?.descuentoPorcentaje) {
    total -= (total * cliente.descuentoPorcentaje) / 100
  }

  return total
}

