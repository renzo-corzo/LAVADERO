/**
 * Página principal del dashboard
 * US-018: Dashboard Principal
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  otsHoy: number
  otsEnCola: number
  otsEnProceso: number
  otsListas: number
  ventasHoy: number
  comisionesPendientes: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [esMovil, setEsMovil] = useState(false)

  // Redirigir a /tablero en móvil
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setEsMovil(isMobile)

      // Redirigir inmediatamente si es móvil
      if (isMobile) {
        router.replace('/tablero')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [router])

  const { data: stats = {
    otsHoy: 0,
    otsEnCola: 0,
    otsEnProceso: 0,
    otsListas: 0,
    ventasHoy: 0,
    comisionesPendientes: 0,
  }, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    enabled: !esMovil,
    refetchInterval: 30_000, // métricas del día casi en tiempo real
    queryFn: async () => {
      const hoy = new Date()
      const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

      const response = await fetch(`/api/ots?fecha=${fechaStr}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Error al cargar estadísticas')
      const ots = (await response.json()) as Array<{ estado: string; precio?: number; total?: number }>

      return {
        otsHoy: ots.length,
        otsEnCola: ots.filter((ot) => ot.estado === 'EN_COLA').length,
        otsEnProceso: ots.filter((ot) => ot.estado === 'EN_PROCESO').length,
        otsListas: ots.filter((ot) => ot.estado === 'LISTO').length,
        ventasHoy: ots
          .filter((ot) => ot.estado === 'ENTREGADO')
          .reduce((sum, ot) => sum + Number(ot.precio || ot.total || 0), 0),
        comisionesPendientes: 0,
      }
    },
  })

  const loading = !esMovil && isLoading

  // Si es móvil, no renderizar nada (se redirige)
  if (esMovil) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Redirigiendo...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Vista general del sistema - {formatDate(new Date())}</p>
      </div>

      {/* Accesos Rápidos - Disponible para ENCARGADO y DUENO */}
      {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO') && (
        <div className="mb-6">
          <Link href="/ots/nueva">
            <Button variant="primary" size="lg">
              + Nueva Orden de Trabajo
            </Button>
          </Link>
        </div>
      )}

      {/* Bento Grid Layout - Estilo 2026 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tarjeta grande - Órdenes Hoy */}
        <Card variant="glass" className="md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Órdenes de Trabajo Hoy</p>
              <p className="text-5xl font-bold text-gray-900 mb-1">{stats.otsHoy}</p>
              <p className="text-xs text-gray-500">Total registradas</p>
            </div>
            <div className="text-6xl opacity-20">📋</div>
          </div>
        </Card>

        {/* Tarjeta mediana - En Cola */}
        <Card variant="glass" className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm font-medium text-gray-700 mb-1">En Cola</p>
            <p className="text-4xl font-bold text-blue-600">{stats.otsEnCola}</p>
          </div>
        </Card>

        {/* Tarjeta mediana - En Proceso */}
        <Card variant="glass" className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/50">
          <div className="text-center">
            <div className="text-3xl mb-2">🔧</div>
            <p className="text-sm font-medium text-gray-700 mb-1">En Proceso</p>
            <p className="text-4xl font-bold text-yellow-600">{stats.otsEnProceso}</p>
          </div>
        </Card>

        {/* Tarjeta mediana - Listas */}
        <Card variant="glass" className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm font-medium text-gray-700 mb-1">Listas</p>
            <p className="text-4xl font-bold text-green-600">{stats.otsListas}</p>
          </div>
        </Card>

        {/* Tarjeta grande - Ventas del Día */}
        <Card variant="glass" className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">💰 Ventas del Día</p>
              <p className="text-4xl font-bold text-purple-700 mb-1">
                {formatCurrency(stats.ventasHoy)}
              </p>
              <p className="text-xs text-gray-600">Total de OTs entregadas</p>
            </div>
            <div className="text-6xl opacity-30">💵</div>
          </div>
          <div className="mt-4">
            <Link href="/reportes">
              <Button variant="outline" className="w-full">
                Ver Reportes Detallados
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tarjeta grande - Accesos Rápidos */}
        <Card variant="glass" className="md:col-span-2 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/tablero">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">📋</span>
                <div className="text-left">
                  <div className="font-medium">Tablero</div>
                  <div className="text-xs text-gray-500">Vista Kanban</div>
                </div>
              </Button>
            </Link>
            <Link href="/catalogos">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">⚙️</span>
                <div className="text-left">
                  <div className="font-medium">Catálogos</div>
                  <div className="text-xs text-gray-500">Servicios y Extras</div>
                </div>
              </Button>
            </Link>
            <Link href="/caja">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">💰</span>
                <div className="text-left">
                  <div className="font-medium">Caja</div>
                  <div className="text-xs text-gray-500">Cobros y Cierres</div>
                </div>
              </Button>
            </Link>
            <Link href="/comisiones">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">💵</span>
                <div className="text-left">
                  <div className="font-medium">Comisiones</div>
                  <div className="text-xs text-gray-500">Liquidaciones</div>
                </div>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
