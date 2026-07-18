/**
 * API Route: Producto de stock individual
 * GET: Detalle + historial de movimientos
 * PUT: Editar datos del producto (nombre, unidad, mínimo, costo, activo)
 *      OJO: el stock NO se edita acá; se mueve con movimientos.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { editarProductoStockSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

async function productoDeLaEmpresa(session: any, request: NextRequest, id: string) {
  const scope = empresaScope(session, request)
  if (!scope.valido) return { error: 'Usuario sin empresa asignada', status: 403 as const }
  const producto = await prisma.productoStock.findFirst({
    where: {
      id,
      ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      // Empleados con sucursal ven solo la suya
      ...(session.user.sucursalId ? { sucursalId: session.user.sucursalId } : {}),
    },
  })
  if (!producto) return { error: 'Producto no encontrado', status: 404 as const }
  return { producto }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (!hasPermission(session.user.role, 'stock:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const res = await productoDeLaEmpresa(session, request, params.id)
    if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status })
    const p = res.producto

    const movimientos = await prisma.movimientoStock.findMany({
      where: { productoId: p.id },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaHora: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      producto: {
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
        stockActual: Number(p.stockActual),
        stockMinimo: Number(p.stockMinimo),
        costoUnitario: p.costoUnitario != null ? Number(p.costoUnitario) : null,
        activo: p.activo,
        sucursalId: p.sucursalId,
      },
      movimientos: movimientos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        cantidad: Number(m.cantidad), // con signo
        costoUnitario: m.costoUnitario != null ? Number(m.costoUnitario) : null,
        motivo: m.motivo,
        fechaHora: m.fechaHora,
        usuario: m.usuario?.nombre || 'Sistema',
      })),
    })
  } catch (error) {
    console.error('Error al obtener producto de stock:', error)
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (!hasPermission(session.user.role, 'stock:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const res = await productoDeLaEmpresa(session, request, params.id)
    if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status })
    const actual = res.producto

    const body = await request.json()
    const parsed = editarProductoStockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      )
    }
    const { nombre, unidad, stockMinimo, costoUnitario, activo } = parsed.data

    // Nombre único en la sucursal (excepto sí mismo)
    if (nombre !== actual.nombre) {
      const dup = await prisma.productoStock.findUnique({
        where: { sucursalId_nombre: { sucursalId: actual.sucursalId, nombre } },
      })
      if (dup && dup.id !== actual.id) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese nombre en esta sucursal' },
          { status: 400 }
        )
      }
    }

    const producto = await prisma.productoStock.update({
      where: { id: actual.id },
      data: {
        nombre,
        unidad,
        stockMinimo,
        costoUnitario: costoUnitario ?? null,
        ...(activo !== undefined ? { activo } : {}),
      },
    })

    return NextResponse.json({ id: producto.id })
  } catch (error) {
    console.error('Error al editar producto de stock:', error)
    return NextResponse.json({ error: 'Error al editar producto' }, { status: 500 })
  }
}
