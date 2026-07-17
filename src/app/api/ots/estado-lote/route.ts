/**
 * API Route: Cambiar Estado de OTs (lote)
 * PUT: Cambiar el estado de múltiples OTs externas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { isValidEstadoTransition } from '@/lib/reglas-negocio'
import { cambiarEstadoOTLoteSchema } from '@/lib/validations'
import { empresaScope } from '@/lib/empresa'
import { verificarYCalcularComisiones } from '@/lib/comisiones'
import type { OTEstado } from '@/types'

type LoteError = { id: string; reason: string }
type PlanActualizacion = { id: string; estadoActual: OTEstado; pasos: OTEstado[] }

const FLUJO_OT: OTEstado[] = ['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO']

function buildPasos(estadoActual: OTEstado, estadoDeseado: OTEstado): OTEstado[] | null {
  if (estadoDeseado === 'CANCELADO') return ['CANCELADO']
  const fromIdx = FLUJO_OT.indexOf(estadoActual)
  const toIdx = FLUJO_OT.indexOf(estadoDeseado)
  if (fromIdx === -1 || toIdx === -1) return null
  if (toIdx <= fromIdx) return null
  // Devuelve estados sucesivos a aplicar (sin incluir el actual)
  return FLUJO_OT.slice(fromIdx + 1, toIdx + 1)
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const validationResult = cambiarEstadoOTLoteSchema.safeParse(body)
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

    const { otIds, nuevoEstado, motivo } = validationResult.data

    // Scoping multi-tenant: solo OTs de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const ots = await prisma.ordenTrabajo.findMany({
      where: {
        id: { in: otIds },
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
      select: {
        id: true,
        estado: true,
        esExterna: true,
        total: true,
      },
    })

    const encontrados = new Set(ots.map((o) => o.id))
    const noEncontradas = otIds.filter((id) => !encontrados.has(id))
    if (noEncontradas.length > 0) {
      return NextResponse.json(
        { error: 'Una o más OTs no existen', noEncontradas },
        { status: 404 }
      )
    }

    const noExternas = ots.filter((o) => !o.esExterna).map((o) => o.id)
    if (noExternas.length > 0) {
      return NextResponse.json(
        { error: 'Solo se permite cambiar estado en lote para OTs externas', noExternas },
        { status: 400 }
      )
    }

    const errores: LoteError[] = []
    const planes: PlanActualizacion[] = ots
      .map((ot) => {
        const estadoActual = ot.estado as OTEstado
        const estadoDeseado = nuevoEstado as OTEstado
        const pasos = buildPasos(estadoActual, estadoDeseado)
        if (!pasos) {
          errores.push({
            id: ot.id,
            reason: 'El estado seleccionado no es un avance válido desde el estado actual',
          })
          return null
        }

        // Validar cada transición secuencial (permite "saltear" en la UI, pero aplicamos pasos intermedios)
        let prev = estadoActual
        for (const next of pasos) {
          const validacion = isValidEstadoTransition(prev, next, session.user.role)
          if (!validacion.valid) {
            errores.push({
              id: ot.id,
              reason: validacion.reason || 'Transición de estado no permitida',
            })
            return null
          }
          prev = next
        }

        return { id: ot.id, estadoActual, pasos }
      })
      .filter(Boolean) as PlanActualizacion[]

    // Si ninguna es actualizable, devolver errores (sin tocar BD)
    if (planes.length === 0) {
      return NextResponse.json(
        { error: 'No hay OTs seleccionadas con transición válida', errores },
        { status: 400 }
      )
    }

    const updatedIds: string[] = []

    await prisma.$transaction(async (tx) => {
      for (const plan of planes) {
        let prev = plan.estadoActual
        for (const next of plan.pasos) {
          await tx.ordenTrabajo.update({
            where: { id: plan.id },
            data: { estado: next },
          })

          await tx.estadoHistorial.create({
            data: {
              ordenTrabajoId: plan.id,
              estadoAnterior: prev,
              estadoNuevo: next,
              usuarioId: session.user.id,
              fechaHora: new Date(),
            },
          })

          prev = next
        }

        await tx.auditoriaLog.create({
          data: {
            usuarioId: session.user.id,
            accion: 'OT_STATE_CHANGED_BULK',
            entidad: 'OrdenTrabajo',
            entidadId: plan.id,
            datos: JSON.stringify({
              estadoAnterior: plan.estadoActual,
              estadoNuevo: nuevoEstado,
              motivo: motivo || null,
              bulk: true,
              pasosAplicados: plan.pasos,
            }),
          },
        })

        updatedIds.push(plan.id)
      }
    })

    // Calcular comisiones si se entregó y está pagada (mismo criterio que endpoint individual)
    if (nuevoEstado === 'ENTREGADO') {
      for (const otId of updatedIds) {
        const [otActual, pagos] = await Promise.all([
          prisma.ordenTrabajo.findUnique({ where: { id: otId }, select: { total: true } }),
          prisma.pago.findMany({ where: { ordenTrabajoId: otId }, select: { monto: true } }),
        ])

        if (!otActual) continue
        const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
        if (totalPagado >= Number(otActual.total)) {
          await verificarYCalcularComisiones(otId)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      updatedCount: updatedIds.length,
      updatedIds,
      failedCount: errores.length,
      errores: errores.length ? errores : undefined,
    })
  } catch (error) {
    console.error('Error al cambiar estado de OTs en lote:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado en lote' },
      { status: 500 }
    )
  }
}

