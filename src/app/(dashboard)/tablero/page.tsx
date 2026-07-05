/**
 * Página del Tablero Operativo (Vista Kanban)
 * US-005: Tablero Operativo
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime, formatHorarioDeseado, getTimeElapsed } from '@/lib/utils'
import { MenuMovil } from '@/components/tablero/MenuMovil'
import type { OrdenTrabajo } from '@/types'

interface OTsPorEstado {
  EN_COLA: OrdenTrabajo[]
  EN_PROCESO: OrdenTrabajo[]
  LISTO: OrdenTrabajo[]
  ENTREGADO: OrdenTrabajo[]
}

export default function TableroPage() {
  // ========== TODOS LOS HOOKS PRIMERO ==========
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const confirm = useConfirm()
  const [mounted, setMounted] = useState(false) // Para evitar problemas de hidratación
  const [esMovil, setEsMovil] = useState(false)
  const [mostrarKanban, setMostrarKanban] = useState(false)
  const queryClient = useQueryClient()
  const [mostrarExternas, setMostrarExternas] = useState(false)
  const [seleccionadasIds, setSeleccionadasIds] = useState<string[]>([])
  const [estadoLote, setEstadoLote] = useState<'EN_PROCESO' | 'LISTO' | 'ENTREGADO'>('LISTO')
  const [aplicandoLote, setAplicandoLote] = useState(false)
  const [filtroFecha, setFiltroFecha] = useState<string>(() => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // ========== TODOS LOS USE EFFECT ==========
  // Marcar como montado después de la hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detectar si es móvil DESPUÉS de la hidratación
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setEsMovil(isMobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mounted])

  // Si viene el parámetro kanban, mostrar el kanban directamente
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const kanbanParam = searchParams.get('kanban')
    const isDesktop = window.innerWidth >= 1024
    
    if (kanbanParam === 'true') {
      setMostrarKanban(true)
    } else if (isDesktop) {
      // En desktop, siempre mostrar kanban
      setMostrarKanban(true)
    } else {
      // En móvil, sin parámetro kanban, mostrar menú (kanban = false)
      setMostrarKanban(false)
    }
  }, [mounted, searchParams])

  // Fetch de OTs con React Query: caché + auto-refresh cada 15s.
  // Solo habilitado tras montar y cuando el kanban está visible (en móvil se
  // muestra el menú, no el tablero).
  const consultaHabilitada = mounted && (!esMovil || mostrarKanban)

  const {
    data: listaOTs,
    error,
    isFetching,
    refetch,
  } = useQuery<OrdenTrabajo[], Error & { status?: number }>({
    queryKey: ['ots', { fecha: filtroFecha, externas: mostrarExternas }],
    enabled: consultaHabilitada,
    refetchInterval: consultaHabilitada ? 15_000 : false,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroFecha) params.append('fecha', filtroFecha)
      if (mostrarExternas) params.append('incluirExternas', 'true')

      const response = await fetch(`/api/ots?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        const err = new Error('Error al cargar OTs') as Error & { status?: number }
        err.status = response.status
        throw err
      }
      return (await response.json()) as OrdenTrabajo[]
    },
  })

  // Agrupar las OTs por estado para el kanban (memoizado sobre los datos crudos)
  const ots = useMemo<OTsPorEstado>(() => {
    const agrupadas: OTsPorEstado = { EN_COLA: [], EN_PROCESO: [], LISTO: [], ENTREGADO: [] }
    for (const ot of listaOTs ?? []) {
      if (agrupadas[ot.estado as keyof OTsPorEstado]) {
        agrupadas[ot.estado as keyof OTsPorEstado].push(ot)
      }
    }
    return agrupadas
  }, [listaOTs])

  const loading = consultaHabilitada && !listaOTs && !error
  const errorCarga = error
    ? error.status === 403
      ? 'No tenés permisos para ver el tablero.'
      : error.status
        ? 'No se pudieron cargar las órdenes de trabajo. Reintentá.'
        : 'Error de conexión al cargar el tablero. Verificá tu red y reintentá.'
    : null

  // Mantener seleccionadas solo las OTs que siguen visibles tras cada recarga
  useEffect(() => {
    if (!listaOTs) return
    const idsVisibles = new Set(listaOTs.map((ot) => ot.id))
    setSeleccionadasIds((prev) => prev.filter((id) => idsVisibles.has(id)))
  }, [listaOTs])

  // Recargar si viene el parámetro recargar en la URL
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('recargar') === 'true') {
      refetch()
      window.history.replaceState({}, '', '/tablero')
    }
  }, [mounted, refetch])

  // ========== FUNCIONES DESPUÉS DE TODOS LOS HOOKS ==========
  const handleCambiarEstado = async (otId: string, nuevoEstado: string) => {
    const ok = await confirm({
      title: 'Cambiar estado',
      description: `La OT pasará a "${nuevoEstado}".`,
      confirmText: 'Cambiar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/ots/${otId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevoEstado,
          motivo: nuevoEstado === 'CANCELADO' ? 'Cancelación desde tablero' : null,
        }),
      })

      if (response.ok) {
        if (nuevoEstado === 'ENTREGADO') {
          const quierePagar = await confirm({
            title: 'Registrar pago',
            description: '¿Querés registrar el pago ahora?',
            confirmText: 'Registrar pago',
          })
          if (quierePagar) {
            router.push(`/caja/cobrar/${otId}`)
            return
          }
        }
        queryClient.invalidateQueries({ queryKey: ['ots'] })
      } else {
        const data = await response.json()
        toast.error(data.error || 'No se pudo cambiar el estado')
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado de la OT')
    }
  }

  const toggleSeleccion = (otId: string) => {
    setSeleccionadasIds((prev) => (prev.includes(otId) ? prev.filter((id) => id !== otId) : [...prev, otId]))
  }

  const limpiarSeleccion = () => setSeleccionadasIds([])

  const handleCambiarEstadoLote = async () => {
    if (seleccionadasIds.length === 0) return
    const ok = await confirm({
      title: 'Cambio de estado en lote',
      description: `Se cambiarán ${seleccionadasIds.length} OTs externas a "${estadoLote}".`,
      confirmText: 'Aplicar',
    })
    if (!ok) return

    try {
      setAplicandoLote(true)
      const response = await fetch('/api/ots/estado-lote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otIds: seleccionadasIds,
          nuevoEstado: estadoLote,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data?.error || 'No se pudo cambiar el estado en lote')
        return
      }

      const updatedCount = Number(data?.updatedCount || 0)
      const failedCount = Number(data?.failedCount || 0)

      if (failedCount > 0) {
        toast.warning(`${updatedCount} actualizadas`, {
          description: `${failedCount} no se pudieron actualizar (transición no permitida).`,
        })
      } else {
        toast.success(`${updatedCount} OTs actualizadas`)
      }

      limpiarSeleccion()
      queryClient.invalidateQueries({ queryKey: ['ots'] })
    } catch (error) {
      console.error('Error al cambiar estado en lote:', error)
      toast.error('Error al cambiar estado en lote')
    } finally {
      setAplicandoLote(false)
    }
  }

  const renderTarjetaOT = (ot: OrdenTrabajo, index: number) => (
    <motion.div
      key={ot.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm hover:shadow-lg transition-all cursor-pointer"
      onClick={() => router.push(`/tablero/${ot.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-xl sm:text-lg font-bold text-gray-900 mb-1">
            {ot.patente}
          </div>
          <div className="text-xs sm:text-xs text-gray-500">
            {ot.nombreCliente} • {formatDateTime(new Date(ot.fechaIngreso))}
          </div>
          {ot.horarioDeseado && (
            <div className="text-xs text-blue-600 mt-1">
              ⏰ {formatHorarioDeseado(new Date(ot.horarioDeseado), new Date(ot.fechaIngreso))}
            </div>
          )}
          {ot.esExterna && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                OT externa
              </span>
            </div>
          )}
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          {ot.esExterna && (
            <div className="flex items-center justify-end gap-2 mb-1">
              <label
                className="inline-flex items-center gap-2 text-xs text-gray-600 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={seleccionadasIds.includes(ot.id)}
                  onChange={() => toggleSeleccion(ot.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Seleccionar
              </label>
            </div>
          )}
          <div className="font-bold text-base sm:text-sm text-gray-900">{formatCurrency(ot.precio)}</div>
          {ot.estado === 'EN_PROCESO' && ot.fechaIngreso && (
            <div className="text-xs text-gray-500">
              {getTimeElapsed(new Date(ot.fechaIngreso))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-700 font-medium">{ot.servicio.nombre}</div>
        {ot.extras && ot.extras.length > 0 && (
          <div className="text-xs text-gray-500">
            +{ot.extras.length} extra{ot.extras.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        {ot.estado === 'EN_COLA' && (
          <Button
            type="button"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base sm:text-sm py-3 sm:py-2 min-h-[48px] sm:min-h-0"
            onClick={(e) => {
              e.stopPropagation()
              handleCambiarEstado(ot.id, 'EN_PROCESO')
            }}
          >
            En Proceso
          </Button>
        )}
        {ot.estado === 'EN_PROCESO' && (
          <Button
            type="button"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base sm:text-sm py-3 sm:py-2 min-h-[48px] sm:min-h-0"
            onClick={(e) => {
              e.stopPropagation()
              handleCambiarEstado(ot.id, 'LISTO')
            }}
          >
            Marcar Listo
          </Button>
        )}
        {ot.estado === 'LISTO' && (
          <Button
            type="button"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base sm:text-sm py-3 sm:py-2 min-h-[48px] sm:min-h-0"
            onClick={(e) => {
              e.stopPropagation()
              handleCambiarEstado(ot.id, 'ENTREGADO')
            }}
          >
            Entregar
          </Button>
        )}
        {ot.estado === 'ENTREGADO' && !ot.estaPagada && (
          <Button
            type="button"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base sm:text-sm py-3 sm:py-2 min-h-[48px] sm:min-h-0"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              router.push(`/caja/cobrar/${ot.id}`)
            }}
          >
            💰 Registrar Pago
          </Button>
        )}
        {ot.estado === 'ENTREGADO' && ot.estaPagada && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            ✓ Pagada
          </span>
        )}
      </div>
    </motion.div>
  )

  // ========== VARIABLES Y CÁLCULOS DESPUÉS DE FUNCIONES ==========
  // Preparar items del menú para pasar como prop (evita hooks en MenuMovil)
  // IMPORTANTE: Definir siempre el mismo array base para evitar problemas de hidratación
  const menuItemsBase = [
    {
      href: '/tablero?kanban=true',
      label: 'Tablero Kanban',
      icon: '📋',
      color: 'bg-green-500',
    },
    {
      href: '/ots/nueva',
      label: 'Nueva OT',
      icon: '➕',
      color: 'bg-purple-500',
    },
    {
      href: '/catalogos',
      label: 'Catálogos',
      icon: '📚',
      color: 'bg-orange-500',
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: '👥',
      color: 'bg-indigo-500',
    },
    {
      href: '/caja',
      label: 'Caja',
      icon: '💰',
      color: 'bg-yellow-500',
    },
    // Comisiones oculto (negocio con sueldo fijo). Ver Header.tsx.
    {
      href: '/reportes',
      label: 'Reportes',
      icon: '📈',
      color: 'bg-pink-500',
    },
  ]

  // Crear array final siempre con la misma estructura (evitar mutaciones condicionales)
  let itemsFiltrados = menuItemsBase

  // Modo Kiosco para ENCARGADO y DUEÑO (quien opera / puede ser lavador)
  if (session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO') {
    itemsFiltrados = [
      {
        href: '/kiosco',
        label: 'Modo Kiosco',
        icon: '🖥️',
        color: 'bg-blue-600',
      },
      ...menuItemsBase,
    ]
  }

  // Agregar Usuarios solo para DUENO
  if (session?.user.role === 'DUENO') {
    itemsFiltrados = [
      ...itemsFiltrados,
      {
        href: '/usuarios',
        label: 'Usuarios',
        icon: '👤',
        color: 'bg-gray-600',
      },
    ]
  }

  // ========== RETURNS CONDICIONALES AL FINAL ==========
  // Renderizar siempre ambos componentes y usar CSS para mostrar/ocultar
  // El menú móvil se oculta automáticamente cuando se muestra el kanban
  return (
    <>
      {/* Menú Principal Móvil - Componente separado, solo visible en móvil */}
      <MenuMovil items={itemsFiltrados} mostrarKanban={mostrarKanban} />

      {/* Tablero Kanban - Visible en desktop siempre, en móvil solo cuando mostrarKanban=true */}
      <div className={mostrarKanban ? 'block' : 'hidden lg:block'}>

        {/* Botón para volver al menú en móvil - solo cuando se muestra kanban */}
        {mostrarKanban && mounted && (
          <div className="mb-4 lg:hidden">
            <Button
              variant="secondary"
              onClick={() => {
                setMostrarKanban(false)
                router.push('/tablero')
              }}
            >
              ← Volver al Menú
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Cargando tablero...</p>
          </div>
        )}

        {!loading && errorCarga && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            <span>{errorCarga}</span>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {!loading && (
          <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tablero Operativo</h1>
          <p className="text-gray-600 mt-1">Gestiona las órdenes de trabajo del día</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Cargando...' : '🔄 Recargar'}
          </Button>
          {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO') && (
            <Link href="/ots/nueva">
              <Button variant="primary">+ Nueva OT</Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO') && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={mostrarExternas}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setMostrarExternas(checked)
                    if (!checked) {
                      setSeleccionadasIds([])
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Mostrar OTs externas (trabajo en planta)
              </label>
            </div>
          )}
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                const hoy = new Date()
                const year = hoy.getFullYear()
                const month = String(hoy.getMonth() + 1).padStart(2, '0')
                const day = String(hoy.getDate()).padStart(2, '0')
                setFiltroFecha(`${year}-${month}-${day}`)
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {mostrarExternas && seleccionadasIds.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="text-sm text-gray-700">
              <strong>{seleccionadasIds.length}</strong> OTs externas seleccionadas
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={estadoLote}
                onChange={(e) => setEstadoLote(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={aplicandoLote}
              >
                <option value="EN_PROCESO">EN_PROCESO</option>
                <option value="LISTO">LISTO</option>
                <option value="ENTREGADO">ENTREGADO</option>
              </select>
              <Button
                variant="primary"
                onClick={handleCambiarEstadoLote}
                disabled={aplicandoLote || seleccionadasIds.length === 0}
              >
                {aplicandoLote ? 'Aplicando...' : 'Aplicar estado'}
              </Button>
              <Button variant="secondary" onClick={limpiarSeleccion} disabled={aplicandoLote}>
                Limpiar selección
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-4 min-w-[280px] border border-gray-200 shadow-sm border-t-4 border-t-gray-400"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">En Cola</h2>
            <motion.span 
              key={ots.EN_COLA.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full"
            >
              {ots.EN_COLA.length}
            </motion.span>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {ots.EN_COLA.map((ot, index) => renderTarjetaOT(ot, index))}
              {ots.EN_COLA.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-8 text-sm"
                >
                  No hay OTs en cola
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 min-w-[280px] border border-gray-200 shadow-sm border-t-4 border-t-yellow-400"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">En Proceso</h2>
            <motion.span 
              key={ots.EN_PROCESO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full"
            >
              {ots.EN_PROCESO.length}
            </motion.span>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {ots.EN_PROCESO.map((ot, index) => renderTarjetaOT(ot, index))}
              {ots.EN_PROCESO.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-8 text-sm"
                >
                  No hay OTs en proceso
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 min-w-[280px] border border-gray-200 shadow-sm border-t-4 border-t-green-400"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Listo</h2>
            <motion.span 
              key={ots.LISTO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full"
            >
              {ots.LISTO.length}
            </motion.span>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {ots.LISTO.map((ot, index) => renderTarjetaOT(ot, index))}
              {ots.LISTO.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-8 text-sm"
                >
                  No hay OTs listas
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 min-w-[280px] border border-gray-200 shadow-sm border-t-4 border-t-blue-400"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Entregado</h2>
            <motion.span 
              key={ots.ENTREGADO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full"
            >
              {ots.ENTREGADO.length}
            </motion.span>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {ots.ENTREGADO.map((ot, index) => renderTarjetaOT(ot, index))}
              {ots.ENTREGADO.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-8 text-sm"
                >
                  No hay OTs entregadas
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </motion.div>
      </div>
          </>
        )}
      </div>
    </>
  )
}

