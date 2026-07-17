/**
 * Página del Tablero Operativo (Vista Kanban)
 * US-005: Tablero Operativo
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime, formatHorarioDeseado, getTimeElapsed } from '@/lib/utils'
import { linksWhatsAppOT, abrirWhatsApp } from '@/lib/whatsapp'
import { useSucursales } from '@/lib/hooks/useSucursales'
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
  const { data: session } = useSession()
  const confirm = useConfirm()
  const [mounted, setMounted] = useState(false) // Para evitar problemas de hidratación
  const queryClient = useQueryClient()
  const [mostrarExternas, setMostrarExternas] = useState(false)
  // Sucursal: '' = todas (consolidado). Solo el dueño/admin puede elegir.
  const { sucursales, puedeElegir } = useSucursales()
  const [filtroSucursal, setFiltroSucursal] = useState<string>('')
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

  // Fetch de OTs con React Query: caché + auto-refresh cada 15s (siempre que esté montado).
  const consultaHabilitada = mounted

  const {
    data: listaOTs,
    error,
    isFetching,
    refetch,
  } = useQuery<OrdenTrabajo[], Error & { status?: number }>({
    queryKey: ['ots', { fecha: filtroFecha, externas: mostrarExternas, sucursal: filtroSucursal }],
    enabled: consultaHabilitada,
    refetchInterval: consultaHabilitada ? 15_000 : false,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroFecha) params.append('fecha', filtroFecha)
      if (mostrarExternas) params.append('incluirExternas', 'true')
      if (filtroSucursal) params.append('sucursalId', filtroSucursal)

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

        // Avisar al cliente por WhatsApp cuando la OT queda LISTA para retirar
        if (nuevoEstado === 'LISTO') {
          const ot = listaOTs?.find((o) => o.id === otId)
          if (ot && !ot.esExterna) {
            const links = linksWhatsAppOT({
              telefono: ot.telefonoCliente,
              nombre: ot.nombreCliente,
              patente: ot.patente,
              variante: 'listo',
            })
            if (links && !abrirWhatsApp(links)) {
              toast('Auto listo. Avisá al cliente por WhatsApp', {
                action: {
                  label: 'Abrir WhatsApp',
                  onClick: () => window.open(links.web, '_blank'),
                },
              })
            }
          }
        }
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
      className="bg-white border border-aqua-line rounded-2xl p-4 mb-3 shadow-aqua hover:shadow-aqua-lg transition-all cursor-pointer"
      onClick={() => router.push(`/tablero/${ot.id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-xl sm:text-lg font-bold text-ink mb-1 tracking-wide">
            {ot.patente}
          </div>
          <div className="text-xs sm:text-xs text-muted">
            {ot.nombreCliente} • {formatDateTime(new Date(ot.fechaIngreso))}
          </div>
          {ot.horarioDeseado && (
            <div className="text-xs text-brand-blue mt-1">
              ⏰ {formatHorarioDeseado(new Date(ot.horarioDeseado), new Date(ot.fechaIngreso))}
            </div>
          )}
          {ot.esExterna && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand">
                OT externa
              </span>
            </div>
          )}
        </div>
        <div className="text-right ml-2 flex-shrink-0">
          {ot.esExterna && (
            <div className="flex items-center justify-end gap-2 mb-1">
              <label
                className="inline-flex items-center gap-2 text-xs text-muted select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={seleccionadasIds.includes(ot.id)}
                  onChange={() => toggleSeleccion(ot.id)}
                  className="h-4 w-4 accent-brand rounded"
                />
                Seleccionar
              </label>
            </div>
          )}
          <div className="font-bold text-base sm:text-sm text-ink tabular-nums">{formatCurrency(ot.precio)}</div>
          {ot.estado === 'EN_PROCESO' && ot.fechaIngreso && (
            <div className="text-xs text-muted">
              {getTimeElapsed(new Date(ot.fechaIngreso))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-ink font-medium">{ot.servicio.nombre}</div>
        {ot.extras && ot.extras.length > 0 && (
          <div className="text-xs text-muted">
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
          <span className="px-2.5 py-1 bg-ok/15 text-ok rounded-full text-xs font-semibold">
            ✓ Pagada
          </span>
        )}
      </div>
    </motion.div>
  )

  // ========== RETURN ==========
  return (
    <div>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted">Cargando tablero...</p>
          </div>
        )}

        {!loading && errorCarga && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger"
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
          <h1 className="text-2xl font-bold text-ink">Tablero operativo</h1>
          <p className="text-muted mt-1">Gestioná las órdenes de trabajo del día</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Cargando...' : '🔄 Recargar'}
          </Button>
          {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO' || session?.user.role === 'ADMIN') && (
            <Link href="/ots/nueva">
              <Button variant="primary">+ Nueva OT</Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {puedeElegir && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Sucursal
              </label>
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white border border-aqua-line rounded-xl text-ink transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-white border border-aqua-line rounded-xl text-ink transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            />
          </div>
          {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO' || session?.user.role === 'ADMIN') && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-ink">
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
                  className="h-4 w-4 accent-brand rounded"
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
            <div className="text-sm text-ink">
              <strong>{seleccionadasIds.length}</strong> OTs externas seleccionadas
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={estadoLote}
                onChange={(e) => setEstadoLote(e.target.value as any)}
                className="px-3.5 py-2.5 bg-white border border-aqua-line rounded-xl text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
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
          className="bg-white rounded-2xl p-4 min-w-[280px] border border-aqua-line shadow-aqua border-t-4 border-t-brand-blue"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-ink">En cola</h2>
            <motion.span
              key={ots.EN_COLA.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-brand-blue/12 text-brand-blue text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
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
                  className="text-center text-muted py-8 text-sm"
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
          className="bg-white rounded-2xl p-4 min-w-[280px] border border-aqua-line shadow-aqua border-t-4 border-t-warn"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-ink">En proceso</h2>
            <motion.span
              key={ots.EN_PROCESO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-warn/15 text-[#b9791a] text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
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
                  className="text-center text-muted py-8 text-sm"
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
          className="bg-white rounded-2xl p-4 min-w-[280px] border border-aqua-line shadow-aqua border-t-4 border-t-ok"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-ink">Listo</h2>
            <motion.span
              key={ots.LISTO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-ok/15 text-[#0c8f68] text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
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
                  className="text-center text-muted py-8 text-sm"
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
          className="bg-white rounded-2xl p-4 min-w-[280px] border border-aqua-line shadow-aqua border-t-4 border-t-ink"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-ink">Entregado</h2>
            <motion.span
              key={ots.ENTREGADO.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-ink/10 text-ink text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
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
                  className="text-center text-muted py-8 text-sm"
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
  )
}

