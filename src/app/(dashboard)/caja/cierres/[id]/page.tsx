/**
 * Página de Detalle de Cierre de Caja
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface CierreDetalle {
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
    estado: string
    fechaIngreso: string
  }>
  pagos: Array<{
    id: string
    monto: number
    medioPago: string
    referencia?: string
    fechaHora: string
    ot: {
      id: string
      patente?: string
      descripcionVehiculo?: string
      total: number
    }
    usuario: {
      id: string
      nombre: string
    }
  }>
}

export default function CierreDetallePage() {
  const params = useParams()
  const router = useRouter()
  const cierreId = params.id as string

  const [cierre, setCierre] = useState<CierreDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDetalle()
  }, [cierreId])

  const cargarDetalle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cierres/${cierreId}`)
      if (response.ok) {
        const data = await response.json()
        setCierre(data)
      } else {
        toast.error('Error al cargar el cierre')
        router.push('/caja')
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error)
      toast.error('Error al cargar el cierre')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando detalle del cierre...</p>
      </div>
    )
  }

  if (!cierre) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Cierre no encontrado</p>
        <Link href="/caja">
          <Button variant="secondary">Volver a Caja</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/caja" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Volver a Caja
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Cierre de Caja</h1>
          <p className="text-gray-600 mt-1">
            Cierre del {new Date(cierre.fechaDesde).toLocaleDateString('es-AR')} al{' '}
            {new Date(cierre.fechaHasta).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Totales */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Totales</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Efectivo</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(cierre.totalEfectivo)}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Transferencia</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(cierre.totalTransferencia)}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(cierre.totalGeneral)}
                </div>
              </div>
            </div>
          </Card>

          {/* Información del Cierre */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Información</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de Cierre:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(cierre.fechaCierre))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Período:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(cierre.fechaDesde))} -{' '}
                  {formatDateTime(new Date(cierre.fechaHasta))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cerrado por:</span>
                <span className="font-medium">{cierre.usuario.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">OTs incluidas:</span>
                <span className="font-medium">{cierre.ots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagos registrados:</span>
                <span className="font-medium">{cierre.pagos.length}</span>
              </div>
              {cierre.observaciones && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-gray-600 mb-1">Observaciones:</div>
                  <p className="text-gray-800">{cierre.observaciones}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Lista de Pagos */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Pagos Registrados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha/Hora
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      OT
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Medio
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Registrado por
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cierre.pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="px-4 py-2 text-sm">
                        {formatDateTime(new Date(pago.fechaHora))}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {pago.ot.patente || pago.ot.descripcionVehiculo || 'Sin identificación'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        {formatCurrency(pago.monto)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            pago.medioPago === 'EFECTIVO'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {pago.medioPago}
                        </span>
                        {pago.referencia && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ref: {pago.referencia}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {pago.usuario.nombre}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Lista de OTs */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Órdenes de Trabajo Incluidas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Identificación
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Ingreso
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cierre.ots.map((ot) => (
                    <tr key={ot.id}>
                      <td className="px-4 py-2 text-sm">
                        {ot.patente || ot.descripcionVehiculo || 'Sin identificación'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDateTime(new Date(ot.fechaIngreso))}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        {formatCurrency(ot.total)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {ot.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}





