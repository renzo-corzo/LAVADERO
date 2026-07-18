/**
 * Utilidades de autenticación y permisos
 * Fuente de verdad: permisos por rol (alineado con 04-NAVEGACION-Y-PERMISOS.md)
 */

import { UserRole } from '@/types'
import type { OTEstado } from '@/types'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/config'

/**
 * Verificar si un usuario tiene permiso para una acción
 */
export function hasPermission(userRole: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['*'],
    DUENO: ['*'],
    ENCARGADO: [
      'ot:create',
      'ot:edit',
      'ot:view',
      'ot:cancel',
      'ot:change-state:process',
      'ot:change-state:ready',
      'ot:change-state:delivered',
      'pago:create',
      'pago:view',
      'cierre:create',
      'cierre:view',
      'comision:view',
      'comision:liquidar',
      'reporte:view',
      'servicio:manage',
      'stock:manage',
      'portal:manage',
      'cliente:view',
      'cliente:create',
      'cliente:edit',
      'cliente:delete',
    ],
    LAVADOR: ['ot:change-state:process', 'ot:change-state:ready'],
    CLIENTE: ['portal:report:view'],
  }

  const userPerms = permissions[userRole] || []
  return userPerms.includes('*') || userPerms.includes(action)
}

/**
 * Comprueba si el rol puede ejecutar una transición concreta (además de reglas de negocio).
 */
export function hasEstadoTransitionPermission(
  role: UserRole,
  estadoActual: OTEstado,
  estadoNuevo: OTEstado
): boolean {
  if (estadoActual === 'EN_COLA' && estadoNuevo === 'EN_PROCESO') {
    return hasPermission(role, 'ot:change-state:process')
  }
  if (estadoActual === 'EN_PROCESO' && estadoNuevo === 'LISTO') {
    return hasPermission(role, 'ot:change-state:ready')
  }
  if (estadoActual === 'LISTO' && estadoNuevo === 'ENTREGADO') {
    return hasPermission(role, 'ot:change-state:delivered')
  }
  // Cancelaciones y otros: ot:cancel u omisión (reglas-negocio filtra por rol)
  if (estadoNuevo === 'CANCELADO') {
    return hasPermission(role, 'ot:cancel')
  }
  return false
}

/** Alcance de listado/consulta de OTs */
export type OtAccessScope = 'all' | 'assigned' | 'none'

export function getOtAccessScope(role: UserRole): OtAccessScope {
  if (hasPermission(role, 'ot:view')) return 'all'
  if (role === 'LAVADOR') return 'assigned'
  return 'none'
}

/**
 * Obtener sesión del servidor
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Obtener usuario actual desde sesión.
 * Devuelve solo lo que el JWT/sesión realmente contiene (no fabrica datos:
 * `usuario` y `activo` no viven en el token, por eso no se exponen aquí).
 */
export async function getCurrentUser() {
  const session = await getCurrentSession()
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    nombre: session.user.name || '',
    rol: session.user.role,
    clienteId: session.user.clienteId ?? null,
  }
}
