/**
 * Página del Tablero Operativo (Vista Kanban)
 * US-005: Tablero Operativo
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime, formatHorarioDeseado, getTimeElapsed } from '@/lib/utils'
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
  const [esMovil, setEsMovil] = useState(false)
  const [mostrarKanban, setMostrarKanban] = useState(false)
  const [ots, setOTs] = useState<OTsPorEstado>({
    EN_COLA: [],
    EN_PROCESO: [],
    LISTO: [],
    ENTREGADO: [],
  })
  const [loading, setLoading] = useState(true)
  const [filtroFecha, setFiltroFecha] = useState<string>(() => {
    const hoy = new Date()
    const year = hoy.getFullYear()
    const month = String(hoy.getMonth() + 1).padStart(2, '0')
    const day = String(hoy.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // ========== TODOS LOS USE EFFECT ==========
  // Detectar si es móvil DESPUÉS de la hidratación
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setEsMovil(isMobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Si viene el parámetro verKanban, mostrar el kanban directamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('kanban') === 'true') {
        setMostrarKanban(true)
      }
    }
  }, [])

  // Función para cargar OTs (usando useCallback para estabilidad)
  const cargarOTs = useCallback(async () => {
    const mostrarMenuMovil = esMovil && !mostrarKanban
    if (mostrarMenuMovil) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroFecha) {
        params.append('fecha', filtroFecha)
      }
      params.append('_t', Date.now().toString())

      const response = await fetch(`/api/ots?${params.toString()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        const otsPorEstado: OTsPorEstado = {
          EN_COLA: [],
          EN_PROCESO: [],
          LISTO: [],
          ENTREGADO: [],
        }
        data.forEach((ot: OrdenTrabajo) => {
          if (otsPorEstado[ot.estado as keyof OTsPorEstado]) {
            otsPorEstado[ot.estado as keyof OTsPorEstado].push(ot)
          }
        })
        setOTs(otsPorEstado)
      }
    } catch (error) {
      console.error('Error al cargar OTs:', error)
    } finally {
      setLoading(false)
    }
  }, [filtroFecha, esMovil, mostrarKanban])

  // Cargar OTs cuando cambian las dependencias
  useEffect(() => {
    cargarOTs()
  }, [cargarOTs])

  // Recargar si viene el parámetro recargar en la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('recargar') === 'true') {
        cargarOTs()
        window.history.replaceState({}, '', '/tablero')
      }
    }
  }, [cargarOTs])

  // ========== FUNCIONES DESPUÉS DE TODOS LOS HOOKS ==========
  const handleCambiarEstado = async (otId: string, nuevoEstado: string) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      return
    }

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
          const quierePagar = confirm('¿Desea registrar el pago ahora?')
          if (quierePagar) {
            router.push(`/caja/cobrar/${otId}`)
            return
          }
        }
        setTimeout(() => {
          cargarOTs()
        }, 300)
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'No se pudo cambiar el estado'}`)
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado de la OT')
    }
  }

  const renderTarjetaOT = (ot: OrdenTrabajo) => (
    <div
      key={ot.id}
      className="bg-white border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
        </div>
        <div className="text-right ml-2 flex-shrink-0">
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
    </div>
  )

  // ========== VARIABLES Y CÁLCULOS DESPUÉS DE FUNCIONES ==========
  const menuItems = [
    {
      href: '/tablero?kanban=true',
      label: 'Tablero Kanban',
      icon: '📋',
      color: 'bg-green-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/ots/nueva',
      label: 'Nueva OT',
      icon: '➕',
      color: 'bg-purple-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/catalogos',
      label: 'Catálogos',
      icon: '📚',
      color: 'bg-orange-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: '👥',
      color: 'bg-indigo-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/caja',
      label: 'Caja',
      icon: '💰',
      color: 'bg-yellow-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/comisiones',
      label: 'Comisiones',
      icon: '💵',
      color: 'bg-teal-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/reportes',
      label: 'Reportes',
      icon: '📈',
      color: 'bg-pink-500',
      roles: ['DUENO', 'ENCARGADO'],
    },
    {
      href: '/usuarios',
      label: 'Usuarios',
      icon: '👤',
      color: 'bg-gray-600',
      roles: ['DUENO'],
    },
  ]

  const itemsFiltrados = menuItems.filter((item) =>
    session?.user.role && item.roles.includes(session.user.role as 'DUENO' | 'ENCARGADO')
  )

  const mostrarMenuMovil = esMovil && !mostrarKanban

  // ========== RETURNS CONDICIONALES AL FINAL ==========
  if (loading && !mostrarMenuMovil) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando tablero...</p>
      </div>
    )
  }

  if (mostrarMenuMovil) {
    return (
      <div className="lg:hidden min-h-screen bg-gray-50 -mx-4 sm:-mx-6 -mt-8">
        <div className="px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Menú Principal</h1>
            <p className="text-gray-600 mt-1">Selecciona una opción</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {itemsFiltrados.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  ${item.color} text-white rounded-xl p-6 
                  flex flex-col items-center justify-center 
                  min-h-[140px] shadow-lg hover:shadow-xl active:shadow-md
                  transition-all duration-200 active:scale-95
                  touch-manipulation
                `}
              >
                <span className="text-5xl mb-3">{item.icon}</span>
                <span className="text-base font-semibold text-center">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render del kanban (desktop o cuando mostrarKanban=true)
  return (
    <div>
      {esMovil && mostrarKanban && (
        <div className="mb-4">
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tablero Operativo</h1>
          <p className="text-gray-600 mt-1">Gestiona las órdenes de trabajo del día</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => cargarOTs()} disabled={loading}>
            {loading ? 'Cargando...' : '🔄 Recargar'}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
        <div className="bg-gray-50 rounded-lg p-4 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">En Cola</h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
              {ots.EN_COLA.length}
            </span>
          </div>
          <div className="space-y-2">
            {ots.EN_COLA.map(renderTarjetaOT)}
            {ots.EN_COLA.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                No hay OTs en cola
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">En Proceso</h2>
            <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
              {ots.EN_PROCESO.length}
            </span>
          </div>
          <div className="space-y-2">
            {ots.EN_PROCESO.map(renderTarjetaOT)}
            {ots.EN_PROCESO.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                No hay OTs en proceso
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Listo</h2>
            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
              {ots.LISTO.length}
            </span>
          </div>
          <div className="space-y-2">
            {ots.LISTO.map(renderTarjetaOT)}
            {ots.LISTO.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                No hay OTs listas
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 min-w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Entregado</h2>
            <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
              {ots.ENTREGADO.length}
            </span>
          </div>
          <div className="space-y-2">
            {ots.ENTREGADO.map(renderTarjetaOT)}
            {ots.ENTREGADO.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                No hay OTs entregadas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}





