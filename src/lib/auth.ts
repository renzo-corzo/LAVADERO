/**
 * Utilidades de autenticación y permisos
 */

import { UserRole } from '@/types'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/config'

/**
 * Verificar si un usuario tiene permiso para una acción
 * Basado en reglas de negocio (04-NAVEGACION-Y-PERMISOS.md)
 */
export function hasPermission(userRole: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    DUENO: ['*'], // Todos los permisos (incluye usuario:*)
    ENCARGADO: [
      'ot:create',
      'ot:edit',
      'ot:view',
      'ot:cancel',
      'pago:create',
      'pago:view',
      'cierre:create',
      'cierre:view',
      'comision:view',
      'comision:liquidar',
      'comision:config',
      'reporte:view',
      'servicio:manage',
    ],
    LAVADOR: [
      'ot:create',
      'ot:view:assigned',
      'ot:change-state:process',
      'ot:change-state:ready',
      'ot:change-state:delivered',
      'pago:view:assigned',
      'pago:create',
    ],
  }

  const userPerms = permissions[userRole] || []
  return userPerms.includes('*') || userPerms.includes(action)
}

/**
 * Obtener sesión del servidor
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions)
}

/**
 * Obtener usuario actual desde sesión
 */
export async function getCurrentUser() {
  const session = await getCurrentSession()
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    nombre: session.user.name || '',
    usuario: '', // No está en la sesión, obtener de BD si es necesario
    rol: session.user.role,
    activo: true,
  }
}
