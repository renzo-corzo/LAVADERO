/**
 * API Route: Horarios Disponibles del Día
 * GET: Obtener todos los horarios disponibles y ocupados del día en formato de grilla
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'

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

    // Scoping multi-tenant: la ocupación de horarios se calcula por empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const fecha = searchParams.get('fecha') // formato: YYYY-MM-DD o ISO string
    const servicioId = searchParams.get('servicioId')
    const extrasIds = searchParams.get('extrasIds')?.split(',') || []
    const excludeOTId = searchParams.get('excludeOTId')
    // Capacidad por sucursal: usuarios con sucursal usan la suya; DUEÑO/ADMIN
    // envían la elegida por query. Sin sucursal resoluble no se filtra (compat).
    const sucursalId =
      session.user.sucursalId || searchParams.get('sucursalId')?.trim() || null
    
    // IMPORTANTE: Obtener hora actual del cliente desde query params
    // El cliente envía un objeto JSON con componentes locales (año, mes, dia, hora, minuto)
    // Esto evita problemas de zona horaria entre cliente y servidor
    const clienteHoraActualRaw = searchParams.get('horaActual') // JSON string opcional
    
    console.log(`[horarios-disponibles] Parámetros recibidos:`, {
      fecha,
      servicioId,
      extrasIds: extrasIds.join(','),
      horaActualClienteRaw: clienteHoraActualRaw || 'NO ENVIADA'
    })
    
    type ClienteHoraActual = {
      año: number
      mes: number
      dia: number
      hora: number
      minuto: number
      segundo: number
      iso: string
    }
    
    let clienteHoraActual: ClienteHoraActual | null = null
    
    if (clienteHoraActualRaw) {
      try {
        const parsed = JSON.parse(clienteHoraActualRaw) as ClienteHoraActual
        // Validar que tenga las propiedades necesarias
        if (parsed && typeof parsed.año === 'number' && typeof parsed.mes === 'number' && 
            typeof parsed.dia === 'number' && typeof parsed.hora === 'number' && 
            typeof parsed.minuto === 'number') {
          clienteHoraActual = parsed
        } else {
          console.error(`[horarios-disponibles] ⚠️ horaActual del cliente no tiene el formato correcto:`, parsed)
        }
      } catch (e) {
        console.error(`[horarios-disponibles] ⚠️ Error parseando horaActual del cliente:`, e)
      }
    }

    if (!fecha) {
      return NextResponse.json(
        { error: 'La fecha es requerida' },
        { status: 400 }
      )
    }

    // Parsear fecha correctamente (puede venir como YYYY-MM-DD o ISO string)
    // IMPORTANTE: Parsear fecha como hora local, no UTC
    // Ejemplo: '2026-01-07' debe interpretarse como 2026-01-07 00:00:00 en hora local
    const fechaStr = fecha.split('T')[0] // Asegurar formato YYYY-MM-DD (ej: '2026-01-07')
    const [año, mes, dia] = fechaStr.split('-').map(Number)
    
    // Crear fecha en hora local (no UTC)
    const fechaInicio = new Date(año, mes - 1, dia, 0, 0, 0, 0)
    
    console.log(`[horarios-disponibles] Fecha parseada: ${fechaStr} -> ${fechaInicio.toISOString()} (local: ${fechaInicio.toLocaleString('es-AR')})`)
    
    // Crear fecha fin en hora local
    const fechaFin = new Date(año, mes - 1, dia, 23, 59, 59, 999)
    
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
      esExterna: false,
      estado: {
        in: ['EN_COLA', 'EN_PROCESO', 'LISTO'],
      },
      ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      ...(sucursalId ? { sucursalId } : {}),
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
    // IMPORTANTE: El cliente envía su hora LOCAL como objeto JSON (año, mes, dia, hora, minuto)
    // Esto permite validar horarios pasados usando la hora que el cliente ve, no UTC
    // El negocio opera en hora local de Argentina (UTC-3), no en UTC del servidor
    let ahora: Date
    let minutosAhoraCliente = -1
    let fechaHoyCliente: Date | null = null
    
    if (clienteHoraActual) {
      // El cliente envió componentes locales directamente, usarlos sin conversión
      // IMPORTANTE: Usar los valores que el cliente envió directamente
      // TypeScript ya valida que clienteHoraActual no es null aquí
      const añoCliente = clienteHoraActual.año
      const mesCliente = clienteHoraActual.mes // Ya viene como 0-11 (índice de mes)
      const diaCliente = clienteHoraActual.dia
      const horaCliente = clienteHoraActual.hora
      const minutoCliente = clienteHoraActual.minuto
      
      // Crear fecha usando los componentes locales del cliente
      // NOTA: new Date(año, mes, dia, hora, minuto) crea una fecha en hora LOCAL del servidor
      // pero usamos los valores que el cliente envió, que son su hora local
      fechaHoyCliente = new Date(añoCliente, mesCliente, diaCliente, 0, 0, 0, 0)
      ahora = new Date(añoCliente, mesCliente, diaCliente, horaCliente, minutoCliente, 0, 0)
      
      // Calcular minutos desde medianoche usando valores del cliente directamente
      minutosAhoraCliente = horaCliente * 60 + minutoCliente
      
      console.log(`[horarios-disponibles] ✅ Usando hora LOCAL del cliente:`, {
        fecha: `${diaCliente}/${mesCliente + 1}/${añoCliente}`,
        hora: `${horaCliente.toString().padStart(2, '0')}:${minutoCliente.toString().padStart(2, '0')}`,
        minutosDesdeMedianoche: minutosAhoraCliente,
        isoCliente: clienteHoraActual.iso, // Solo para referencia
        isoServidor: ahora.toISOString() // Para comparación
      })
    } else {
      // Usar hora local del servidor como fallback
      ahora = new Date()
      console.log(`[horarios-disponibles] ⚠️ Usando hora del servidor (fallback): ${ahora.toISOString()} (${ahora.toLocaleString('es-AR')})`)
    }
    
    // Normalizar fecha de hoy usando la misma hora de referencia
    const hoy = fechaHoyCliente || new Date(ahora)
    hoy.setHours(0, 0, 0, 0)
    hoy.setMinutes(0, 0)
    hoy.setSeconds(0, 0)
    hoy.setMilliseconds(0)
    
    // Comparar fechas normalizadas (solo año, mes, día)
    const fechaInicioNormalizada = new Date(fechaInicio)
    fechaInicioNormalizada.setHours(0, 0, 0, 0)
    fechaInicioNormalizada.setMinutes(0, 0)
    fechaInicioNormalizada.setSeconds(0, 0)
    fechaInicioNormalizada.setMilliseconds(0)
    
    const esHoy = fechaInicioNormalizada.getTime() === hoy.getTime()
    
    // Usar minutos del cliente si es hoy, sino -1
    const minutosAhora = esHoy && minutosAhoraCliente >= 0 ? minutosAhoraCliente : (esHoy ? ahora.getHours() * 60 + ahora.getMinutes() : -1)
    
    console.log(`[horarios-disponibles] ===== INICIO PROCESAMIENTO =====`)
    console.log(`[horarios-disponibles] HoraActual recibida del cliente: ${clienteHoraActual ? JSON.stringify(clienteHoraActual) : 'NO ENVIADA'}`)
    console.log(`[horarios-disponibles] Hora usada para validación: ${ahora.toISOString()} (${ahora.toLocaleString('es-AR')})`)
    console.log(`[horarios-disponibles] Fecha consulta: ${fechaInicioNormalizada.toISOString().split('T')[0]} (${fechaInicioNormalizada.toLocaleDateString('es-AR')})`)
    console.log(`[horarios-disponibles] Hoy (según hora usada): ${hoy.toISOString().split('T')[0]} (${hoy.toLocaleDateString('es-AR')})`)
    console.log(`[horarios-disponibles] Es hoy: ${esHoy}`)
    console.log(`[horarios-disponibles] Minutos ahora: ${minutosAhora} (${minutosAhora >= 0 ? `${Math.floor(minutosAhora/60).toString().padStart(2, '0')}:${String(minutosAhora%60).padStart(2, '0')}` : 'N/A'})`)
    console.log(`[horarios-disponibles] Duración servicio: ${duracionTotal} minutos`)
    console.log(`[horarios-disponibles] OTs activas encontradas: ${otsActivas.length}`)
    
    // Debug: contar cuántos bloques pasados hay
    let bloquesPasados = 0
    let bloquesFuturos = 0
    
    for (let hora = 8; hora < 22; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 15) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`
        const minutosBloque = hora * 60 + minuto

        // REGLA 1: Los horarios pasados siempre están ocupados/no disponibles
        // porque no se puede entregar un auto antes de que ingrese
        let disponible = true
        let ocupadoPor: any = undefined
        
        if (esHoy && minutosAhora >= 0) {
          // REGLA 1.1: Si el bloque ya pasó (minutosBloque < minutosAhora) → NO DISPONIBLE
          if (minutosBloque < minutosAhora) {
            if (bloquesPasados < 3) {
              console.log(`[horarios-disponibles] ⏰ BLOQUE PASADO: ${horaStr} (${minutosBloque} min) < ahora (${minutosAhora} min)`)
            }
            bloquesPasados++
            disponible = false
            ocupadoPor = {
              patente: 'Horario pasado',
              cliente: 'Este horario ya pasó - No se puede entregar antes del ingreso',
              fin: `${Math.floor(minutosAhora / 60).toString().padStart(2, '0')}:${String(minutosAhora % 60).padStart(2, '0')}`,
            }
          } 
          // REGLA 1.2: Si el bloque está dentro de los próximos 30 minutos → NO DISPONIBLE
          // (Necesitamos al menos 30 minutos de anticipación)
          else if (minutosBloque - minutosAhora < 30) {
            bloquesPasados++
            disponible = false
            ocupadoPor = {
              patente: 'Tiempo insuficiente',
              cliente: `Se necesita al menos 30 minutos de anticipación. Tiempo disponible: ${minutosBloque - minutosAhora} min`,
              fin: `${Math.floor(minutosAhora / 60).toString().padStart(2, '0')}:${String(minutosAhora % 60).padStart(2, '0')}`,
            }
          }
          // REGLA 1.3: Si hay servicio seleccionado, verificar tiempo suficiente para completarlo
          else if (servicioId) {
            // Calcular cuándo necesitaríamos empezar para terminar a este horario
            const minutosInicioNecesario = minutosBloque - duracionTotal
            
            // Si no hay tiempo suficiente para completar el servicio (el inicio necesario ya pasó o es muy pronto)
            if (minutosInicioNecesario < minutosAhora || minutosBloque - minutosAhora < duracionTotal) {
              disponible = false
              ocupadoPor = {
                patente: 'Tiempo insuficiente',
                cliente: `No hay tiempo suficiente para completar el servicio (${duracionTotal} min) antes de ${horaStr}`,
                fin: `${Math.floor(minutosAhora / 60).toString().padStart(2, '0')}:${String(minutosAhora % 60).padStart(2, '0')}`,
              }
            } else {
              bloquesFuturos++
            }
          } else {
            bloquesFuturos++
          }
        } else {
          // Si no es hoy, todos los bloques son futuros (no hay validación de tiempo)
          bloquesFuturos++
        }
        
        // Si ya está marcado como no disponible por tiempo, agregarlo y continuar
        if (!disponible) {
          bloques.push({
            hora: horaStr,
            disponible: false,
            ocupadoPor,
          })
          continue
        }

        // REGLA 2: Verificar conflictos con OTs existentes
        // Si otro auto ya tiene un horario deseado en este mismo bloque → NO DISPONIBLE
        // minutosBloque ya está calculado arriba (hora * 60 + minuto)
        
        if (rangosOcupados.length > 0) {
          for (const rango of rangosOcupados) {
            // rango.fin ya está normalizado al día de consulta (es el horario deseado de la OT existente)
            // Extraer directamente los minutos del rango.fin que ya está normalizado
            const rangoFinMinutos = rango.fin.getHours() * 60 + rango.fin.getMinutes()
            
            // REGLA 2.1: Coincidencia exacta del horario deseado
            // Si una OT tiene horario deseado a las 20:30, ese bloque (20:30) está ocupado
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

