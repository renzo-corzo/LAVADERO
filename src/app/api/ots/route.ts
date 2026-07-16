/**
 * API Route: Órdenes de Trabajo (OT)
 * GET: Listar OTs
 * POST: Crear OT
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { getOtAccessScope, hasPermission } from '@/lib/auth'
import { calcularTotalOT } from '@/lib/reglas-negocio'
import { crearOTSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const otScope = getOtAccessScope(session.user.role)
    if (otScope === 'none') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const fecha = searchParams.get('fecha') // formato: YYYY-MM-DD
    const incluirExternas = searchParams.get('incluirExternas') === 'true'
    const sucursalIdParam = searchParams.get('sucursalId')?.trim() || null

    const where: any = {}

    // LAVADOR: solo OTs donde figura asignado en orden_trabajo_empleados
    if (otScope === 'assigned') {
      where.empleados = { some: { empleadoId: session.user.id } }
    }

    // Sucursal: los usuarios con sucursal asignada ven solo la suya;
    // DUEÑO/ADMIN pueden filtrar por ?sucursalId= o ver todas.
    if (session.user.sucursalId) {
      where.sucursalId = session.user.sucursalId
    } else if (sucursalIdParam) {
      where.sucursalId = sucursalIdParam
    }

    if (estado) {
      where.estado = estado
    }

    // Por defecto NO mostrar OTs externas (trabajo fuera del lavadero)
    if (!incluirExternas) {
      where.esExterna = false
    }

    if (fecha) {
      // Asegurar que la fecha se interprete correctamente (evitar problemas de zona horaria)
      const fechaStr = fecha.split('T')[0] // Asegurar formato YYYY-MM-DD
      const fechaInicio = new Date(fechaStr + 'T00:00:00.000')
      const fechaFin = new Date(fechaStr + 'T23:59:59.999')
      
      where.fechaIngreso = {
        gte: fechaInicio,
        lte: fechaFin,
      }
    }

    const ots = await prisma.ordenTrabajo.findMany({
      where,
      include: {
        servicio: true,
        extras: {
          include: {
            extra: true,
          },
        },
        usuarioCreador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaIngreso: 'asc' },
    })

    // Obtener pagos para todas las OTs de una vez (optimización)
    const otsIds = ots.map((ot) => ot.id)
    const pagos = await prisma.pago.findMany({
      where: {
        ordenTrabajoId: { in: otsIds },
      },
      select: {
        ordenTrabajoId: true,
        monto: true,
      },
    })

    // Agrupar pagos por OT
    const pagosPorOT = pagos.reduce((acc, pago) => {
      if (!acc[pago.ordenTrabajoId]) {
        acc[pago.ordenTrabajoId] = 0
      }
      acc[pago.ordenTrabajoId] += Number(pago.monto)
      return acc
    }, {} as Record<string, number>)

    // Transformar la respuesta para que sea más fácil de usar en el frontend
    const otsFormateadas = ots.map((ot) => {
      const totalPagado = pagosPorOT[ot.id] || 0
      const pendiente = Number(ot.total) - totalPagado
      const estaPagada = pendiente <= 0
      
      return {
        ...ot,
        extras: ot.extras.map((e) => e.extra),
        precio: Number(ot.total),
        totalPagado,
        pendiente,
        estaPagada,
        servicio: {
          ...ot.servicio,
          precio: Number(ot.servicio.precio),
        },
      }
    })

    return NextResponse.json(otsFormateadas)
  } catch (error) {
    console.error('Error al obtener OTs:', error)
    return NextResponse.json(
      { error: 'Error al obtener órdenes de trabajo' },
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

    if (!hasPermission(session.user.role, 'ot:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    // Validación con Zod
    const validationResult = crearOTSchema.safeParse(body)
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

    const {
      servicioId,
      extrasIds = [],
      empleadosIds,
      patente,
      tipoVehiculo,
      descripcionVehiculo,
      nombreCliente,
      telefonoCliente,
      horarioDeseado,
      clienteId,
      sucursalId: sucursalIdBody,
      observaciones,
      precioAjustado,
      justificacionPrecio,
      fotoUrl,
    } = validationResult.data

    // Resolver sucursal: si el usuario pertenece a una, se fuerza la suya;
    // si no (DUEÑO/ADMIN), debe indicarla en el body.
    const sucursalId = session.user.sucursalId || sucursalIdBody
    if (!sucursalId) {
      return NextResponse.json(
        { error: 'Debe indicar la sucursal de la orden' },
        { status: 400 }
      )
    }
    const sucursal = await prisma.sucursal.findUnique({ where: { id: sucursalId } })
    if (!sucursal || !sucursal.activo) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada o inactiva' },
        { status: 400 }
      )
    }

    // Obtener servicio y extras para calcular total
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
    })

    if (!servicio || !servicio.activo) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o inactivo' },
        { status: 400 }
      )
    }

    const lavadoresValidos = await prisma.usuario.findMany({
      where: {
        id: { in: empleadosIds },
        rol: 'LAVADOR',
        activo: true,
      },
      select: { id: true },
    })
    if (lavadoresValidos.length !== empleadosIds.length) {
      return NextResponse.json(
        { error: 'Debe asignar solo lavadores activos válidos' },
        { status: 400 }
      )
    }

    let extras: any[] = []
    if (extrasIds.length > 0) {
      extras = await prisma.extra.findMany({
        where: {
          id: { in: extrasIds },
          activo: true,
        },
      })

      if (extras.length !== extrasIds.length) {
        return NextResponse.json(
          { error: 'Uno o más extras no encontrados o inactivos' },
          { status: 400 }
        )
      }
    }

    // Validar y obtener cliente si se proporciona
    let cliente: any = null
    if (clienteId) {
      cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
      })

      if (!cliente || !cliente.activo) {
        return NextResponse.json(
          { error: 'Cliente no encontrado o inactivo' },
          { status: 400 }
        )
      }

      if (cliente.tipo !== 'CONCESIONARIA') {
        return NextResponse.json(
          { error: 'El cliente seleccionado no es una concesionaria' },
          { status: 400 }
        )
      }
    }

    const esExterna = Boolean(cliente?.trabajoExterno)

    // Validar horario solo si NO es externa
    if (!esExterna && !horarioDeseado) {
      return NextResponse.json(
        { error: 'El horario deseado es obligatorio para OTs en lavadero' },
        { status: 400 }
      )
    }

    // La justificación es obligatoria si se ajusta el precio manualmente
    if (precioAjustado !== undefined && precioAjustado !== null && !justificacionPrecio) {
      return NextResponse.json(
        { error: 'Justificación requerida si se ajusta el precio' },
        { status: 400 }
      )
    }

    // Calcular total con la regla compartida (montos fijos / descuento / ajuste)
    const total = calcularTotalOT({
      servicioId,
      precioServicio: Number(servicio.precio),
      extras: extras.map((e) => ({ id: e.id, precio: Number(e.precio) })),
      cliente,
      precioAjustado,
    })

    const ot = await prisma.$transaction(async (tx) => {
      const nuevaOT = await tx.ordenTrabajo.create({
        data: {
          fechaIngreso: new Date(),
          patente: patente.trim(),
          tipoVehiculo: tipoVehiculo || null,
          descripcionVehiculo: descripcionVehiculo?.trim() || null,
          fotoUrl: fotoUrl || null,
          nombreCliente: nombreCliente.trim(),
          telefonoCliente: telefonoCliente.trim(),
          horarioDeseado: esExterna ? null : (horarioDeseado ?? null),
          esExterna,
          clienteId: clienteId || null,
          sucursalId,
          servicioId,
          observaciones: observaciones || null,
          estado: 'EN_COLA',
          total,
          precioAjustado: precioAjustado ?? null,
          justificacionPrecio: justificacionPrecio || null,
          usuarioCreadorId: session.user.id,
          extras: {
            create: extrasIds.map((extraId: string) => ({
              extraId,
            })),
          },
          empleados: {
            create: empleadosIds.map((empleadoId: string) => ({
              empleadoId,
            })),
          },
        },
        include: {
          servicio: true,
          extras: {
            include: {
              extra: true,
            },
          },
          empleados: {
            include: {
              empleado: {
                select: { id: true, nombre: true },
              },
            },
          },
        },
      })

      // Registrar cambio de estado inicial en historial
      // Para la creación inicial, no hay estado anterior, así que usamos el mismo estado
      await tx.estadoHistorial.create({
        data: {
          ordenTrabajoId: nuevaOT.id,
          estadoAnterior: 'EN_COLA', // Estado inicial, no hay anterior
          estadoNuevo: 'EN_COLA',
          usuarioId: session.user.id,
          fechaHora: new Date(),
        },
      })

      // Registrar en log de auditoría
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'OT_CREATED',
          entidad: 'OrdenTrabajo',
          entidadId: nuevaOT.id,
          datos: JSON.stringify({
            patente: patente || null,
            tipoVehiculo,
            servicioId,
            total,
          }),
        },
      })

      return nuevaOT
    })

    // Formatear respuesta
    const otAny = ot as any
    const otFormateada = {
      ...otAny,
      extras: (otAny.extras || []).map((e: any) => e.extra),
      empleados: (otAny.empleados || []).map((e: any) => e.empleado),
      precio: Number(otAny.total),
      servicio: otAny.servicio
        ? {
            ...otAny.servicio,
            precio: Number(otAny.servicio.precio),
          }
        : undefined,
    }

    return NextResponse.json(otFormateada, { status: 201 })
  } catch (error: any) {
    console.error('[API OTs POST] Error al crear OT:', error?.message ?? error)

    // En desarrollo, retornar más detalles
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Error desconocido'
      : 'Error al crear orden de trabajo'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: error?.code,
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          meta: error?.meta,
        } : undefined
      },
      { status: 500 }
    )
  }
}

