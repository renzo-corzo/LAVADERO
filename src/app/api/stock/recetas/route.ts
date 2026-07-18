/**
 * API Route: Recetas de insumos (Etapa 2)
 * GET  ?sucursalId=  → servicios y extras con su receta en esa sucursal + productos disponibles
 * PUT  → guarda la receta de un servicio/extra en una sucursal (reemplaza sus líneas)
 *
 * DUEÑO/ENCARGADO/ADMIN. Todo scopeado por empresa; la receta es por sucursal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { guardarRecetaSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

function resolverSucursalId(session: any, fromParam?: string | null): string | null {
  return session.user.sucursalId || fromParam || null
}

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

    const sucursalId = resolverSucursalId(session, request.nextUrl.searchParams.get('sucursalId')?.trim() || null)
    if (!sucursalId) {
      return NextResponse.json({ error: 'Debe indicar la sucursal' }, { status: 400 })
    }
    // La sucursal debe ser de la empresa
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: sucursalId, ...(scope.empresaId ? { empresaId: scope.empresaId } : {}) },
      select: { id: true, empresaId: true },
    })
    if (!sucursal) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 400 })
    const empresaId = scope.empresaId ?? sucursal.empresaId

    const [servicios, extras, productos, recetas] = await Promise.all([
      prisma.servicio.findMany({
        where: { empresaId, activo: true },
        select: { id: true, nombre: true, precio: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.extra.findMany({
        where: { empresaId, activo: true },
        select: { id: true, nombre: true, precio: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.productoStock.findMany({
        where: { sucursalId, activo: true },
        select: { id: true, nombre: true, unidad: true, costoUnitario: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.recetaInsumo.findMany({
        where: { sucursalId },
        select: { id: true, servicioId: true, extraId: true, productoStockId: true, cantidad: true },
      }),
    ])

    const costoDeProducto = new Map(
      productos.map((p) => [p.id, p.costoUnitario != null ? Number(p.costoUnitario) : null])
    )

    // Arma las líneas de receta de un servicio/extra y su costo total de insumos
    const lineasDe = (predicate: (r: (typeof recetas)[number]) => boolean) => {
      const ls = recetas
        .filter(predicate)
        .map((r) => {
          const costoU = costoDeProducto.get(r.productoStockId) ?? null
          const cant = Number(r.cantidad)
          return {
            productoStockId: r.productoStockId,
            cantidad: cant,
            costoLinea: costoU != null ? costoU * cant : null,
          }
        })
      const costoInsumos = ls.reduce((s, l) => s + (l.costoLinea ?? 0), 0)
      const tieneCostoCompleto = ls.length > 0 && ls.every((l) => l.costoLinea != null)
      return { lineas: ls, costoInsumos, tieneCostoCompleto }
    }

    return NextResponse.json({
      sucursalId,
      productos: productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
        costoUnitario: p.costoUnitario != null ? Number(p.costoUnitario) : null,
      })),
      servicios: servicios.map((s) => {
        const { lineas, costoInsumos, tieneCostoCompleto } = lineasDe((r) => r.servicioId === s.id)
        const precio = Number(s.precio)
        return {
          id: s.id,
          nombre: s.nombre,
          precio,
          tieneReceta: lineas.length > 0,
          lineas,
          costoInsumos: tieneCostoCompleto ? costoInsumos : null,
          margen: tieneCostoCompleto ? precio - costoInsumos : null,
        }
      }),
      extras: extras.map((e) => {
        const { lineas, costoInsumos, tieneCostoCompleto } = lineasDe((r) => r.extraId === e.id)
        const precio = Number(e.precio)
        return {
          id: e.id,
          nombre: e.nombre,
          precio,
          tieneReceta: lineas.length > 0,
          lineas,
          costoInsumos: tieneCostoCompleto ? costoInsumos : null,
          margen: tieneCostoCompleto ? precio - costoInsumos : null,
        }
      }),
    })
  } catch (error) {
    console.error('Error al obtener recetas:', error)
    return NextResponse.json({ error: 'Error al obtener recetas' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const parsed = guardarRecetaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      )
    }
    const { servicioId, extraId, lineas } = parsed.data
    const sucursalId = resolverSucursalId(session, parsed.data.sucursalId)
    if (!sucursalId) return NextResponse.json({ error: 'Debe indicar la sucursal' }, { status: 400 })

    // Sucursal de la empresa
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: sucursalId, ...(scope.empresaId ? { empresaId: scope.empresaId } : {}) },
      select: { id: true, empresaId: true },
    })
    if (!sucursal) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 400 })
    const empresaId = scope.empresaId ?? sucursal.empresaId

    // El servicio/extra debe ser de la empresa
    if (servicioId) {
      const s = await prisma.servicio.findFirst({ where: { id: servicioId, empresaId }, select: { id: true } })
      if (!s) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 400 })
    } else if (extraId) {
      const e = await prisma.extra.findFirst({ where: { id: extraId, empresaId }, select: { id: true } })
      if (!e) return NextResponse.json({ error: 'Extra no encontrado' }, { status: 400 })
    }

    // Todos los productos deben ser de esta sucursal (sin duplicados)
    const productoIds = lineas.map((l) => l.productoStockId)
    if (new Set(productoIds).size !== productoIds.length) {
      return NextResponse.json({ error: 'Hay productos repetidos en la receta' }, { status: 400 })
    }
    if (productoIds.length > 0) {
      const validos = await prisma.productoStock.count({
        where: { id: { in: productoIds }, sucursalId, activo: true },
      })
      if (validos !== productoIds.length) {
        return NextResponse.json(
          { error: 'Algún producto no pertenece a esta sucursal' },
          { status: 400 }
        )
      }
    }

    // Reemplazar la receta: borrar las líneas actuales y crear las nuevas
    await prisma.$transaction(async (tx) => {
      await tx.recetaInsumo.deleteMany({
        where: {
          sucursalId,
          ...(servicioId ? { servicioId } : { extraId }),
        },
      })
      if (lineas.length > 0) {
        await tx.recetaInsumo.createMany({
          data: lineas.map((l) => ({
            empresaId,
            sucursalId,
            servicioId: servicioId ?? null,
            extraId: extraId ?? null,
            productoStockId: l.productoStockId,
            cantidad: l.cantidad,
          })),
        })
      }
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'RECETA_UPDATED',
          entidad: servicioId ? 'Servicio' : 'Extra',
          entidadId: servicioId || extraId || null,
          datos: JSON.stringify({ sucursalId, lineas: lineas.length }),
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al guardar receta:', error)
    return NextResponse.json({ error: 'Error al guardar receta' }, { status: 500 })
  }
}
