/**
 * API Route: Liquidar Comisiones
 * POST: Liquidar comisiones pendientes de un empleado en un período
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { liquidarComisionesSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'comision:liquidar')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    // Validación con Zod (incluye comisionesIds: solo se liquida lo seleccionado)
    const validationResult = liquidarComisionesSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { empleadoId, fechaDesde, fechaHasta, comisionesIds } = validationResult.data

    // Scoping multi-tenant: solo empleados de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    // Validar que el empleado existe (y es de la empresa)
    const empleado = await prisma.usuario.findFirst({
      where: {
        id: empleadoId,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
    })

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Validar fechas (se guardan como metadatos del período de la liquidación)
    const desde = new Date(fechaDesde)
    const hasta = new Date(fechaHasta)
    hasta.setHours(23, 59, 59, 999)

    if (desde > hasta) {
      return NextResponse.json(
        { error: 'La fecha desde debe ser anterior a la fecha hasta' },
        { status: 400 }
      )
    }

    // Obtener SOLO las comisiones seleccionadas, exigiendo que pertenezcan al
    // empleado y estén PENDIENTE (evita liquidar comisiones de otro empleado o ya liquidadas).
    const comisionesIdsUnicos = Array.from(new Set(comisionesIds))
    const comisionesSeleccionadas = await prisma.comision.findMany({
      where: {
        id: { in: comisionesIdsUnicos },
        empleadoId,
        estado: 'PENDIENTE',
      },
    })

    if (comisionesSeleccionadas.length !== comisionesIdsUnicos.length) {
      const encontradas = new Set(comisionesSeleccionadas.map((c) => c.id))
      const invalidas = comisionesIdsUnicos.filter((id) => !encontradas.has(id))
      return NextResponse.json(
        {
          error:
            'Algunas comisiones no existen, no pertenecen al empleado o ya fueron liquidadas',
          invalidas,
        },
        { status: 400 }
      )
    }

    // Calcular monto total
    const montoTotal = comisionesSeleccionadas.reduce((sum, c) => sum + Number(c.monto), 0)

    // Crear liquidación, actualizar comisiones y auditar en una sola transacción
    const liquidacion = await prisma.$transaction(async (tx) => {
      const nuevaLiquidacion = await tx.liquidacionComision.create({
        data: {
          empleadoId,
          fechaDesde: desde,
          fechaHasta: hasta,
          montoTotal,
          usuarioId: session.user.id,
        },
      })

      // Marcar como LIQUIDADA solo las pendientes (condición en el where para
      // blindar ante carreras: si otra liquidación las tomó, updateMany afecta 0).
      const actualizadas = await tx.comision.updateMany({
        where: {
          id: { in: comisionesIdsUnicos },
          empleadoId,
          estado: 'PENDIENTE',
        },
        data: {
          estado: 'LIQUIDADA',
          fechaLiquidacion: new Date(),
          usuarioLiquidacionId: session.user.id,
        },
      })

      if (actualizadas.count !== comisionesIdsUnicos.length) {
        // Alguien liquidó parte en paralelo: abortar toda la transacción.
        throw new Error('Conflicto de concurrencia al liquidar comisiones')
      }

      await tx.liquidacionComisionComision.createMany({
        data: comisionesIdsUnicos.map((comisionId) => ({
          liquidacionId: nuevaLiquidacion.id,
          comisionId,
        })),
      })

      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'COMISIONES_LIQUIDADAS',
          entidad: 'LiquidacionComision',
          entidadId: nuevaLiquidacion.id,
          datos: JSON.stringify({
            empleadoId,
            fechaDesde: desde.toISOString(),
            fechaHasta: hasta.toISOString(),
            montoTotal,
            cantidadComisiones: comisionesIdsUnicos.length,
          }),
        },
      })

      return nuevaLiquidacion
    })

    return NextResponse.json({
      id: liquidacion.id,
      empleadoId,
      fechaDesde: desde,
      fechaHasta: hasta,
      montoTotal: Number(montoTotal),
      cantidadComisiones: comisionesIdsUnicos.length,
    })
  } catch (error) {
    console.error('Error al liquidar comisiones:', error)
    return NextResponse.json(
      { error: 'Error al liquidar comisiones' },
      { status: 500 }
    )
  }
}





