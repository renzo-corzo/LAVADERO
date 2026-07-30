/**
 * Hook: disponibilidad y grilla de horarios para crear una OT.
 *
 * Encapsula dos cosas que antes vivían dentro de la página Nueva OT:
 *  1. La grilla de horarios del día (se recarga al cambiar servicio/extras/sucursal).
 *  2. La validación del horario deseado (con debounce) contra el backend.
 *
 * Preserva los mismos disparadores que la versión original: los valores que se
 * "leen pero no disparan" (horario elegido, cliente, sucursal para validar) van
 * por refs, para no cambiar cuándo se ejecutan los efectos.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface BloqueHorario {
  hora: string
  disponible: boolean
  ocupadoPor?: { patente: string; cliente: string; fin: string }
}

export interface HorariosDelDia {
  fecha?: string
  bloques: BloqueHorario[]
}

export interface Disponibilidad {
  disponible: boolean
  conflicto?: string
  horariosDisponibles?: string[]
}

interface Params {
  servicioId: string
  extrasIds: string[]
  horarioDeseado: string
  sucursalId: string
  /** Cliente con trabajo externo: no ocupa turnos, no se valida horario. */
  clienteTrabajoExterno: boolean
  /** Cliente fijo para validar (o null). */
  clienteId: string | null
  /** Se llama para autoseleccionar el primer horario libre si no hay uno elegido. */
  onAutoSelectHorario: (hora: string) => void
}

export function useDisponibilidadHorarios({
  servicioId,
  extrasIds,
  horarioDeseado,
  sucursalId,
  clienteTrabajoExterno,
  clienteId,
  onAutoSelectHorario,
}: Params) {
  const [horariosDelDia, setHorariosDelDia] = useState<HorariosDelDia | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [validandoHorario, setValidandoHorario] = useState(false)

  // Valores que se leen dentro de los efectos pero no deben dispararlos.
  const onAutoSelectRef = useRef(onAutoSelectHorario)
  onAutoSelectRef.current = onAutoSelectHorario
  const horarioDeseadoRef = useRef(horarioDeseado)
  horarioDeseadoRef.current = horarioDeseado
  const clienteExternoRef = useRef(clienteTrabajoExterno)
  clienteExternoRef.current = clienteTrabajoExterno
  const clienteIdRef = useRef(clienteId)
  clienteIdRef.current = clienteId
  const sucursalIdRef = useRef(sucursalId)
  sucursalIdRef.current = sucursalId

  const extrasKey = extrasIds.join(',')

  // 1) Grilla de horarios del día — al cambiar servicio, extras o sucursal.
  useEffect(() => {
    if (!servicioId || clienteExternoRef.current) {
      setHorariosDelDia(null)
      return
    }
    let cancelado = false
    const cargar = async () => {
      try {
        const ahora = new Date()
        const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
        // Hora local del cliente (evita desfasajes de zona horaria en el server)
        const horaLocalCliente = {
          año: ahora.getFullYear(),
          mes: ahora.getMonth(),
          dia: ahora.getDate(),
          hora: ahora.getHours(),
          minuto: ahora.getMinutes(),
          segundo: ahora.getSeconds(),
          iso: ahora.toISOString(),
        }
        const qs = new URLSearchParams({
          fecha: fechaHoy,
          servicioId,
          extrasIds: extrasKey,
          horaActual: JSON.stringify(horaLocalCliente),
          ...(sucursalId ? { sucursalId } : {}),
        })
        const res = await fetch(`/api/ots/horarios-disponibles?${qs}`)
        if (cancelado) return
        if (res.ok) {
          const data = await res.json()
          setHorariosDelDia({ ...data, fecha: fechaHoy })
          // Autoseleccionar el primer horario libre si no hay uno elegido
          if (!horarioDeseadoRef.current && data.bloques?.some((b: BloqueHorario) => b.disponible)) {
            const primero = data.bloques.find((b: BloqueHorario) => b.disponible)
            if (primero) onAutoSelectRef.current(primero.hora)
          }
        } else {
          const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
          setHorariosDelDia(null)
          toast.error(`Error al cargar horarios: ${err.error || 'Error desconocido'}`)
        }
      } catch {
        if (!cancelado) {
          setHorariosDelDia(null)
          toast.error('Error al cargar horarios disponibles. Por favor, recargá la página.')
        }
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId, extrasKey, sucursalId])

  // 2) Validación del horario deseado (debounce) — al cambiar servicio, extras u horario.
  useEffect(() => {
    if (!servicioId || !horarioDeseado || clienteExternoRef.current) {
      setDisponibilidad(null)
      return
    }
    const timeout = setTimeout(async () => {
      try {
        setValidandoHorario(true)
        const hoy = new Date()
        const [horas, minutos] = horarioDeseado.split(':')
        hoy.setHours(parseInt(horas), parseInt(minutos), 0, 0)
        const res = await fetch('/api/ots/disponibilidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            servicioId,
            extrasIds,
            horarioDeseado: hoy.toISOString(),
            fechaIngreso: new Date().toISOString(),
            clienteId: clienteIdRef.current,
            sucursalId: sucursalIdRef.current || null,
          }),
        })
        if (res.ok) setDisponibilidad(await res.json())
      } catch (error) {
        console.error('Error al validar disponibilidad:', error)
      } finally {
        setValidandoHorario(false)
      }
    }, 500)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId, extrasKey, horarioDeseado])

  return { horariosDelDia, disponibilidad, validandoHorario }
}
