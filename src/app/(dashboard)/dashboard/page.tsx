/**
 * Página principal del dashboard
 * US-018: Dashboard Principal
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  const [stats, setStats] = useState<DashboardStats>({
    otsHoy: 0,
    otsEnCola: 0,
    otsEnProceso: 0,
    otsListas: 0,
    ventasHoy: 0,
    comisionesPendientes: 0,
  })
  const [loading, setLoading] = useState(true)

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

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true)
      const hoy = new Date()
      const year = hoy.getFullYear()
      const month = String(hoy.getMonth() + 1).padStart(2, '0')
      const day = String(hoy.getDate()).padStart(2, '0')
      const fechaStr = `${year}-${month}-${day}`
      
      // Obtener OTs del día usando el parámetro de fecha
      const responseOTs = await fetch(`/api/ots?fecha=${fechaStr}`, {
        cache: 'no-store', // Evitar cache para datos en tiempo real
      })
      
      if (responseOTs.ok) {
        const ots = await responseOTs.json()
        
        setStats({
          otsHoy: ots.length,
          otsEnCola: ots.filter((ot: any) => ot.estado === 'EN_COLA').length,
          otsEnProceso: ots.filter((ot: any) => ot.estado === 'EN_PROCESO').length,
          otsListas: ots.filter((ot: any) => ot.estado === 'LISTO').length,
          ventasHoy: ots
            .filter((ot: any) => ot.estado === 'ENTREGADO')
            .reduce((sum: number, ot: any) => sum + Number(ot.precio || ot.total || 0), 0),
          comisionesPendientes: 0, // TODO: implementar cuando tengamos comisiones
        })
      } else {
        console.error('Error al cargar OTs:', responseOTs.status, responseOTs.statusText)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!esMovil) {
      cargarEstadisticas()
    }
  }, [esMovil, cargarEstadisticas])

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

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Órdenes Hoy</p>
            <p className="text-3xl font-bold text-gray-900">{stats.otsHoy}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">En Cola</p>
            <p className="text-3xl font-bold text-blue-600">{stats.otsEnCola}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">En Proceso</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.otsEnProceso}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Listas</p>
            <p className="text-3xl font-bold text-green-600">{stats.otsListas}</p>
          </div>
        </Card>
      </div>

      {/* Ventas y Comisiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Ventas del Día">
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.ventasHoy)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Total de OTs entregadas hoy
            </p>
          </div>
          <div className="mt-4">
            <Link href="/reportes">
              <Button variant="secondary" className="w-full">
                Ver Reportes
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Accesos Rápidos">
          <div className="space-y-2">
            <Link href="/tablero">
              <Button variant="secondary" className="w-full justify-start">
                📋 Ver Tablero
              </Button>
            </Link>
            <Link href="/catalogos">
              <Button variant="secondary" className="w-full justify-start">
                ⚙️ Gestionar Catálogos
              </Button>
            </Link>
            <Link href="/caja">
              <Button variant="secondary" className="w-full justify-start">
                💰 Caja y Cobros
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
