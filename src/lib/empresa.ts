/**
 * Scoping multi-tenant por Empresa.
 *
 * REGLA DE ORO: toda consulta/creación de datos de negocio DEBE pasar por acá.
 * - Usuarios normales (DUEÑO/ENCARGADO/LAVADOR/CLIENTE): SIEMPRE su propia
 *   empresa (del JWT). Nunca pueden ver/tocar otra.
 * - ADMIN de plataforma: opera "en contexto" de una empresa indicada por el
 *   request (?empresaId=, header x-empresa-id o cookie empresa-contexto);
 *   sin contexto = vista global (solo para pantallas de plataforma).
 */

import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

export interface EmpresaScope {
  /** Empresa a la que se limita la consulta; null solo para ADMIN sin contexto (vista global) */
  empresaId: string | null
  /** false = usuario sin empresa que no es ADMIN → responder 403 */
  valido: boolean
  esAdmin: boolean
}

export function empresaScope(session: Session, request?: NextRequest): EmpresaScope {
  const esAdmin = session.user.role === 'ADMIN'

  if (esAdmin) {
    const param =
      request?.nextUrl.searchParams.get('empresaId')?.trim() ||
      request?.headers.get('x-empresa-id')?.trim() ||
      request?.cookies.get('empresa-contexto')?.value?.trim() ||
      null
    return { empresaId: param, valido: true, esAdmin }
  }

  const propia = session.user.empresaId ?? null
  // Un usuario de negocio SIN empresa no debe existir; si aparece, se bloquea.
  return { empresaId: propia, valido: !!propia, esAdmin }
}

/**
 * Para CREACIONES: la empresa es obligatoria (un ADMIN debe indicar contexto).
 * Devuelve el empresaId o null si no se puede resolver (responder 400/403).
 */
export function empresaIdParaCrear(session: Session, request?: NextRequest): string | null {
  const scope = empresaScope(session, request)
  if (!scope.valido) return null
  return scope.empresaId // puede ser null si es ADMIN sin contexto → el caller decide
}
