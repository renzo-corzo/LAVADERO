/**
 * Modo Kiosco - Interfaz Ultra-Simplificada para Operación
 * Para ENCARGADO / DUEÑO que opera (puede o no ser lavador).
 * Diseñada para tablets/móviles con botones grandes y táctiles.
 * Solo acciones esenciales: Empezar y Terminar
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatTime, getTimeElapsed } from '@/lib/utils'
import type { OrdenTrabajo } from '@/types'

interface OTKiosco {
  id: string
  patente: string
  nombreCliente?: string
  servicio: {
    nombre: string
  }
  estado: string
  precio: number
  fechaIngreso: Date
  horarioDeseado?: Date
}

export default function KioscoPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [ots, setOTs] = useState<OTKiosco[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  // Redirigir si no puede usar Kiosco (ENCARGADO / DUEÑO)
  useEffect(() => {
    const puedeKiosco = session?.user?.role === 'ENCARGADO' || session?.user?.role === 'DUENO' || session?.user?.role === 'ADMIN'
    if (session?.user && !puedeKiosco) {
      router.replace('/tablero')
    }
  }, [session, router])

  // Cargar OTs del día
  const cargarOTs = useCallback(async () => {
    try {
      setLoading(true)
      const hoy = new Date()
      const year = hoy.getFullYear()
      const month = String(hoy.getMonth() + 1).padStart(2, '0')
      const day = String(hoy.getDate()).padStart(2, '0')
      const fechaStr = `${year}-${month}-${day}`

      const response = await fetch(`/api/ots?fecha=${fechaStr}`, {
        cache: 'no-store',
      })

      if (response.ok) {
        const data: OrdenTrabajo[] = await response.json()
        // Filtrar solo OTs en EN_COLA o EN_PROCESO
        const otsFiltradas = data
          .filter((ot) => ot.estado === 'EN_COLA' || ot.estado === 'EN_PROCESO')
          .map((ot) => ({
            id: ot.id,
            patente: ot.patente,
            nombreCliente: ot.nombreCliente,
            servicio: ot.servicio,
            estado: ot.estado,
            precio: ot.precio || ot.total,
            fechaIngreso: new Date(ot.fechaIngreso),
            horarioDeseado: ot.horarioDeseado ? new Date(ot.horarioDeseado) : undefined,
          }))
          .sort((a, b) => {
            // Ordenar: EN_COLA primero, luego por horario deseado
            if (a.estado !== b.estado) {
              return a.estado === 'EN_COLA' ? -1 : 1
            }
            if (a.horarioDeseado && b.horarioDeseado) {
              return a.horarioDeseado.getTime() - b.horarioDeseado.getTime()
            }
            return a.fechaIngreso.getTime() - b.fechaIngreso.getTime()
          })

        setOTs(otsFiltradas)
      }
    } catch (error) {
      console.error('Error al cargar OTs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarOTs()
    // Auto-refresh cada 10 segundos
    const interval = setInterval(cargarOTs, 10000)
    return () => clearInterval(interval)
  }, [cargarOTs])

  // Cambiar estado de OT
  const cambiarEstado = async (otId: string, nuevoEstado: string) => {
    if (procesando) return

    try {
      setProcesando(otId)
      const response = await fetch(`/api/ots/${otId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado }),
      })

      if (response.ok) {
        // Recargar OTs después de un breve delay para animación
        setTimeout(() => {
          cargarOTs()
          setProcesando(null)
        }, 500)
      } else {
        const data = await response.json()
        toast.error(data.error || 'No se pudo cambiar el estado')
        setProcesando(null)
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado')
      setProcesando(null)
    }
  }

  // Si no puede usar Kiosco, no mostrar nada (se redirige)
  const puedeKiosco = session?.user?.role === 'ENCARGADO' || session?.user?.role === 'DUENO' || session?.user?.role === 'ADMIN'
  if (session?.user && !puedeKiosco) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Cargando trabajos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl">🖥️</span>
          <h1 className="text-4xl font-bold text-gray-900">Modo Kiosco</h1>
        </div>
        <p className="text-lg text-gray-600 mb-1">
          {ots.length === 0
            ? 'No hay trabajos pendientes'
            : `${ots.length} trabajo${ots.length > 1 ? 's' : ''} pendiente${ots.length > 1 ? 's' : ''}`}
        </p>
        <p className="text-sm text-gray-500">Actualización automática cada 10 segundos</p>
      </div>

      {/* Lista de OTs */}
      <div className="max-w-4xl mx-auto space-y-4">
        <AnimatePresence mode="popLayout">
          {ots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="text-8xl mb-4">✅</div>
              <p className="text-2xl text-gray-600 font-medium">
                ¡Todo al día!
              </p>
              <p className="text-gray-500 mt-2">
                No hay trabajos pendientes en este momento
              </p>
            </motion.div>
          ) : (
            ots.map((ot, index) => (
              <motion.div
                key={ot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Información de la OT */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-5xl font-bold text-gray-900">
                        {ot.patente}
                      </div>
                      {ot.estado === 'EN_COLA' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          En Cola
                        </span>
                      )}
                      {ot.estado === 'EN_PROCESO' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          En Proceso
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xl font-semibold text-gray-700">
                        {ot.servicio.nombre}
                      </div>
                      {ot.nombreCliente && (
                        <div className="text-lg text-gray-600">
                          👤 {ot.nombreCliente}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(ot.precio)}
                      </div>
                      {ot.horarioDeseado && (
                        <div className="text-sm text-gray-500">
                          ⏰ Deseado: {formatTime(ot.horarioDeseado)}
                        </div>
                      )}
                      {ot.estado === 'EN_PROCESO' && (
                        <div className="text-sm text-gray-500">
                          ⏱️ {getTimeElapsed(ot.fechaIngreso)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex flex-col gap-3 min-w-[220px] md:min-w-[250px]">
                    {ot.estado === 'EN_COLA' && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          className="h-24 w-full text-2xl font-bold shadow-xl hover:shadow-2xl"
                          onClick={() => cambiarEstado(ot.id, 'EN_PROCESO')}
                          disabled={procesando === ot.id}
                        >
                          {procesando === ot.id ? (
                            <span className="flex flex-col items-center gap-2">
                              <span className="animate-spin text-4xl">⏳</span>
                              <span>Procesando...</span>
                            </span>
                          ) : (
                            <span className="flex flex-col items-center gap-2">
                              <span className="text-5xl">▶️</span>
                              <span>Empezar</span>
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {ot.estado === 'EN_PROCESO' && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          className="h-24 w-full text-2xl font-bold bg-green-600 hover:bg-green-700 shadow-xl hover:shadow-2xl"
                          onClick={() => cambiarEstado(ot.id, 'LISTO')}
                          disabled={procesando === ot.id}
                        >
                          {procesando === ot.id ? (
                            <span className="flex flex-col items-center gap-2">
                              <span className="animate-spin text-4xl">⏳</span>
                              <span>Procesando...</span>
                            </span>
                          ) : (
                            <span className="flex flex-col items-center gap-2">
                              <span className="text-5xl">✅</span>
                              <span>Terminar</span>
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Botón para volver al tablero */}
      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          onClick={() => router.push('/tablero')}
          className="text-gray-600"
        >
          ← Volver al Tablero
        </Button>
      </div>
    </div>
  )
}
