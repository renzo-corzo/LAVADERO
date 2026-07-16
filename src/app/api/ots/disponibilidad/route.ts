/**
 * API Route: Disponibilidad de Horarios
 * POST: Calcular disponibilidad y validar horario deseado
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'

interface DisponibilidadRequest {
  servicioId: string
  extrasIds: string[]
  horarioDeseado: string // ISO string
  fechaIngreso?: string // ISO string, opcional (default: ahora)
  excludeOTId?: string // Para excluir una OT en edición
  clienteId?: string | null // opcional: para OTs externas (sin turnos)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'ot:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Scoping multi-tenant: la disponibilidad se calcula por empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const body: DisponibilidadRequest = await request.json()
    const { servicioId, extrasIds = [], horarioDeseado, fechaIngreso, excludeOTId, clienteId } = body

    // Capacidad por sucursal: usuarios con sucursal usan la suya; DUEÑO/ADMIN
    // envían la elegida en el body. Sin sucursal resoluble no se filtra (compat).
    const sucursalId =
      session.user.sucursalId || (body as any).sucursalId?.trim?.() || null

    // Si es OT externa (cliente con trabajoExterno), no se valida horario
    if (clienteId) {
      const cliente: any = await prisma.cliente.findUnique({ where: { id: clienteId } })
      if (cliente?.trabajoExterno) {
        return NextResponse.json({
          disponible: true,
          conflicto: null,
          horariosDisponibles: [],
          motivo: 'OT externa: no ocupa turnos',
        })
      }
    }

    if (!servicioId || !horarioDeseado) {
      return NextResponse.json(
        { error: 'servicioId y horarioDeseado son requeridos' },
        { status: 400 }
      )
    }

    // Obtener servicio y extras para calcular duración
    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    const extras = extrasIds.length > 0
      ? await prisma.extra.findMany({
          where: {
            id: { in: extrasIds },
            activo: true,
          },
        })
      : []

    // Calcular duración total estimada (en minutos)
    let duracionTotal = servicio.duracionEstimada || 60 // Default: 60 minutos si no tiene
    extras.forEach((extra) => {
      duracionTotal += extra.duracionEstimada || 15 // Default: 15 min por extra
    })

    // Fechas
    const fechaIngresoOT = fechaIngreso ? new Date(fechaIngreso) : new Date()
    const horarioDeseadoDate = new Date(horarioDeseado)
    const ahora = new Date()

    // Validar que el horario deseado sea en el futuro
    if (horarioDeseadoDate <= ahora) {
      return NextResponse.json({
        disponible: false,
        conflicto: 'El horario deseado debe ser en el futuro',
        horariosDisponibles: [],
      })
    }

    // Validar que el horario deseado sea suficiente para completar el trabajo
    const tiempoDisponible = (horarioDeseadoDate.getTime() - fechaIngresoOT.getTime()) / 60000 // minutos
    if (tiempoDisponible < duracionTotal) {
      return NextResponse.json({
        disponible: false,
        conflicto: `El horario deseado no permite completar el trabajo. Se necesitan al menos ${duracionTotal} minutos.`,
        duracionNecesaria: duracionTotal,
        tiempoDisponible: Math.round(tiempoDisponible),
        horariosDisponibles: [],
      })
    }

    // Obtener OTs activas del mismo día (excluyendo la OT actual si se está editando)
    const fechaInicio = new Date(fechaIngresoOT)
    fechaInicio.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaIngresoOT)
    fechaFin.setHours(23, 59, 59, 999)

    const whereClause: any = {
      fechaIngreso: {
        gte: fechaInicio,
        lte: fechaFin,
      },
      esExterna: false,
      estado: {
        in: ['EN_COLA', 'EN_PROCESO', 'LISTO'], // Solo OTs activas
      },
      ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      ...(sucursalId ? { sucursalId } : {}),
    }

    if (excludeOTId) {
      whereClause.id = { not: excludeOTId }
    }

    const otsActivas = await prisma.ordenTrabajo.findMany({
      where: whereClause,
      include: {
        servicio: true,
        extras: { include: { extra: true } },
      },
      orderBy: { fechaIngreso: 'asc' },
    })

    // Calcular rangos ocupados y detectar conflictos
    const rangosOcupados: Array<{ inicio: Date; fin: Date; ot: any }> = []
    let tieneConflicto = false
    let conflictoDetalle = ''

    for (const ot of otsActivas) {
      // Calcular duración de esta OT
      let duracionOT = ot.servicio.duracionEstimada || 60
      ot.extras.forEach((oe: any) => {
        duracionOT += oe.extra.duracionEstimada || 15
      })

      const inicioOT = new Date(ot.fechaIngreso)
      // Si la OT tiene horario deseado, usarlo como fin estimado
      // Si no, calcular basado en duración
      const finOT = ot.horarioDeseado 
        ? new Date(ot.horarioDeseado)
        : new Date(inicioOT.getTime() + duracionOT * 60000)

      rangosOcupados.push({
        inicio: inicioOT,
        fin: finOT,
        ot: { id: ot.id, patente: ot.patente, cliente: ot.nombreCliente || 'Sin nombre' },
      })

      // Verificar si hay conflicto con el horario deseado de la nueva OT
      // Conflicto solo si: el horario deseado de la nueva OT es ANTES o muy cerca del fin de otra OT
      // que empieza después de la fecha de ingreso de la nueva OT
      
      // Calcular cuándo necesitaría empezar la nueva OT para terminarla a tiempo
      const inicioNecesarioNuevaOT = new Date(horarioDeseadoDate.getTime() - duracionTotal * 60000)
      
      // Solo hay conflicto real si:
      // 1. La nueva OT necesita empezar antes del fin de otra OT activa
      // 2. Y esa OT empieza antes del horario deseado de la nueva OT
      // Es decir, hay solapamiento real de trabajo
      if (
        inicioNecesarioNuevaOT < finOT && // La nueva OT necesita empezar antes de que termine la otra
        finOT > fechaIngresoOT && // La otra OT termina después del inicio de la nueva
        inicioOT < horarioDeseadoDate // La otra OT empieza antes del horario deseado de la nueva
      ) {
        tieneConflicto = true
        const horaFin = finOT.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
        conflictoDetalle = `Posible conflicto: OT de ${ot.patente} (${ot.nombreCliente || 'Sin nombre'}) tiene horario deseado hasta las ${horaFin}`
      }
    }

    // Generar sugerencias SOLO si hay conflicto REAL y el horario deseado es insuficiente
    const horariosDisponibles: string[] = []
    if (tieneConflicto) {
      // Encontrar el último fin de todas las OTs activas
      const ultimoFin = rangosOcupados.length > 0
        ? new Date(Math.max(...rangosOcupados.map((r) => r.fin.getTime())))
        : fechaIngresoOT

      // Calcular el horario mínimo necesario (último fin + duración nueva OT)
      const horarioMinimoNecesario = new Date(ultimoFin.getTime() + duracionTotal * 60000)

      // Solo sugerir horarios si el horario deseado es ANTES del mínimo necesario
      // Si el usuario puso un horario DESPUÉS, no sugerir nada
      if (horarioDeseadoDate < horarioMinimoNecesario) {
        // Sugerir horarios: desde el mínimo necesario, cada 15 minutos, hasta 3 sugerencias
        for (let i = 0; i < 3; i++) {
          const sugerencia = new Date(horarioMinimoNecesario.getTime() + (i * 15 * 60000))
          // Solo sugerir si está en el mismo día
          if (sugerencia.toDateString() === fechaIngresoOT.toDateString()) {
            const horaStr = sugerencia.toTimeString().slice(0, 5) // HH:MM
            horariosDisponibles.push(horaStr)
          }
        }
      }
    }

    return NextResponse.json({
      disponible: !tieneConflicto,
      conflicto: tieneConflicto ? conflictoDetalle : null,
      duracionEstimada: duracionTotal,
      rangosOcupados: rangosOcupados.map((r) => ({
        inicio: r.inicio.toISOString(),
        fin: r.fin.toISOString(),
        ot: r.ot,
      })),
      horariosDisponibles,
    })
  } catch (error) {
    console.error('Error al calcular disponibilidad:', error)
    return NextResponse.json(
      { error: 'Error al calcular disponibilidad' },
      { status: 500 }
    )
  }
}

