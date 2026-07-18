/**
 * Consumo automático de insumos por receta (Etapa 2).
 *
 * - consumirInsumosOT: al pasar una OT a LISTO, descuenta los insumos según la
 *   receta del servicio + los extras de la OT. Idempotente (no descuenta dos
 *   veces). Permite dejar el stock en negativo (el lavado ya se hizo).
 * - devolverInsumosOT: al cancelar una OT que ya consumió, repone lo consumido.
 *
 * Ambas operan dentro de una transacción provista por el caller (tx).
 */

import type { Prisma, PrismaClient } from '@prisma/client'

type Tx = Prisma.TransactionClient | PrismaClient

/**
 * Descuenta los insumos de la receta de una OT (CONSUMO). Idempotente:
 * si la OT ya tiene movimientos de CONSUMO, no hace nada.
 * No bloquea por falta de stock: el consumo físico ya ocurrió (puede quedar negativo).
 */
export async function consumirInsumosOT(tx: Tx, ordenTrabajoId: string, usuarioId: string) {
  // Idempotencia: ¿ya se consumió para esta OT?
  const yaConsumido = await tx.movimientoStock.count({
    where: { ordenTrabajoId, tipo: 'CONSUMO' },
  })
  if (yaConsumido > 0) return { consumido: false, lineas: 0 }

  const ot = await tx.ordenTrabajo.findUnique({
    where: { id: ordenTrabajoId },
    select: {
      id: true,
      empresaId: true,
      sucursalId: true,
      esExterna: true,
      servicioId: true,
      extras: { select: { extraId: true } },
    },
  })
  if (!ot) return { consumido: false, lineas: 0 }
  // Las OTs externas (trabajo fuera del lavadero) no consumen el depósito propio
  if (ot.esExterna) return { consumido: false, lineas: 0 }

  const servicioIds = [ot.servicioId]
  const extraIds = ot.extras.map((e) => e.extraId)

  // Recetas de la sucursal de la OT, para su servicio y sus extras
  const recetas = await tx.recetaInsumo.findMany({
    where: {
      sucursalId: ot.sucursalId,
      OR: [
        { servicioId: { in: servicioIds } },
        ...(extraIds.length > 0 ? [{ extraId: { in: extraIds } }] : []),
      ],
    },
    select: { productoStockId: true, cantidad: true },
  })
  if (recetas.length === 0) return { consumido: false, lineas: 0 }

  // Sumar cantidades por producto (un mismo producto puede venir de servicio + varios extras)
  const porProducto = new Map<string, number>()
  for (const r of recetas) {
    porProducto.set(
      r.productoStockId,
      (porProducto.get(r.productoStockId) ?? 0) + Number(r.cantidad)
    )
  }

  let lineas = 0
  for (const [productoId, cantidad] of porProducto) {
    if (cantidad <= 0) continue
    const prod = await tx.productoStock.findUnique({
      where: { id: productoId },
      select: { stockActual: true, costoUnitario: true, empresaId: true, sucursalId: true },
    })
    if (!prod) continue

    const stockNuevo = Number(prod.stockActual) - cantidad // puede quedar negativo (a propósito)

    await tx.movimientoStock.create({
      data: {
        empresaId: prod.empresaId,
        sucursalId: prod.sucursalId,
        productoId,
        tipo: 'CONSUMO',
        cantidad: -cantidad,
        costoUnitario: prod.costoUnitario ?? null, // costo al que se consumió (para margen)
        motivo: 'Consumo automático por receta',
        ordenTrabajoId,
        usuarioId,
      },
    })
    await tx.productoStock.update({
      where: { id: productoId },
      data: { stockActual: stockNuevo },
    })
    lineas++
  }

  return { consumido: lineas > 0, lineas }
}

/**
 * Repone los insumos que una OT había consumido (DEVOLUCION), al cancelarla.
 * Idempotente: no devuelve dos veces (usa la existencia de DEVOLUCION como guarda),
 * y solo devuelve si hubo CONSUMO previo.
 */
export async function devolverInsumosOT(tx: Tx, ordenTrabajoId: string, usuarioId: string) {
  const yaDevuelto = await tx.movimientoStock.count({
    where: { ordenTrabajoId, tipo: 'DEVOLUCION' },
  })
  if (yaDevuelto > 0) return { devuelto: false, lineas: 0 }

  const consumos = await tx.movimientoStock.findMany({
    where: { ordenTrabajoId, tipo: 'CONSUMO' },
    select: { productoId: true, cantidad: true, empresaId: true, sucursalId: true, costoUnitario: true },
  })
  if (consumos.length === 0) return { devuelto: false, lineas: 0 }

  let lineas = 0
  for (const c of consumos) {
    const cantidad = Math.abs(Number(c.cantidad)) // el consumo se guardó negativo
    if (cantidad <= 0) continue

    const prod = await tx.productoStock.findUnique({
      where: { id: c.productoId },
      select: { stockActual: true },
    })
    if (!prod) continue

    await tx.movimientoStock.create({
      data: {
        empresaId: c.empresaId,
        sucursalId: c.sucursalId,
        productoId: c.productoId,
        tipo: 'DEVOLUCION',
        cantidad: cantidad, // suma de vuelta
        costoUnitario: c.costoUnitario ?? null,
        motivo: 'Devolución por OT cancelada',
        ordenTrabajoId,
        usuarioId,
      },
    })
    await tx.productoStock.update({
      where: { id: c.productoId },
      data: { stockActual: Number(prod.stockActual) + cantidad },
    })
    lineas++
  }

  return { devuelto: lineas > 0, lineas }
}
