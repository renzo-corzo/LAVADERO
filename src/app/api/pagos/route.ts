/**
 * API Route: Pagos
 * GET: Listar pagos (filtrado por otId)
 * POST: Crear nuevo pago
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { verificarYCalcularComisiones } from '@/lib/comisiones'
import { registrarPagoSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'pago:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const otIdRaw = searchParams.get('otId')
    const otId = otIdRaw?.trim() || null

    const where: Record<string, unknown> = {}
    if (otId) {
      where.ordenTrabajoId = otId
    }

    const pagos = await prisma.pago.findMany({
      where,
      include: {
        ordenTrabajo: {
          select: {
            id: true,
            patente: true,
            descripcionVehiculo: true,
            total: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaHora: 'desc',
      },
    })

    const pagosFormateados = pagos.map((pago) => {
      const otResumen = {
        id: pago.ordenTrabajo.id,
        patente: pago.ordenTrabajo.patente,
        descripcionVehiculo: pago.ordenTrabajo.descripcionVehiculo,
        total: Number(pago.ordenTrabajo.total),
      }
      return {
        id: pago.id,
        otId: pago.ordenTrabajoId,
        ot: otResumen,
        monto: Number(pago.monto),
        medioPago: pago.medioPago,
        referencia: pago.referencia,
        fechaHora: pago.fechaHora,
        usuarioId: pago.usuarioId,
        usuario: {
          id: pago.usuario.id,
          nombre: pago.usuario.nombre,
        },
        createdAt: pago.createdAt,
      }
    })

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'pago:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    // Validación con Zod
    const validationResult = registrarPagoSchema.safeParse(body)
    if (!validationResult.success) {
      const details = validationResult.error.errors.map((e) => ({
        field: e.path.join('.') || 'general',
        message: e.message,
      }))
      const errorMessage =
        details.length === 1
          ? details[0].message
          : `Datos inválidos: ${details.map((d) => d.message).join(' · ')}`
      return NextResponse.json({ error: errorMessage, details }, { status: 400 })
    }

    const { ordenTrabajoId, monto, medioPago, referencia } = validationResult.data

    const ot = await prisma.ordenTrabajo.findUnique({
      where: { id: ordenTrabajoId },
    })

    if (!ot) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    // Crear pago con transacción
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          ordenTrabajoId,
          monto,
          medioPago: medioPago as any,
          referencia: referencia || null,
          // Usamos siempre la fecha/hora actual para el registro del pago
          fechaHora: new Date(),
          usuarioId: session.user.id,
        },
        include: {
          ordenTrabajo: {
            select: {
              id: true,
              patente: true,
              descripcionVehiculo: true,
              total: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      })

      // Registrar en log de auditoría
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'PAGO_CREATED',
          entidad: 'Pago',
          entidadId: nuevoPago.id,
          datos: JSON.stringify({
            ordenTrabajoId,
            monto: nuevoPago.monto,
            medioPago: nuevoPago.medioPago,
          }),
        },
      })

      return nuevoPago
    })

    // Verificar si después de este pago, la OT está completamente pagada y ENTREGADA
    // para calcular comisiones
    if (ot.estado === 'ENTREGADO') {
      const todosLosPagos = await prisma.pago.findMany({
        where: { ordenTrabajoId },
      })
      const totalPagado = todosLosPagos.reduce((sum, p) => sum + Number(p.monto), 0)

      if (totalPagado >= Number(ot.total)) {
        await verificarYCalcularComisiones(ordenTrabajoId)
      }
    }

    // Formatear respuesta
    const pagoFormateado = {
      id: pago.id,
      otId: pago.ordenTrabajoId,
      ot: {
        id: pago.ordenTrabajo.id,
        patente: pago.ordenTrabajo.patente,
        descripcionVehiculo: pago.ordenTrabajo.descripcionVehiculo,
        total: Number(pago.ordenTrabajo.total),
      },
      monto: Number(pago.monto),
      medioPago: pago.medioPago,
      referencia: pago.referencia,
      fechaHora: pago.fechaHora,
      usuarioId: pago.usuarioId,
      usuario: {
        id: pago.usuario.id,
        nombre: pago.usuario.nombre,
      },
      createdAt: pago.createdAt,
    }

    return NextResponse.json(pagoFormateado, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}

