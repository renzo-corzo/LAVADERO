/**
 * Página principal de Caja y Cobros
 * US-010: Cierre de Caja
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface CierreCaja {
  id: string
  fechaDesde: string
  fechaHasta: string
  fechaCierre: string
  totalEfectivo: number
  totalTransferencia: number
  totalGeneral: number
  observaciones?: string
  usuario: {
    id: string
    nombre: string
  }
  ots: Array<{
    id: string
    patente?: string
    descripcionVehiculo?: string
    total: number
  }>
}

export default function CajaPage() {
  const { data: cierres = [], isLoading: loading } = useQuery<CierreCaja[]>({
    queryKey: ['cierres', 'ultimos-30-dias'],
    queryFn: async () => {
      // Últimos 30 días por defecto
      const hasta = new Date()
      const desde = new Date()
      desde.setDate(desde.getDate() - 30)

      const response = await fetch(
        `/api/cierres?desde=${desde.toISOString().split('T')[0]}&hasta=${hasta.toISOString().split('T')[0]}`
      )
      if (!response.ok) throw new Error('Error al cargar cierres')
      return (await response.json()) as CierreCaja[]
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja y Cobros</h1>
          <p className="text-gray-600 mt-1">Gestión de cierres de caja</p>
        </div>
        <Link href="/caja/cerrar">
          <Button variant="primary">+ Nuevo Cierre</Button>
        </Link>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Cierres este mes</div>
          <div className="text-2xl font-bold">{cierres.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total cierre más reciente</div>
          <div className="text-2xl font-bold text-green-600">
            {cierres.length > 0 ? formatCurrency(cierres[0].totalGeneral) : '$ 0,00'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Último cierre</div>
          <div className="text-lg font-medium">
            {cierres.length > 0
              ? formatDateTime(new Date(cierres[0].fechaCierre))
              : 'Sin cierres'}
          </div>
        </Card>
      </div>

      {/* Listado de cierres */}
      <Card>
        <h2 className="text-lg font-bold mb-4">Historial de Cierres</h2>
        {cierres.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No hay cierres registrados</p>
            <Link href="/caja/cerrar">
              <Button variant="primary">Crear Primer Cierre</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Cierre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efectivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferencia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OTs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cerrado por
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cierres.map((cierre) => (
                  <tr key={cierre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        {new Date(cierre.fechaDesde).toLocaleDateString('es-AR')}
                      </div>
                      <div className="text-gray-500">
                        hasta {new Date(cierre.fechaHasta).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(new Date(cierre.fechaCierre))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(cierre.totalEfectivo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(cierre.totalTransferencia)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                      {formatCurrency(cierre.totalGeneral)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {cierre.ots.length} OT{cierre.ots.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cierre.usuario.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/caja/cierres/${cierre.id}`}>
                        <Button size="sm" variant="secondary">
                          Ver Detalle
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}





