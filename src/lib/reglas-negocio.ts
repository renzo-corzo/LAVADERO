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

/**
 * Calcular total de una OT
 */
export function calcularTotalOT(
  precioServicio: number,
  preciosExtras: number[],
  precioAjustado?: number
): number {
  if (precioAjustado !== undefined) {
    return precioAjustado
  }
  return precioServicio + preciosExtras.reduce((sum, precio) => sum + precio, 0)
}

