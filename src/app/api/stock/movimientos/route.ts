/**
 * API Route: Movimientos de stock
 * POST: Registrar entrada (compra), salida (consumo) o ajuste de inventario.
 *
 * El saldo del producto (stockActual) se actualiza en la MISMA transacción,
 * con bloqueo de fila, y nunca puede quedar negativo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { crearMovimientoStockSchema } from '@/lib/validations'

/** Error de negocio que se traduce a HTTP 400. */
class MovimientoInvalidoError extends Error {}

export async function POST(request: NextRequest) {
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
    const parsed = crearMovimientoStockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      )
    }
    const { productoId, tipo, cantidad, resta, costoUnitario, motivo } = parsed.data

    let movimientoId: string
    try {
      movimientoId = await prisma.$transaction(async (tx) => {
        // Bloqueo de la fila del producto para evitar carreras en el saldo
        const filas = await tx.$queryRaw<
          { id: string; empresaId: string; sucursalId: string; stockActual: Prisma.Decimal }[]
        >`SELECT "id", "empresaId", "sucursalId", "stockActual" FROM "productos_stock" WHERE "id" = ${productoId} FOR UPDATE`

        const prod = filas[0]
        if (!prod) throw new MovimientoInvalidoError('Producto no encontrado')

        // Aislamiento: la empresa (y la sucursal del empleado) deben coincidir
        if (scope.empresaId && prod.empresaId !== scope.empresaId) {
          throw new MovimientoInvalidoError('Producto no encontrado')
        }
        if (session.user.sucursalId && prod.sucursalId !== session.user.sucursalId) {
          throw new MovimientoInvalidoError('Producto no encontrado')
        }

        // Delta con signo según el tipo
        const delta =
          tipo === 'ENTRADA'
            ? cantidad
            : tipo === 'SALIDA'
              ? -cantidad
              : resta
                ? -cantidad
                : cantidad

        const stockPrevio = Number(prod.stockActual)
        const stockNuevo = stockPrevio + delta
        if (stockNuevo < 0) {
          throw new MovimientoInvalidoError(
            `No hay stock suficiente (disponible: ${stockPrevio}). Registrá un ajuste si la cuenta física no coincide.`
          )
        }

        const mov = await tx.movimientoStock.create({
          data: {
            empresaId: prod.empresaId,
            sucursalId: prod.sucursalId,
            productoId,
            tipo,
            cantidad: delta, // guardamos con signo
            costoUnitario: tipo === 'ENTRADA' ? costoUnitario ?? null : null,
            motivo: motivo ?? null,
            usuarioId: session.user.id,
          },
        })

        await tx.productoStock.update({
          where: { id: productoId },
          data: {
            stockActual: stockNuevo,
            // La entrada con costo actualiza el "último costo conocido"
            ...(tipo === 'ENTRADA' && costoUnitario != null ? { costoUnitario } : {}),
          },
        })

        await tx.auditoriaLog.create({
          data: {
            usuarioId: session.user.id,
            accion: 'STOCK_MOVIMIENTO',
            entidad: 'MovimientoStock',
            entidadId: mov.id,
            datos: JSON.stringify({ productoId, tipo, delta, stockPrevio, stockNuevo }),
          },
        })

        return mov.id
      })
    } catch (err) {
      if (err instanceof MovimientoInvalidoError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }

    return NextResponse.json({ id: movimientoId }, { status: 201 })
  } catch (error) {
    console.error('Error al registrar movimiento de stock:', error)
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 })
  }
}
