/**
 * API Route: Reporte de costos de stock (Etapa 2.5)
 * GET ?desde=&hasta=&sucursalId=
 *
 * Devuelve, para el período:
 *  - compras: plata gastada reponiendo insumos (ENTRADA × costo)
 *  - insumosConsumidos: costo de insumos usados por los lavados (CONSUMO neto de DEVOLUCION)
 *  - ventas + margen: ventas de OTs entregadas y pagadas − insumos consumidos
 *  - valorDeposito: stock actual × costo (foto del momento, no depende de fechas)
 *  - detalle por producto (comprado/consumido/stock)
 *
 * DUEÑO/ENCARGADO/ADMIN. Scoping por empresa; filtro por sucursal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { inicioDelDiaLocal, finDelDiaLocal } from '@/lib/utils-fechas'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (!hasPermission(session.user.role, 'stock:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const sp = request.nextUrl.searchParams
    const desde = sp.get('desde')
    const hasta = sp.get('hasta')
    if (!desde || !hasta) {
      return NextResponse.json({ error: 'desde y hasta son obligatorias' }, { status: 400 })
    }
    const inicio = inicioDelDiaLocal(desde)
    const fin = finDelDiaLocal(hasta)

    // Sucursal: la del empleado, o la elegida (dueño/admin); null = todas las de la empresa
    const sucursalId = session.user.sucursalId || sp.get('sucursalId')?.trim() || null

    const filtroEmpresa = scope.empresaId ? { empresaId: scope.empresaId } : {}
    const filtroSucursal = sucursalId ? { sucursalId } : {}

    // 1) Movimientos del período (con nombre/unidad del producto)
    const movimientos = await prisma.movimientoStock.findMany({
      where: {
        ...filtroEmpresa,
        ...filtroSucursal,
        fechaHora: { gte: inicio, lte: fin },
        tipo: { in: ['ENTRADA', 'CONSUMO', 'DEVOLUCION'] },
      },
      select: {
        productoId: true,
        tipo: true,
        cantidad: true,
        costoUnitario: true,
        producto: { select: { nombre: true, unidad: true } },
      },
    })

    // Agregación por producto
    type Agg = {
      nombre: string
      unidad: string
      compradoCant: number
      compradoMonto: number
      consumidoCant: number
      consumidoMonto: number
    }
    const porProducto = new Map<string, Agg>()
    let compras = 0
    let insumosConsumidos = 0

    for (const m of movimientos) {
      const cant = Number(m.cantidad) // con signo
      const costo = m.costoUnitario != null ? Number(m.costoUnitario) : 0
      const a =
        porProducto.get(m.productoId) ??
        {
          nombre: m.producto.nombre,
          unidad: m.producto.unidad,
          compradoCant: 0,
          compradoMonto: 0,
          consumidoCant: 0,
          consumidoMonto: 0,
        }

      if (m.tipo === 'ENTRADA') {
        a.compradoCant += cant // positivo
        a.compradoMonto += cant * costo
        compras += cant * costo
      } else {
        // CONSUMO (cant negativa) y DEVOLUCION (cant positiva): consumo neto = -cant
        const consumida = -cant
        a.consumidoCant += consumida
        a.consumidoMonto += consumida * costo
        insumosConsumidos += consumida * costo
      }
      porProducto.set(m.productoId, a)
    }

    // 2) Valor del depósito actual (snapshot)
    const productos = await prisma.productoStock.findMany({
      where: { ...filtroEmpresa, ...filtroSucursal, activo: true },
      select: { stockActual: true, costoUnitario: true },
    })
    const valorDeposito = productos.reduce(
      (s, p) => s + Number(p.stockActual) * (p.costoUnitario != null ? Number(p.costoUnitario) : 0),
      0
    )

    // 3) Ventas del período (OTs entregadas y totalmente pagadas) para el margen
    const ots = await prisma.ordenTrabajo.findMany({
      where: {
        ...filtroEmpresa,
        ...filtroSucursal,
        estado: 'ENTREGADO',
        fechaIngreso: { gte: inicio, lte: fin },
      },
      select: { total: true, pagos: { select: { monto: true } } },
    })
    let ventas = 0
    for (const ot of ots) {
      const pagado = ot.pagos.reduce((s, p) => s + Number(p.monto), 0)
      if (pagado >= Number(ot.total)) ventas += Number(ot.total)
    }

    const detalle = Array.from(porProducto.values())
      .map((a) => ({
        nombre: a.nombre,
        unidad: a.unidad,
        compradoCant: a.compradoCant,
        compradoMonto: a.compradoMonto,
        consumidoCant: a.consumidoCant,
        consumidoMonto: a.consumidoMonto,
      }))
      .sort((x, y) => y.consumidoMonto - x.consumidoMonto)

    return NextResponse.json({
      periodo: { desde, hasta },
      compras,
      insumosConsumidos,
      valorDeposito,
      ventas,
      // Margen bruto por insumos: ventas − costo de insumos consumidos
      margen: ventas - insumosConsumidos,
      detalle,
    })
  } catch (error) {
    console.error('Error en reporte de stock:', error)
    return NextResponse.json({ error: 'Error al generar el reporte de stock' }, { status: 500 })
  }
}
