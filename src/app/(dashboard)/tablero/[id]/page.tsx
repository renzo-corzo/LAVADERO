/**
 * Página de Detalle de OT
 * US-007: Ver Detalle de OT
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime, formatHorarioDeseado } from '@/lib/utils'
import type { OrdenTrabajo, Pago } from '@/types'

interface OTDetalle extends OrdenTrabajo {
  estadosHistorial?: any[]
  pagos?: Pago[]
}

export default function OTDetallePage() {
  const params = useParams()
  const router = useRouter()
  const otId = params.id as string
  
  const [ot, setOT] = useState<OTDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagos, setPagos] = useState<Pago[]>([])

  useEffect(() => {
    cargarDetalle()
    cargarPagos()
  }, [otId])

  const cargarDetalle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ots/${otId}`)
      if (response.ok) {
        const data = await response.json()
        setOT(data)
      } else {
        alert('Error al cargar la OT')
        router.push('/tablero')
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error)
      alert('Error al cargar la OT')
    } finally {
      setLoading(false)
    }
  }

  const cargarPagos = async () => {
    try {
      const response = await fetch(`/api/pagos?otId=${otId}`)
      if (response.ok) {
        const data = await response.json()
        setPagos(data)
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    }
  }

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/ots/${otId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado }),
      })

      if (response.ok) {
        // Si se marca como ENTREGADO, ofrecer registrar pago
        if (nuevoEstado === 'ENTREGADO') {
          cargarDetalle() // Recargar datos actualizados
          const quierePagar = confirm('¿Desea registrar el pago ahora?')
          if (quierePagar) {
            router.push(`/caja/cobrar/${otId}`)
            return
          }
        }
        
        cargarDetalle()
        router.push('/tablero')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'No se pudo cambiar el estado'}`)
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado')
    }
  }

  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0)
  const pendiente = ot ? ot.precio - totalPagado : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando detalle de OT...</p>
      </div>
    )
  }

  if (!ot) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">OT no encontrada</p>
        <Link href="/tablero">
          <Button variant="secondary">Volver al Tablero</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/tablero" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Volver al Tablero
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Detalle de OT - {ot.patente || ot.descripcionVehiculo || 'Sin identificación'}
          </h1>
        </div>
        <div className="flex gap-2">
          {ot.estado !== 'ENTREGADO' && ot.estado !== 'CANCELADO' && (
            <Link href={`/ots/${otId}/editar`}>
              <Button variant="secondary">Editar OT</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Estado</label>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    ot.estado === 'EN_COLA' ? 'bg-gray-200 text-gray-700' :
                    ot.estado === 'EN_PROCESO' ? 'bg-yellow-200 text-yellow-800' :
                    ot.estado === 'LISTO' ? 'bg-green-200 text-green-800' :
                    ot.estado === 'ENTREGADO' ? 'bg-blue-200 text-blue-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {ot.estado.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Fecha de Ingreso</label>
                <p className="mt-1 font-medium">{formatDateTime(new Date(ot.fechaIngreso))}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Patente</label>
                <p className="mt-1 font-medium">{ot.patente}</p>
              </div>
              {ot.tipoVehiculo && (
                <div>
                  <label className="text-sm text-gray-500">Tipo de Vehículo</label>
                  <p className="mt-1 font-medium capitalize">{ot.tipoVehiculo}</p>
                </div>
              )}
              {ot.descripcionVehiculo && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Descripción</label>
                  <p className="mt-1">{ot.descripcionVehiculo}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Cliente</label>
                <p className="mt-1 font-medium">{ot.nombreCliente}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Teléfono</label>
                <p className="mt-1 font-medium">{ot.telefonoCliente}</p>
              </div>
              {ot.horarioDeseado && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Horario Deseado</label>
                  <p className="mt-1 font-medium">{formatHorarioDeseado(new Date(ot.horarioDeseado), new Date(ot.fechaIngreso))}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Servicios */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Servicio y Extras</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">{ot.servicio.nombre}</span>
                <span className="font-bold">{formatCurrency(ot.servicio.precio)}</span>
              </div>
              {ot.extras && ot.extras.length > 0 && (
                <>
                  {ot.extras.map((extra: any) => (
                    <div key={extra.id} className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">+ {extra.nombre}</span>
                      <span>{formatCurrency(extra.precio)}</span>
                    </div>
                  ))}
                </>
              )}
              {ot.precioAjustado && (
                <div className="mt-2 p-2 bg-yellow-50 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Precio ajustado:</strong> {formatCurrency(ot.precioAjustado)}
                  </p>
                  {ot.justificacionPrecio && (
                    <p className="text-xs text-gray-500 mt-1">{ot.justificacionPrecio}</p>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center py-3 mt-2 border-t-2">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">{formatCurrency(ot.precio)}</span>
              </div>
            </div>
          </Card>


          {/* Observaciones */}
          {ot.observaciones && (
            <Card>
              <h2 className="text-lg font-bold mb-4">Observaciones</h2>
              <p className="text-gray-700">{ot.observaciones}</p>
            </Card>
          )}

          {/* Historial de Estados */}
          {ot.estadosHistorial && ot.estadosHistorial.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold mb-4">Historial de Estados</h2>
              <div className="space-y-2">
                {ot.estadosHistorial.map((historial: any, index: number) => (
                  <div key={historial.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">{historial.estadoAnterior}</span>
                      {' → '}
                      <span className="font-medium">{historial.estadoNuevo}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {historial.usuario?.nombre || 'Sistema'} - {formatDateTime(new Date(historial.fechaHora))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Acciones */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Acciones</h2>
            <div className="space-y-2">
              {ot.estado === 'EN_COLA' && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-3 min-h-[48px]"
                  onClick={() => handleCambiarEstado('EN_PROCESO')}
                >
                  Mover a En Proceso
                </Button>
              )}
              {ot.estado === 'EN_PROCESO' && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-3 min-h-[48px]"
                  onClick={() => handleCambiarEstado('LISTO')}
                >
                  Marcar como Listo
                </Button>
              )}
              {ot.estado === 'LISTO' && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-3 min-h-[48px]"
                  onClick={() => handleCambiarEstado('ENTREGADO')}
                >
                  Marcar como Entregado
                </Button>
              )}
            </div>
          </Card>

          {/* Pagos */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Pagos</h2>
              {ot.estado !== 'CANCELADO' && pendiente > 0 && (
                <Button 
                  type="button"
                  size="sm" 
                  variant="primary"
                  onClick={() => router.push(`/caja/cobrar/${otId}`)}
                >
                  + Registrar Pago
                </Button>
              )}
              {pendiente <= 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  ✓ Pagada
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Total OT:</span>
                <span className="font-bold">{formatCurrency(ot.precio)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-gray-600">Pagado:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalPagado)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2">
                <span className="font-medium">Pendiente:</span>
                <span className={`font-bold ${pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(pendiente)}
                </span>
              </div>
            </div>

            {pagos.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pagos.map((pago) => (
                  <div key={pago.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatCurrency(pago.monto)}</span>
                      <span className="text-gray-500">{pago.medioPago}</span>
                    </div>
                    {pago.referencia && (
                      <p className="text-xs text-gray-500 mt-1">Ref: {pago.referencia}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(new Date(pago.fechaHora))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay pagos registrados</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

