/**
 * API Route: OT individual
 * GET: Obtener OT por ID
 * PUT: Actualizar OT (solo EN_COLA o EN_PROCESO)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'
import { filtroCatalogoSucursal } from '@/lib/catalogo-sucursal'
import { canEditOT, calcularTotalOT } from '@/lib/reglas-negocio'
import { editarOTSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ENCARGADO y DUENO pueden ver OTs
    if (!hasPermission(session.user.role, 'ot:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Scoping multi-tenant: solo OTs de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const ot = await prisma.ordenTrabajo.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
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
        estadosHistorial: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
          orderBy: { fechaHora: 'desc' },
        },
      },
    })

    if (!ot) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }


    // Obtener pagos para calcular estado de pago
    const pagos = await prisma.pago.findMany({
      where: { ordenTrabajoId: params.id },
      select: { monto: true },
    })
    const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const pendiente = Number(ot.total) - totalPagado

    // Formatear respuesta
    const otFormateada = {
      ...ot,
      extras: ot.extras.map((e) => e.extra),
      precio: Number(ot.total),
      totalPagado,
      pendiente,
      estaPagada: pendiente <= 0,
      servicio: {
        ...ot.servicio,
        precio: Number(ot.servicio.precio),
      },
    }

    return NextResponse.json(otFormateada)
  } catch (error) {
    console.error('Error al obtener OT:', error)
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'ot:edit')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Scoping multi-tenant: solo se puede editar una OT de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    // Obtener OT actual
    const otActual = await prisma.ordenTrabajo.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
    })

    if (!otActual) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que se puede editar
    if (!canEditOT(otActual.estado)) {
      return NextResponse.json(
        { error: 'Solo se pueden editar OTs en estado EN_COLA o EN_PROCESO' },
        { status: 400 }
      )
    }

    // Una OT con pagos registrados NO se puede editar: el precio ya se cobró
    // (total o parcialmente) y modificarla rompería la caja.
    const pagosExistentes = await prisma.pago.count({
      where: { ordenTrabajoId: params.id },
    })
    if (pagosExistentes > 0) {
      return NextResponse.json(
        { error: 'No se puede editar una OT que ya tiene pagos registrados' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const validationResult = editarOTSchema.safeParse(body)
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
      observaciones,
      precioAjustado,
      justificacionPrecio,
    } = validationResult.data

    // El cliente y "esExterna" se derivan de la OT existente (no cambian al editar)
    const cliente = otActual.clienteId
      ? await prisma.cliente.findUnique({ where: { id: otActual.clienteId } })
      : null
    const esExterna = Boolean(cliente?.trabajoExterno)

    // El horario es obligatorio salvo en OTs externas
    if (!esExterna && !horarioDeseado) {
      return NextResponse.json(
        { error: 'El horario deseado es obligatorio para OTs en lavadero' },
        { status: 400 }
      )
    }

    // La justificación es obligatoria si se ajusta el precio
    if (precioAjustado !== undefined && precioAjustado !== null && !justificacionPrecio) {
      return NextResponse.json(
        { error: 'Justificación requerida si se ajusta el precio' },
        { status: 400 }
      )
    }

    const servicio = await prisma.servicio.findFirst({
      where: {
        id: servicioId,
        empresaId: otActual.empresaId,
        ...filtroCatalogoSucursal(otActual.sucursalId),
      },
    })

    if (!servicio || !servicio.activo) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o inactivo' },
        { status: 400 }
      )
    }

    let extras: { id: string; precio: unknown }[] = []
    if (extrasIds.length > 0) {
      extras = await prisma.extra.findMany({
        where: {
          id: { in: extrasIds },
          activo: true,
          empresaId: otActual.empresaId,
          ...filtroCatalogoSucursal(otActual.sucursalId),
        },
      })

      if (extras.length !== extrasIds.length) {
        return NextResponse.json(
          { error: 'Uno o más extras no encontrados o inactivos' },
          { status: 400 }
        )
      }
    }

    // Calcular total con la regla compartida (montos fijos / descuento / ajuste)
    const total = calcularTotalOT({
      servicioId,
      precioServicio: Number(servicio.precio),
      extras: extras.map((e) => ({ id: e.id, precio: Number(e.precio) })),
      cliente,
      precioAjustado,
    })

    // Auditoría: registrar SOLO los campos que cambiaron, con antes → después
    const extrasAnteriores = await prisma.ordenTrabajoExtra.findMany({
      where: { ordenTrabajoId: params.id },
      select: { extraId: true },
    })
    const nuevoHorario = esExterna ? null : (horarioDeseado ?? null)
    const valoresNuevos: Record<string, unknown> = {
      patente: patente.trim(),
      tipoVehiculo: tipoVehiculo || null,
      descripcionVehiculo: descripcionVehiculo?.trim() || null,
      nombreCliente: nombreCliente.trim(),
      telefonoCliente: telefonoCliente.trim(),
      horarioDeseado: nuevoHorario ? new Date(nuevoHorario).toISOString() : null,
      servicioId,
      observaciones: observaciones || null,
      total,
      precioAjustado: precioAjustado ?? null,
      justificacionPrecio: justificacionPrecio || null,
      extrasIds: [...extrasIds].sort(),
    }
    const valoresAnteriores: Record<string, unknown> = {
      patente: otActual.patente,
      tipoVehiculo: otActual.tipoVehiculo,
      descripcionVehiculo: otActual.descripcionVehiculo,
      nombreCliente: otActual.nombreCliente,
      telefonoCliente: otActual.telefonoCliente,
      horarioDeseado: otActual.horarioDeseado ? otActual.horarioDeseado.toISOString() : null,
      servicioId: otActual.servicioId,
      observaciones: otActual.observaciones,
      total: Number(otActual.total),
      precioAjustado: otActual.precioAjustado ? Number(otActual.precioAjustado) : null,
      justificacionPrecio: otActual.justificacionPrecio,
      extrasIds: extrasAnteriores.map((e) => e.extraId).sort(),
    }
    const cambios: Record<string, { antes: unknown; despues: unknown }> = {}
    for (const campo of Object.keys(valoresNuevos)) {
      if (JSON.stringify(valoresAnteriores[campo]) !== JSON.stringify(valoresNuevos[campo])) {
        cambios[campo] = { antes: valoresAnteriores[campo], despues: valoresNuevos[campo] }
      }
    }

    // Actualizar OT con transacción
    const ot = await prisma.$transaction(async (tx) => {
      // Eliminar relaciones existentes
      await tx.ordenTrabajoExtra.deleteMany({
        where: { ordenTrabajoId: params.id },
      })

      // Actualizar OT
      const otActualizada = await tx.ordenTrabajo.update({
        where: { id: params.id },
        data: {
          patente: patente.trim(),
          tipoVehiculo: tipoVehiculo || null,
          descripcionVehiculo: descripcionVehiculo?.trim() || null,
          nombreCliente: nombreCliente.trim(),
          telefonoCliente: telefonoCliente.trim(),
          horarioDeseado: esExterna ? null : (horarioDeseado ?? null),
          esExterna,
          servicioId,
          observaciones: observaciones || null,
          total,
          precioAjustado: precioAjustado ?? null,
          justificacionPrecio: justificacionPrecio || null,
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
        },
      })

      // Registrar en log de auditoría: quién editó y qué cambió (antes → después)
      await tx.auditoriaLog.create({
        data: {
          usuarioId: session.user.id,
          accion: 'OT_UPDATED',
          entidad: 'OrdenTrabajo',
          entidadId: params.id,
          datos: JSON.stringify({
            patente: otActual.patente,
            cambios,
          }),
        },
      })

      return otActualizada
    })

    // Obtener pagos para calcular estado de pago
    const pagosActualizados = await prisma.pago.findMany({
      where: { ordenTrabajoId: params.id },
      select: { monto: true },
    })
    const totalPagado = pagosActualizados.reduce((sum, p) => sum + Number(p.monto), 0)
    const pendiente = Number(ot.total) - totalPagado

    // Formatear respuesta
    const otAny = ot as any
    const otFormateada = {
      ...otAny,
      extras: (otAny.extras || []).map((e: any) => e.extra),
      precio: Number(otAny.total),
      totalPagado,
      pendiente,
      estaPagada: pendiente <= 0,
      servicio: otAny.servicio
        ? {
            ...otAny.servicio,
            precio: Number(otAny.servicio.precio),
          }
        : undefined,
    }

    return NextResponse.json(otFormateada)
  } catch (error) {
    console.error('Error al actualizar OT:', error)
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    )
  }
}

