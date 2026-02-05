/**
 * API Route: Órdenes de Trabajo (OT)
 * GET: Listar OTs
 * POST: Crear OT
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { crearOTSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ENCARGADO y DUENO pueden ver OTs
    if (!hasPermission(session.user.role, 'ot:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const fecha = searchParams.get('fecha') // formato: YYYY-MM-DD
    const incluirExternas = searchParams.get('incluirExternas') === 'true'

    const where: any = {}

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
    console.log('[API OTs POST] Body recibido:', JSON.stringify(body, null, 2))
    console.log('[API OTs POST] Session user:', { id: session.user.id, role: session.user.role })

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
      patente,
      tipoVehiculo,
      descripcionVehiculo,
      nombreCliente,
      telefonoCliente,
      horarioDeseado,
      clienteId,
      observaciones,
      precioAjustado,
      justificacionPrecio,
    } = validationResult.data

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

    // Calcular total
    const isPlainObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null && !Array.isArray(v)

    const asNumberRecord = (v: unknown): Record<string, number> => {
      if (!isPlainObject(v)) return {}
      const out: Record<string, number> = {}
      for (const [k, val] of Object.entries(v)) {
        if (typeof val === 'number' && Number.isFinite(val)) out[k] = val
      }
      return out
    }

    const usaMontosFijos = Boolean(cliente?.usaMontosFijos)
    const montosFijosServicios = asNumberRecord(cliente?.montosFijosServicios)
    const montosFijosExtras = asNumberRecord(cliente?.montosFijosExtras)

    let total = 0
    const precioServicioFinal = usaMontosFijos
      ? montosFijosServicios[servicioId] ?? Number(servicio.precio)
      : Number(servicio.precio)
    total += Number(precioServicioFinal)

    extras.forEach((extra) => {
      const precioExtraFinal = usaMontosFijos
        ? montosFijosExtras[extra.id] ?? Number(extra.precio)
        : Number(extra.precio)
      total += Number(precioExtraFinal)
    })

    // Aplicar descuento del cliente SOLO si NO usa montos fijos
    if (!usaMontosFijos && cliente && cliente.descuentoPorcentaje) {
      const descuento = (total * cliente.descuentoPorcentaje) / 100
      total = total - descuento
    }

    // Si hay precio ajustado, usar ese (sobrescribe el descuento)
    if (precioAjustado !== undefined && precioAjustado !== null) {
      total = precioAjustado
      if (!justificacionPrecio) {
        return NextResponse.json(
          { error: 'Justificación requerida si se ajusta el precio' },
          { status: 400 }
        )
      }
    }

    // Crear OT con transacción
    console.log('[API OTs POST] Iniciando creación de OT...')
    const ot = await prisma.$transaction(async (tx) => {
      console.log('[API OTs POST] Creando OT en BD...')
      const nuevaOT = await tx.ordenTrabajo.create({
        data: ({
          fechaIngreso: new Date(),
          patente: patente?.trim() || '',
          tipoVehiculo: tipoVehiculo || null,
          descripcionVehiculo: descripcionVehiculo?.trim() || null,
          nombreCliente: nombreCliente?.trim() || null,
          telefonoCliente: telefonoCliente?.trim() || null,
          horarioDeseado: esExterna ? null : (horarioDeseado ? new Date(horarioDeseado as any) : null),
          esExterna,
          clienteId: clienteId || null,
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
        } as any),
        include: {
          servicio: true,
          extras: {
            include: {
              extra: true,
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

    console.log('[API OTs POST] OT creada exitosamente:', ot.id)

    // Formatear respuesta
    const otAny = ot as any
    const otFormateada = {
      ...otAny,
      extras: (otAny.extras || []).map((e: any) => e.extra),
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
    console.error('❌ [API OTs POST] Error al crear OT:', error)
    console.error('❌ [API OTs POST] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 10).join('\n'), // Solo primeras 10 líneas
    })
    
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

