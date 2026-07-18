/**
 * API Route: Productos de stock (insumos)
 * GET: Listar productos del depósito (por empresa/sucursal) con alerta de bajo stock
 * POST: Crear producto (con stock inicial opcional como movimiento de ENTRADA)
 *
 * Reglas: DUEÑO/ENCARGADO/ADMIN. Stock POR SUCURSAL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { crearProductoStockSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/** Resuelve la sucursal del pedido: la del empleado, o la del query/body (DUEÑO/ADMIN). */
function resolverSucursalId(session: any, fromParam?: string | null): string | null {
  return session.user.sucursalId || fromParam || null
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(session.user.role, 'stock:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const sucursalParam = request.nextUrl.searchParams.get('sucursalId')?.trim() || null
    const sucursalId = resolverSucursalId(session, sucursalParam)
    const incluirInactivos = request.nextUrl.searchParams.get('incluirInactivos') === 'true'

    const productos = await prisma.productoStock.findMany({
      where: {
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
        ...(sucursalId ? { sucursalId } : {}),
        ...(incluirInactivos ? {} : { activo: true }),
      },
      orderBy: { nombre: 'asc' },
    })

    const data = productos.map((p) => {
      const stock = Number(p.stockActual)
      const minimo = Number(p.stockMinimo)
      return {
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
        stockActual: stock,
        stockMinimo: minimo,
        costoUnitario: p.costoUnitario != null ? Number(p.costoUnitario) : null,
        activo: p.activo,
        sucursalId: p.sucursalId,
        // Bandera de reposición: sin stock, o por debajo del mínimo (si hay mínimo)
        bajoStock: stock <= 0 || (minimo > 0 && stock <= minimo),
        sinStock: stock <= 0,
      }
    })

    return NextResponse.json({
      total: data.length,
      alertas: data.filter((p) => p.bajoStock && p.activo).length,
      productos: data,
    })
  } catch (error) {
    console.error('Error al listar productos de stock:', error)
    return NextResponse.json({ error: 'Error al listar productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(session.user.role, 'stock:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = crearProductoStockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      )
    }

    const { nombre, unidad, stockMinimo, stockInicial, costoUnitario } = parsed.data
    const sucursalId = resolverSucursalId(session, parsed.data.sucursalId)
    if (!sucursalId) {
      return NextResponse.json({ error: 'Debe indicar la sucursal del depósito' }, { status: 400 })
    }

    // La sucursal debe pertenecer a la empresa del usuario
    const sucursal = await prisma.sucursal.findFirst({
      where: {
        id: sucursalId,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
      select: { id: true, empresaId: true },
    })
    if (!sucursal) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 400 })
    }
    const empresaId = scope.empresaId ?? sucursal.empresaId

    // Nombre único dentro de la sucursal
    const existente = await prisma.productoStock.findUnique({
      where: { sucursalId_nombre: { sucursalId, nombre } },
    })
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese nombre en esta sucursal' },
        { status: 400 }
      )
    }

    const inicial = stockInicial ?? 0

    const producto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.productoStock.create({
        data: {
          empresaId,
          sucursalId,
          nombre,
          unidad,
          stockMinimo,
          stockActual: inicial,
          costoUnitario: costoUnitario ?? null,
        },
      })

      // Si hay stock inicial, queda registrado como ENTRADA para el historial
      if (inicial > 0) {
        await tx.movimientoStock.create({
          data: {
            empresaId,
            sucursalId,
            productoId: nuevo.id,
            tipo: 'ENTRADA',
            cantidad: inicial,
            costoUnitario: costoUnitario ?? null,
            motivo: 'Carga inicial de inventario',
            usuarioId: session.user.id,
          },
        })
      }

      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'STOCK_PRODUCTO_CREATED',
          entidad: 'ProductoStock',
          entidadId: nuevo.id,
          datos: JSON.stringify({ nombre, unidad, stockInicial: inicial }),
        },
      })

      return nuevo
    })

    return NextResponse.json({ id: producto.id }, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto de stock:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
