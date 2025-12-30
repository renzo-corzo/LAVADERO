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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos: ENCARGADO/DUENO tienen pago:view, LAVADOR tiene pago:view:assigned
    if (!hasPermission(session.user.role, 'pago:view') && !hasPermission(session.user.role, 'pago:view:assigned')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const otId = searchParams.get('otId')

    const where: any = {}
    if (otId) {
      where.ordenTrabajoId = otId
      
      // Si es LAVADOR, verificar que está asignado a esta OT
      if (session.user.role === 'LAVADOR') {
        const ot = await prisma.ordenTrabajo.findUnique({
          where: { id: otId },
          include: {
            empleados: {
              include: {
                empleado: {
                  select: { id: true },
                },
              },
            },
          },
        })
        
        if (!ot) {
          return NextResponse.json(
            { error: 'Orden de trabajo no encontrada' },
            { status: 404 }
          )
        }
        
        const estaAsignado = ot.empleados.some(
          (e) => e.empleado.id === session.user.id
        )
        
        if (!estaAsignado) {
          return NextResponse.json(
            { error: 'Sin permisos para ver pagos de esta OT' },
            { status: 403 }
          )
        }
      }
    } else {
      // Si no hay otId y es LAVADOR, solo mostrar pagos de OTs asignadas
      if (session.user.role === 'LAVADOR') {
        const otsAsignadas = await prisma.ordenTrabajoEmpleado.findMany({
          where: { empleadoId: session.user.id },
          select: { ordenTrabajoId: true },
        })
        
        const idsOTs = otsAsignadas.map((oe) => oe.ordenTrabajoId)
        where.ordenTrabajoId = { in: idsOTs }
      }
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

    // Formatear respuesta
    const pagosFormateados = pagos.map((pago) => ({
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
    }))

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
    const { ordenTrabajoId, monto, medioPago, referencia, fechaHora } = body

    // Validaciones
    if (!ordenTrabajoId || !monto || !medioPago) {
      return NextResponse.json(
        { error: 'OT, monto y medio de pago son obligatorios' },
        { status: 400 }
      )
    }

    if (Number(monto) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!['EFECTIVO', 'TRANSFERENCIA'].includes(medioPago)) {
      return NextResponse.json(
        { error: 'Medio de pago inválido' },
        { status: 400 }
      )
    }

    // Verificar que la OT existe
    const ot = await prisma.ordenTrabajo.findUnique({
      where: { id: ordenTrabajoId },
      include: {
        empleados: {
          include: {
            empleado: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!ot) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    // Si es LAVADOR, verificar que está asignado a esta OT
    if (session.user.role === 'LAVADOR') {
      const estaAsignado = ot.empleados.some(
        (e) => e.empleado.id === session.user.id
      )
      if (!estaAsignado) {
        return NextResponse.json(
          { error: 'Sin permisos para registrar pagos de esta OT' },
          { status: 403 }
        )
      }
    }

    // Crear pago con transacción
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          ordenTrabajoId,
          monto: parseFloat(monto),
          medioPago: medioPago as any,
          referencia: referencia || null,
          fechaHora: fechaHora ? new Date(fechaHora) : new Date(),
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

