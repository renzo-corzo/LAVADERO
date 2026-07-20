/**
 * Reglas del catálogo por sucursal (servicios y extras).
 *
 * Un servicio/extra puede ser:
 *  - compartido (sucursalId null): se ofrece en TODAS las sucursales
 *  - propio de una sucursal (sucursalId = X)
 *
 * Regla anti-duplicado: nunca pueden verse dos ítems con el mismo nombre en
 * el catálogo de una misma sucursal. Por eso:
 *  - crear compartido "X" falla si "X" existe en cualquier sucursal
 *  - crear "X" en la sucursal S falla si existe compartido "X" o "X" en S
 */

import { prisma } from '@/lib/db/client'

type Modelo = 'servicio' | 'extra'

/** Filtro Prisma para "lo que se ofrece en esta sucursal" (propio + compartido). */
export function filtroCatalogoSucursal(sucursalId: string | null) {
  if (!sucursalId) return {}
  return { OR: [{ sucursalId }, { sucursalId: null }] }
}

/**
 * Busca un choque de nombre. Devuelve un mensaje de error o null si está libre.
 * `excluirId` permite editar un ítem sin chocar consigo mismo.
 */
export async function verificarNombreDisponible(
  modelo: Modelo,
  empresaId: string,
  nombre: string,
  sucursalId: string | null,
  excluirId?: string
): Promise<string | null> {
  const where: any = { empresaId, nombre }
  // Compartido choca con cualquiera; el de una sucursal solo con el compartido
  // o con otro de la misma sucursal.
  if (sucursalId) {
    where.OR = [{ sucursalId }, { sucursalId: null }]
  }
  if (excluirId) where.id = { not: excluirId }

  const existente =
    modelo === 'servicio'
      ? await prisma.servicio.findFirst({ where, select: { id: true, sucursalId: true } })
      : await prisma.extra.findFirst({ where, select: { id: true, sucursalId: true } })

  if (!existente) return null

  const etiqueta = modelo === 'servicio' ? 'un servicio' : 'un extra'
  if (!sucursalId) {
    return `Ya existe ${etiqueta} con ese nombre en alguna sucursal. Usá otro nombre o editá el existente.`
  }
  return existente.sucursalId === null
    ? `Ya existe ${etiqueta} compartido con ese nombre (aplica a todas las sucursales).`
    : `Ya existe ${etiqueta} con ese nombre en esta sucursal.`
}

/** Valida que la sucursal (si viene) sea de la empresa. Devuelve error o null. */
export async function validarSucursalDeEmpresa(
  sucursalId: string | null,
  empresaId: string
): Promise<string | null> {
  if (!sucursalId) return null
  const suc = await prisma.sucursal.findFirst({
    where: { id: sucursalId, empresaId },
    select: { id: true },
  })
  return suc ? null : 'La sucursal no pertenece a la empresa'
}
