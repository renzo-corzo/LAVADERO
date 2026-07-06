/**
 * Página de Detalle de OT
 * US-007: Ver Detalle de OT
 */

'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
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
  const confirm = useConfirm()
  const { data: session, status: sessionStatus } = useSession()
  const otId = params.id as string
  const esLavador = session?.user?.role === 'LAVADOR'

  const queryClient = useQueryClient()

  const {
    data: ot = null,
    isLoading: loading,
    error,
  } = useQuery<OTDetalle>({
    queryKey: ['ot', otId],
    queryFn: async () => {
      const response = await fetch(`/api/ots/${otId}`)
      if (!response.ok) throw new Error('Error al cargar la OT')
      return (await response.json()) as OTDetalle
    },
  })

  useEffect(() => {
    if (error) {
      toast.error('Error al cargar la OT')
      router.push('/tablero')
    }
  }, [error, router])

  // Los lavadores no ven pagos: la consulta queda deshabilitada para ese rol.
  const { data: pagos = [] } = useQuery<Pago[]>({
    queryKey: ['pagos', otId],
    enabled: !esLavador && sessionStatus !== 'loading',
    queryFn: async () => {
      const response = await fetch(`/api/pagos?otId=${otId}`)
      if (!response.ok) return []
      return (await response.json()) as Pago[]
    },
  })

  const handleCambiarEstado = async (nuevoEstado: string) => {
    const ok = await confirm({
      title: 'Cambiar estado',
      description: `La OT pasará a "${nuevoEstado}".`,
      confirmText: 'Cambiar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/ots/${otId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado }),
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['ot', otId] })
        // Si se marca como ENTREGADO, ofrecer registrar pago
        if (nuevoEstado === 'ENTREGADO' && !esLavador) {
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

        router.push('/tablero')
      } else {
        const data = await response.json()
        toast.error(data.error || 'No se pudo cambiar el estado')
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado')
    }
  }

  const totalPagado = esLavador
    ? Number((ot as OTDetalle & { totalPagado?: number })?.totalPagado ?? 0)
    : pagos.reduce((sum, p) => sum + p.monto, 0)
  const pendiente = ot ? ot.precio - totalPagado : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Cargando detalle de OT...</p>
      </div>
    )
  }

  if (!ot) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">OT no encontrada</p>
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
          <Link href="/tablero" className="text-brand hover:underline mb-2 inline-block">
            ← Volver al Tablero
          </Link>
          <h1 className="text-2xl font-bold text-ink">
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
                <label className="text-sm text-muted">Estado</label>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    ot.estado === 'EN_COLA' ? 'bg-ink/10 text-ink' :
                    ot.estado === 'EN_PROCESO' ? 'bg-warn/20 text-[#b9791a]' :
                    ot.estado === 'LISTO' ? 'bg-ok/20 text-[#0c8f68]' :
                    ot.estado === 'ENTREGADO' ? 'bg-brand/15 text-brand' :
                    'bg-danger/15 text-danger'
                  }`}>
                    {ot.estado.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted">Fecha de Ingreso</label>
                <p className="mt-1 font-medium">{formatDateTime(new Date(ot.fechaIngreso))}</p>
              </div>
              <div>
                <label className="text-sm text-muted">Patente</label>
                <p className="mt-1 font-medium">{ot.patente}</p>
              </div>
              {ot.tipoVehiculo && (
                <div>
                  <label className="text-sm text-muted">Tipo de Vehículo</label>
                  <p className="mt-1 font-medium capitalize">{ot.tipoVehiculo}</p>
                </div>
              )}
              {ot.descripcionVehiculo && (
                <div className="col-span-2">
                  <label className="text-sm text-muted">Descripción</label>
                  <p className="mt-1">{ot.descripcionVehiculo}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted">Cliente</label>
                <p className="mt-1 font-medium">{ot.nombreCliente}</p>
              </div>
              <div>
                <label className="text-sm text-muted">Teléfono</label>
                <p className="mt-1 font-medium">{ot.telefonoCliente}</p>
              </div>
              {ot.horarioDeseado && (
                <div className="col-span-2">
                  <label className="text-sm text-muted">Horario Deseado</label>
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
                      <span className="text-muted">+ {extra.nombre}</span>
                      <span>{formatCurrency(extra.precio)}</span>
                    </div>
                  ))}
                </>
              )}
              {ot.precioAjustado && (
                <div className="mt-2 p-2 bg-warn/10 rounded">
                  <p className="text-sm text-muted">
                    <strong>Precio ajustado:</strong> {formatCurrency(ot.precioAjustado)}
                  </p>
                  {ot.justificacionPrecio && (
                    <p className="text-xs text-muted mt-1">{ot.justificacionPrecio}</p>
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
              <p className="text-ink">{ot.observaciones}</p>
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
                      <p className="text-xs text-muted mt-1">
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
              {ot.estado === 'LISTO' && !esLavador && (
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
              {!esLavador && ot.estado !== 'CANCELADO' && pendiente > 0 && (
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
                <span className="px-3 py-1 bg-ok/15 text-[#0c8f68] rounded-full text-xs font-medium">
                  ✓ Pagada
                </span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between py-2">
                <span className="text-muted">Total OT:</span>
                <span className="font-bold">{formatCurrency(ot.precio)}</span>
              </div>
              <div className="flex justify-between py-2 border-t">
                <span className="text-muted">Pagado:</span>
                <span className="font-bold text-ok">{formatCurrency(totalPagado)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2">
                <span className="font-medium">Pendiente:</span>
                <span className={`font-bold ${pendiente > 0 ? 'text-danger' : 'text-ok'}`}>
                  {formatCurrency(pendiente)}
                </span>
              </div>
            </div>

            {esLavador ? (
              <p className="text-sm text-muted text-center py-2">
                Resumen de cobro visible arriba; el detalle de pagos es solo para encargado o dueño.
              </p>
            ) : pagos.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pagos.map((pago) => (
                  <div key={pago.id} className="p-2 bg-aqua-bg rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{formatCurrency(pago.monto)}</span>
                      <span className="text-muted">{pago.medioPago}</span>
                    </div>
                    {pago.referencia && (
                      <p className="text-xs text-muted mt-1">Ref: {pago.referencia}</p>
                    )}
                    <p className="text-xs text-muted mt-1">
                      {formatDateTime(new Date(pago.fechaHora))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-4">No hay pagos registrados</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

