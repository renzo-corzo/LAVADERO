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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Permitir acceso a LAVADOR para ver sus OTs asignadas
    // y a ENCARGADO/DUENO para ver todas
    if (!hasPermission(session.user.role, 'ot:view') && !hasPermission(session.user.role, 'ot:view:assigned')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const estado = searchParams.get('estado')
    const empleadoId = searchParams.get('empleadoId')
    const fecha = searchParams.get('fecha') // formato: YYYY-MM-DD

    // Si es LAVADOR, solo mostrar sus OTs asignadas
    const where: any = {}
    if (session.user.role === 'LAVADOR') {
      where.empleados = {
        some: {
          empleadoId: session.user.id,
        },
      }
    }

    if (estado) {
      where.estado = estado
    }

    if (empleadoId && session.user.role !== 'LAVADOR') {
      where.empleados = {
        some: {
          empleadoId,
        },
      }
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
        empleados: {
          include: {
            empleado: {
              select: {
                id: true,
                nombre: true,
              },
            },
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
        empleados: ot.empleados.map((e) => e.empleado),
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
    console.log('Body recibido:', JSON.stringify(body, null, 2))
    const {
      servicioId,
      extrasIds = [],
      patente,
      tipoVehiculo,
      descripcionVehiculo,
      nombreCliente,
      telefonoCliente,
      horarioDeseado,
      empleadosIds,
      observaciones,
      precioAjustado,
      justificacionPrecio,
    } = body

    // Validaciones
    if (!servicioId || !patente || !nombreCliente || !telefonoCliente || !horarioDeseado) {
      return NextResponse.json(
        { error: 'Servicio, patente, nombre del cliente, teléfono y horario deseado son obligatorios' },
        { status: 400 }
      )
    }

    // Si es LAVADOR y no tiene empleados asignados, asignarse a sí mismo
    let empleadosIdsFinales = empleadosIds || []
    if (session.user.role === 'LAVADOR' && empleadosIdsFinales.length === 0) {
      empleadosIdsFinales = [session.user.id]
    }

    // Para ENCARGADO/DUENO, validar que tenga al menos un empleado
    if ((session.user.role === 'ENCARGADO' || session.user.role === 'DUENO') && empleadosIdsFinales.length === 0) {
      return NextResponse.json(
        { error: 'Debe asignar al menos un empleado' },
        { status: 400 }
      )
    }
    
    // Validar que patente no esté vacío
    if (!patente || typeof patente !== 'string' || !patente.trim()) {
      return NextResponse.json(
        { error: 'La patente es obligatoria y no puede estar vacía' },
        { status: 400 }
      )
    }
    
    // Validar que nombre y teléfono no estén vacíos
    if (!nombreCliente || typeof nombreCliente !== 'string' || !nombreCliente.trim()) {
      return NextResponse.json(
        { error: 'El nombre del cliente es obligatorio' },
        { status: 400 }
      )
    }
    
    if (!telefonoCliente || typeof telefonoCliente !== 'string' || !telefonoCliente.trim()) {
      return NextResponse.json(
        { error: 'El teléfono del cliente es obligatorio' },
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

    // Calcular total
    let total = Number(servicio.precio)
    extras.forEach((extra) => {
      total += Number(extra.precio)
    })

    // Si hay precio ajustado, usar ese
    if (precioAjustado !== undefined && precioAjustado !== null) {
      total = parseFloat(precioAjustado)
      if (!justificacionPrecio) {
        return NextResponse.json(
          { error: 'Justificación requerida si se ajusta el precio' },
          { status: 400 }
        )
      }
    }

    // Crear OT con transacción
    const ot = await prisma.$transaction(async (tx) => {
      const nuevaOT = await tx.ordenTrabajo.create({
        data: {
          fechaIngreso: new Date(),
          patente: patente?.trim() || '',
          tipoVehiculo: tipoVehiculo || null,
          descripcionVehiculo: descripcionVehiculo?.trim() || null,
          nombreCliente: nombreCliente?.trim() || null,
          telefonoCliente: telefonoCliente?.trim() || null,
          horarioDeseado: horarioDeseado ? (() => {
            try {
              const fecha = new Date(horarioDeseado)
              if (isNaN(fecha.getTime())) {
                console.error('Fecha inválida recibida:', horarioDeseado)
                return null
              }
              return fecha
            } catch (error) {
              console.error('Error al parsear fecha horarioDeseado:', error)
              return null
            }
          })() : null,
          servicioId,
          observaciones: observaciones || null,
          estado: 'EN_COLA',
          total,
          precioAjustado: precioAjustado ? parseFloat(precioAjustado) : null,
          justificacionPrecio: justificacionPrecio || null,
          usuarioCreadorId: session.user.id,
          empleados: {
            create: empleadosIdsFinales.map((empleadoId: string) => ({
              empleadoId,
            })),
          },
          extras: {
            create: extrasIds.map((extraId: string) => ({
              extraId,
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
                select: {
                  id: true,
                  nombre: true,
                },
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
    const otFormateada = {
      ...ot,
      extras: ot.extras.map((e) => e.extra),
      empleados: ot.empleados.map((e) => e.empleado),
      precio: Number(ot.total),
      servicio: {
        ...ot.servicio,
        precio: Number(ot.servicio.precio),
      },
    }

    return NextResponse.json(otFormateada, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear OT:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
    })
    return NextResponse.json(
      { 
        error: 'Error al crear orden de trabajo',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

