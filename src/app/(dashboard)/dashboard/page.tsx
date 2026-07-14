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
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-muted mt-1">Vista general del sistema · {formatDate(new Date())}</p>
      </div>

      {/* Accesos Rápidos - Disponible para ENCARGADO y DUENO */}
      {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO' || session?.user.role === 'ADMIN') && (
        <div className="mb-6">
          <Link href="/ots/nueva">
            <Button variant="primary" size="lg">
              + Nueva Orden de Trabajo
            </Button>
          </Link>
        </div>
      )}

      {/* Bento Grid Layout - sistema Aqua */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Hero - Ventas del Día */}
        <Card className="md:col-span-2 lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-brand-teal to-brand-blue border-transparent text-white shadow-brand">
          <div className="absolute -right-10 -bottom-14 w-44 h-44 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45),rgba(255,255,255,0)_60%)]" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/85 mb-2">Ventas del día</p>
              <p className="text-4xl font-extrabold tabular-nums mb-1">
                {formatCurrency(stats.ventasHoy)}
              </p>
              <p className="text-xs text-white/85">Total de OTs entregadas y cobradas</p>
            </div>
            <div className="text-5xl opacity-40">💵</div>
          </div>
          <div className="relative mt-4">
            <Link href="/reportes">
              <Button variant="secondary" className="w-full">
                Ver reportes detallados
              </Button>
            </Link>
          </div>
        </Card>

        {/* Órdenes hoy */}
        <Card>
          <p className="text-sm font-medium text-muted mb-2">Órdenes de hoy</p>
          <p className="text-4xl font-extrabold text-ink tabular-nums">{stats.otsHoy}</p>
          <p className="text-xs text-muted mt-1">Total registradas</p>
        </Card>

        {/* En Cola */}
        <Card>
          <p className="text-sm font-medium text-muted mb-2">En cola</p>
          <p className="text-4xl font-extrabold text-brand-blue tabular-nums">{stats.otsEnCola}</p>
          <p className="text-xs text-muted mt-1">Esperando lavador</p>
        </Card>

        {/* En Proceso */}
        <Card>
          <p className="text-sm font-medium text-muted mb-2">En proceso</p>
          <p className="text-4xl font-extrabold text-warn tabular-nums">{stats.otsEnProceso}</p>
          <p className="text-xs text-muted mt-1">En lavado ahora</p>
        </Card>

        {/* Listas */}
        <Card>
          <p className="text-sm font-medium text-muted mb-2">Listas</p>
          <p className="text-4xl font-extrabold text-ok tabular-nums">{stats.otsListas}</p>
          <p className="text-xs text-muted mt-1">A entregar / cobrar</p>
        </Card>

        {/* Accesos Rápidos */}
        <Card className="md:col-span-2 lg:col-span-4">
          <h3 className="text-lg font-semibold text-ink mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/tablero">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">📋</span>
                <div className="text-left">
                  <div className="font-medium">Tablero</div>
                  <div className="text-xs text-muted">Vista Kanban</div>
                </div>
              </Button>
            </Link>
            <Link href="/catalogos">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">⚙️</span>
                <div className="text-left">
                  <div className="font-medium">Catálogos</div>
                  <div className="text-xs text-muted">Servicios y Extras</div>
                </div>
              </Button>
            </Link>
            <Link href="/caja">
              <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <span className="text-xl mr-2">💰</span>
                <div className="text-left">
                  <div className="font-medium">Caja</div>
                  <div className="text-xs text-muted">Cobros y Cierres</div>
                </div>
              </Button>
            </Link>
            {/* Acceso a Comisiones oculto: negocio con sueldo fijo (ver Header.tsx) */}
          </div>
        </Card>
      </div>
    </div>
  )
}
