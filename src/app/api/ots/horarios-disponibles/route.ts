/**
 * API Route: Horarios Disponibles del Día
 * GET: Obtener todos los horarios disponibles y ocupados del día en formato de grilla
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Permitir acceso a cualquier usuario autenticado para ver horarios disponibles
    // Esto es necesario para que cualquier rol pueda visualizar la disponibilidad
    // incluso si no tiene permiso completo para crear OTs

    const searchParams = request.nextUrl.searchParams
    const fecha = searchParams.get('fecha') // formato: YYYY-MM-DD o ISO string
    const servicioId = searchParams.get('servicioId')
    const extrasIds = searchParams.get('extrasIds')?.split(',') || []
    const excludeOTId = searchParams.get('excludeOTId')

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    // Parsear fecha correctamente (puede venir como YYYY-MM-DD o ISO string)
    // IMPORTANTE: Usar hora local para evitar problemas de zona horaria
    const fechaStr = fecha.split('T')[0] // Asegurar formato YYYY-MM-DD
    const fechaConsulta = new Date(fechaStr + 'T00:00:00')
    
    // Normalizar a medianoche en hora local (no UTC)
    const fechaInicio = new Date(fechaConsulta)
    fechaInicio.setHours(0, 0, 0, 0)
    fechaInicio.setMinutes(0, 0)
    fechaInicio.setSeconds(0, 0)
    fechaInicio.setMilliseconds(0)
    
    const fechaFin = new Date(fechaConsulta)
    fechaFin.setHours(23, 59, 59, 999)
    fechaFin.setMinutes(59, 59)
    fechaFin.setSeconds(59, 999)
    
    console.log(`[horarios-disponibles] Fecha consulta parseada:`, {
      fechaOriginal: fecha,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      fechaInicioLocal: fechaInicio.toLocaleString('es-AR'),
    })

    // Calcular duración del servicio si se proporciona
    let duracionTotal = 60 // Default
    if (servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
      })
      if (servicio) {
        duracionTotal = servicio.duracionEstimada || 60
      }

      if (extrasIds.length > 0) {
        const extras = await prisma.extra.findMany({
          where: {
            id: { in: extrasIds },
            activo: true,
          },
        })
        extras.forEach((extra) => {
          duracionTotal += extra.duracionEstimada || 15
        })
      }
    }

    // Obtener OTs activas del día
    // Buscar OTs que:
    // 1. Tengan fechaIngreso en el día consultado, O
    // 2. Tengan horarioDeseado en el día consultado
    // IMPORTANTE: Normalizar las fechas correctamente para comparaciones
    const whereClause: any = {
      OR: [
        {
          fechaIngreso: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        {
          horarioDeseado: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      ],
      estado: {
        in: ['EN_COLA', 'EN_PROCESO', 'LISTO'],
      },
    }
    
    console.log(`[horarios-disponibles] Buscando OTs en rango: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`)

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

    console.log(`[horarios-disponibles] OTs activas encontradas: ${otsActivas.length}`)
    console.log(`[horarios-disponibles] Fecha consulta: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`)
    console.log(`[horarios-disponibles] Duración total servicio: ${duracionTotal} minutos`)
    otsActivas.forEach(ot => {
      const horarioStr = ot.horarioDeseado ? new Date(ot.horarioDeseado).toTimeString().slice(0, 5) : 'Sin horario'
      console.log(`[horarios-disponibles] OT: ${ot.patente} - Estado: ${ot.estado} - Horario deseado: ${horarioStr} - Fecha ingreso: ${new Date(ot.fechaIngreso).toISOString()}`)
    })

    // Generar bloques de tiempo de 15 minutos desde las 8:00 hasta las 22:00
    const bloques: Array<{
      hora: string // HH:MM
      disponible: boolean
      ocupadoPor?: { patente: string; cliente: string; fin: string }
      esHorarioDeseado?: boolean
    }> = []

    const inicioDia = new Date(fechaInicio)
    inicioDia.setHours(8, 0, 0, 0) // Desde las 8:00
    const finDia = new Date(fechaInicio)
    finDia.setHours(22, 0, 0, 0) // Hasta las 22:00

    // Calcular rangos ocupados basados en horarios deseados de OTs existentes
    const rangosOcupados: Array<{ inicio: Date; fin: Date; ot: any }> = []
    for (const ot of otsActivas) {
      let duracionOT = ot.servicio.duracionEstimada || 60
      ot.extras.forEach((oe: any) => {
        duracionOT += oe.extra.duracionEstimada || 15
      })

      const inicioOT = new Date(ot.fechaIngreso)
      // Si tiene horario deseado, ese es cuando termina
      // Normalizar el horario deseado al día de consulta para comparaciones
      let finOT: Date
      if (ot.horarioDeseado) {
        // Extraer solo la hora del horario deseado y aplicar al día de consulta
        const horarioDeseadoDate = new Date(ot.horarioDeseado)
        const horarioStr = horarioDeseadoDate.toTimeString().slice(0, 5) // HH:MM
        const [horas, minutos] = horarioStr.split(':').map(Number)
        finOT = new Date(fechaInicio)
        finOT.setHours(horas, minutos, 0, 0)
      } else {
        finOT = new Date(inicioOT.getTime() + duracionOT * 60000)
        // Normalizar también al día de consulta
        const finStr = finOT.toTimeString().slice(0, 5)
        const [horas, minutos] = finStr.split(':').map(Number)
        finOT = new Date(fechaInicio)
        finOT.setHours(horas, minutos, 0, 0)
      }

      // Debug: mostrar información de la OT
      if (ot.horarioDeseado) {
        const horarioDeseadoStr = new Date(ot.horarioDeseado).toTimeString().slice(0, 5)
        console.log(`[horarios-disponibles] OT encontrada: ${ot.patente} - Horario deseado: ${horarioDeseadoStr}`)
      }

      rangosOcupados.push({
        inicio: inicioOT,
        fin: finOT,
        ot: {
          id: ot.id,
          patente: ot.patente,
          cliente: ot.nombreCliente || 'Sin nombre',
        },
      })
    }

    console.log(`[horarios-disponibles] Rangos ocupados:`, JSON.stringify(rangosOcupados.map(r => {
      const inicioNormalizado = new Date(fechaInicio)
      inicioNormalizado.setHours(r.inicio.getHours(), r.inicio.getMinutes(), 0, 0)
      const finNormalizado = new Date(r.fin)
      return {
        patente: r.ot.patente,
        cliente: r.ot.cliente,
        inicio: r.inicio.toTimeString().slice(0, 5),
        fin: r.fin.toTimeString().slice(0, 5),
        inicioNormalizado: inicioNormalizado.toTimeString().slice(0, 5),
        finNormalizado: finNormalizado.toTimeString().slice(0, 5),
        inicioMinutos: inicioNormalizado.getHours() * 60 + inicioNormalizado.getMinutes(),
        finMinutos: finNormalizado.getHours() * 60 + finNormalizado.getMinutes(),
      }
    }), null, 2))

    // Generar bloques de 15 minutos
    // Verificar si estamos consultando el día de hoy
    // IMPORTANTE: Usar hora local del servidor (no UTC) para comparar con la hora del negocio
    const ahora = new Date()
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    hoy.setMinutes(0, 0)
    hoy.setSeconds(0, 0)
    hoy.setMilliseconds(0)
    
    // Comparar fechas normalizadas (solo año, mes, día en hora local)
    const fechaInicioNormalizada = new Date(fechaInicio)
    fechaInicioNormalizada.setHours(0, 0, 0, 0)
    fechaInicioNormalizada.setMinutes(0, 0)
    fechaInicioNormalizada.setSeconds(0, 0)
    fechaInicioNormalizada.setMilliseconds(0)
    
    const esHoy = fechaInicioNormalizada.getTime() === hoy.getTime()
    
    // Calcular minutos desde medianoche para comparaciones simples
    const minutosAhora = esHoy ? ahora.getHours() * 60 + ahora.getMinutes() : -1
    
    console.log(`[horarios-disponibles] ===== INICIO PROCESAMIENTO =====`)
    console.log(`[horarios-disponibles] Hora del servidor (ahora): ${ahora.toISOString()} (${ahora.toLocaleString('es-AR')})`)
    console.log(`[horarios-disponibles] Fecha consulta: ${fechaInicioNormalizada.toISOString().split('T')[0]} (${fechaInicioNormalizada.toLocaleDateString('es-AR')})`)
    console.log(`[horarios-disponibles] Hoy: ${hoy.toISOString().split('T')[0]} (${hoy.toLocaleDateString('es-AR')})`)
    console.log(`[horarios-disponibles] Es hoy: ${esHoy}`)
    console.log(`[horarios-disponibles] Minutos ahora (local): ${minutosAhora} (${Math.floor(minutosAhora/60)}:${String(minutosAhora%60).padStart(2, '0')})`)
    console.log(`[horarios-disponibles] Duración servicio: ${duracionTotal} minutos`)
    console.log(`[horarios-disponibles] OTs activas encontradas: ${otsActivas.length}`)
    
    // Debug: contar cuántos bloques pasados hay
    let bloquesPasados = 0
    let bloquesFuturos = 0
    
    for (let hora = 8; hora < 22; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 15) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`
        const minutosBloque = hora * 60 + minuto

        // REGLA FUNDAMENTAL: Los horarios pasados siempre están ocupados
        // porque no se puede entregar un auto antes de que ingrese
        if (esHoy && minutosAhora >= 0) {
          // IMPORTANTE: Verificar que el bloque ya pasó comparando minutos
          // Un bloque está pasado si ya pasó su hora completa
          // Ejemplo: Si son las 19:17, el bloque 19:15 ya pasó (no disponible)
          // El bloque 19:30 aún no pasó (disponible si hay tiempo suficiente)
          
          // Debug para los primeros bloques
          if (hora <= 10 || (hora === 14 && minuto <= 30)) {
            console.log(`[horarios-disponibles] DEBUG bloque ${horaStr}: minutosBloque=${minutosBloque}, minutosAhora=${minutosAhora}, pasado=${minutosBloque < minutosAhora}`)
          }
          
          if (minutosBloque < minutosAhora) {
            bloquesPasados++
            bloques.push({
              hora: horaStr,
              disponible: false,
              ocupadoPor: {
                patente: 'Horario pasado',
                cliente: 'Este horario ya pasó - No se puede entregar antes del ingreso',
                fin: `${Math.floor(minutosAhora / 60).toString().padStart(2, '0')}:${String(minutosAhora % 60).padStart(2, '0')}`,
              },
            })
            continue
          } else {
            bloquesFuturos++
          }
          
          // Si hay servicio seleccionado, verificar tiempo suficiente
          // Necesitamos tiempo suficiente para completar el servicio antes del horario deseado
          if (servicioId) {
            // Calcular cuándo necesitaríamos empezar para terminar a este horario
            const minutosInicioNecesario = minutosBloque - duracionTotal
            
            // Si no hay tiempo suficiente (el inicio necesario ya pasó)
            // Ejemplo: Si son las 19:17 y queremos terminar a las 19:30 con un servicio de 30 min
            // Necesitaríamos empezar a las 19:00, pero ya pasó → No disponible
            if (minutosInicioNecesario < minutosAhora) {
              bloques.push({
                hora: horaStr,
                disponible: false,
                ocupadoPor: {
                  patente: 'Tiempo insuficiente',
                  cliente: `No hay tiempo suficiente para completar (${duracionTotal} min) antes de ${horaStr}`,
                  fin: `${Math.floor(minutosAhora / 60).toString().padStart(2, '0')}:${String(minutosAhora % 60).padStart(2, '0')}`,
                },
              })
              continue
            }
          }
        } else {
          // Si no es hoy, todos los bloques son futuros
          bloquesFuturos++
        }

        // Por defecto, el bloque está disponible (ya pasamos las validaciones de tiempo)
        let disponible = true
        let ocupadoPor: any = undefined
        
        // Verificar conflictos con OTs existentes
        // REGLA: Marcamos ocupado solo si el horario deseado de una OT coincide exactamente
        // minutosBloque ya está calculado arriba (hora * 60 + minuto)
        
        if (rangosOcupados.length > 0) {
          for (const rango of rangosOcupados) {
            // rango.fin ya está normalizado al día de consulta (es el horario deseado de la OT existente)
            // Extraer directamente los minutos del rango.fin que ya está normalizado
            const rangoFinMinutos = rango.fin.getHours() * 60 + rango.fin.getMinutes()
            
            // SOLO CASO: Coincidencia exacta del horario deseado
            // Si una OT tiene horario deseado a las 20:30, ese bloque (20:30) está ocupado
            // Si una OT tiene horario deseado a las 21:15, ese bloque (21:15) está ocupado
            if (minutosBloque === rangoFinMinutos) {
              disponible = false
              ocupadoPor = {
                patente: rango.ot.patente,
                cliente: rango.ot.cliente,
                fin: rango.fin.toTimeString().slice(0, 5),
              }
              console.log(`[horarios-disponibles] ⛔ BLOQUE OCUPADO: ${horaStr} (${minutosBloque} min) coincide con horario deseado de OT ${rango.ot.patente} (${rangoFinMinutos} min)`)
              break
            }
          }
        }

        // Marcar el bloque (por defecto está disponible a menos que haya conflicto)
        bloques.push({
          hora: horaStr,
          disponible,
          ocupadoPor,
        })
      }
    }
    
    // Debug: mostrar algunos bloques
    const ejemplos = bloques.slice(0, 10).map(b => `${b.hora}: ${b.disponible ? 'DISP' : 'OCUP'}`).join(', ')
    console.log(`[horarios-disponibles] Primeros bloques: ${ejemplos}`)

    const disponibles = bloques.filter(b => b.disponible).length
    const ocupados = bloques.filter(b => !b.disponible).length
    const ocupadosPorOT = bloques.filter(b => b.ocupadoPor && b.ocupadoPor.patente !== 'Horario pasado' && b.ocupadoPor.patente !== 'Tiempo insuficiente').length
    const pasados = bloques.filter(b => b.ocupadoPor && (b.ocupadoPor.patente === 'Horario pasado' || b.ocupadoPor.patente === 'Tiempo insuficiente')).length
    
    console.log(`[horarios-disponibles] ===== RESUMEN =====`)
    console.log(`[horarios-disponibles] Total bloques: ${bloques.length}`)
    console.log(`[horarios-disponibles] Disponibles: ${disponibles}`)
    console.log(`[horarios-disponibles] Ocupados: ${ocupados}`)
    console.log(`[horarios-disponibles]   - Por OTs: ${ocupadosPorOT}`)
    console.log(`[horarios-disponibles]   - Pasados/Insuficientes: ${pasados}`)
    console.log(`[horarios-disponibles] Es hoy: ${esHoy}, Minutos ahora: ${minutosAhora} (${Math.floor(minutosAhora/60)}:${String(minutosAhora%60).padStart(2, '0')})`)
    console.log(`[horarios-disponibles] Bloques pasados detectados: ${bloquesPasados}, Bloques futuros: ${bloquesFuturos}`)
    console.log(`[horarios-disponibles] Rangos ocupados: ${rangosOcupados.length}`)
    console.log(`[horarios-disponibles] Servicio ID: ${servicioId || 'NINGUNO'}`)
    console.log(`[horarios-disponibles] Duración total: ${duracionTotal} minutos`)
    
    // Debug: mostrar algunos ejemplos de bloques
    const ejemplosPasados = bloques.filter(b => b.ocupadoPor?.patente === 'Horario pasado').slice(0, 3).map(b => b.hora).join(', ')
    const ejemplosDisponibles = bloques.filter(b => b.disponible).slice(0, 3).map(b => b.hora).join(', ')
    console.log(`[horarios-disponibles] Ejemplos pasados: ${ejemplosPasados || 'ninguno'}`)
    console.log(`[horarios-disponibles] Ejemplos disponibles: ${ejemplosDisponibles || 'ninguno'}`)

    return NextResponse.json({
      fecha: fechaInicio.toISOString().split('T')[0],
      bloques,
      duracionEstimada: duracionTotal,
    })
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error)
    return NextResponse.json(
      { error: 'Error al obtener horarios disponibles' },
      { status: 500 }
    )
  }
}

