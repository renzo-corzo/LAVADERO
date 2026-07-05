/**
 * Página principal de Reportes
 * US-014, US-015: Reportes de Ventas y Comisiones
 */

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import { obtenerFechaLocal } from '@/lib/utils-fechas'
import { useSession } from 'next-auth/react'

type TipoReporte = 'ventas' | 'comisiones' | 'metricas' | null

interface Cliente {
  id: string
  nombre: string
  tipo: 'WALK_IN' | 'CONCESIONARIA'
}

export default function ReportesPage() {
  const { data: session } = useSession()
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>(null)
  const hoy = new Date()
  const haceUnMes = new Date()
  haceUnMes.setMonth(haceUnMes.getMonth() - 1)
  const [fechaDesde, setFechaDesde] = useState<string>(obtenerFechaLocal(haceUnMes))
  const [fechaHasta, setFechaHasta] = useState<string>(obtenerFechaLocal(hoy))
  const [clienteId, setClienteId] = useState<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Cargar clientes
  useEffect(() => {
    if (session) {
      cargarClientes()
    }
  }, [session])

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true)
      const response = await fetch('/api/clientes?activo=true')
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const handleVerReporte = (tipo: TipoReporte) => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Por favor seleccioná las fechas')
      return
    }
    console.log('Mostrando reporte:', tipo)
    setTipoReporte(tipo)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Analiza el rendimiento del negocio</p>
      </div>

      {/* Selector de período y filtros */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">Filtros del Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <Select
              label="Cliente (opcional)"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              placeholder="Todos los clientes"
              options={[
                { value: '', label: 'Todos los clientes' },
                ...clientes.map((c) => ({
                  value: c.id,
                  label: `${c.nombre} ${c.tipo === 'CONCESIONARIA' ? '(Concesionaria)' : ''}`,
                })),
              ]}
              disabled={loadingClientes}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                const hoy = new Date()
                const haceUnMes = new Date()
                haceUnMes.setMonth(haceUnMes.getMonth() - 1)
                setFechaDesde(obtenerFechaLocal(haceUnMes))
                setFechaHasta(obtenerFechaLocal(hoy))
                setClienteId('')
              }}
            >
              Resetear Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tipos de reportes (Comisiones oculto: negocio con sueldo fijo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reporte de Ventas</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ventas por período, medios de pago y servicios más vendidos
            </p>
            <Button variant="primary" onClick={() => handleVerReporte('ventas')}>
              Ver Reporte
            </Button>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Métricas Operativas</h3>
            <p className="text-sm text-gray-600 mb-4">
              OTs atendidas, tiempos promedio y cancelaciones
            </p>
            <Button variant="primary" onClick={() => handleVerReporte('metricas')}>
              Ver Reporte
            </Button>
          </div>
        </Card>
      </div>

      {/* Mostrar reporte seleccionado */}
      {tipoReporte && (
        <div className="mt-6">
          {tipoReporte === 'ventas' && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reporte de Ventas</h2>
                <Button variant="secondary" size="sm" onClick={() => setTipoReporte(null)}>
                  ✕ Cerrar
                </Button>
              </div>
              <ReporteVentas fechaDesde={fechaDesde} fechaHasta={fechaHasta} clienteId={clienteId || undefined} />
            </Card>
          )}

          {tipoReporte === 'metricas' && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Métricas Operativas</h2>
                <Button variant="secondary" size="sm" onClick={() => setTipoReporte(null)}>
                  ✕ Cerrar
                </Button>
              </div>
              <ReporteMetricas fechaDesde={fechaDesde} fechaHasta={fechaHasta} clienteId={clienteId || undefined} />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// Componente de Reporte de Ventas
function ReporteVentas({ fechaDesde, fechaHasta, clienteId }: { fechaDesde: string; fechaHasta: string; clienteId?: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    cargarDatos()
  }, [fechaDesde, fechaHasta, clienteId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      let url = `/api/reportes/ventas?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      if (clienteId) {
        url += `&clienteId=${clienteId}`
      }
      console.log('[ReporteVentas] Cargando datos desde:', url)
      const response = await fetch(url)
      if (response.ok) {
        const reporteData = await response.json()
        console.log('[ReporteVentas] Datos recibidos:', reporteData)
        setData(reporteData)
      } else {
        const errorData = await response.json()
        console.error('[ReporteVentas] Error en respuesta:', errorData)
        toast.error(`Error al cargar el reporte: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error)
      toast.error('Error al cargar el reporte. Revisá la consola para más detalles.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando reporte...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Error al cargar el reporte</div>
  }

  // Mensaje informativo si no hay datos
  const noHayDatos = data.resumen.cantidadOTs === 0

  return (
    <div>
      {/* Información del filtro aplicado */}
      {data.clienteFiltro && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Filtro aplicado:</strong> Cliente: {data.clienteFiltro.nombre} ({data.clienteFiltro.tipo})
          </p>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {noHayDatos && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ No se encontraron datos para el período seleccionado.</strong>
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            El reporte solo incluye Órdenes de Trabajo que:
          </p>
          <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
            <li>Están en estado <strong>ENTREGADO</strong></li>
            <li>Están <strong>completamente pagadas</strong> (el total de pagos ≥ total de la OT)</li>
            <li>Fueron ingresadas en el rango de fechas seleccionado</li>
          </ul>
          <p className="text-xs text-yellow-700 mt-2">
            Verifica que tengas OTs entregadas y pagadas en el período seleccionado.
          </p>
        </div>
      )}
      
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Ventas</div>
          <div className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(data.resumen.totalVentas)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Cantidad de OTs</div>
          <div className="text-2xl font-bold">{data.resumen.cantidadOTs}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Ticket Promedio</div>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(
              data.resumen.cantidadOTs > 0
                ? data.resumen.totalVentas / data.resumen.cantidadOTs
                : 0
            )}
          </div>
        </Card>
      </div>

      {/* Totales por medio de pago */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Totales por Medio de Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-sm text-gray-600 mb-1">Efectivo</div>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(data.resumen.totalesPorMedioPago.EFECTIVO)}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Transferencia</div>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(data.resumen.totalesPorMedioPago.TRANSFERENCIA)}
            </div>
          </Card>
        </div>
      </div>

      {/* Ranking de servicios */}
      {data.serviciosRanking.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Servicios Más Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.serviciosRanking.map((s: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{s.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {s.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                      }).format(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ranking de extras */}
      {data.extrasRanking.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Extras Más Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Extra
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.extrasRanking.map((e: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{e.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {e.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                      }).format(e.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Reporte de Comisiones
function ReporteComisiones({
  fechaDesde,
  fechaHasta,
  clienteId,
}: {
  fechaDesde: string
  fechaHasta: string
  clienteId?: string
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    cargarDatos()
  }, [fechaDesde, fechaHasta, clienteId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      let url = `/api/reportes/comisiones?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      if (clienteId) {
        url += `&clienteId=${clienteId}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const reporteData = await response.json()
        setData(reporteData)
      }
    } catch (error) {
      console.error('Error al cargar reporte de comisiones:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando reporte...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Error al cargar el reporte</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Reporte de Comisiones</h2>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Pendiente</div>
          <div className="text-xl font-bold text-orange-600">
            {formatCurrency(data.totales.totalPendiente)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{data.totales.pendientes} comisiones</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Liquidadas</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(data.totales.totalLiquidadas)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{data.totales.liquidadas} comisiones</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total General</div>
          <div className="text-xl font-bold">
            {formatCurrency(data.totales.totalPendiente + data.totales.totalLiquidadas)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Comisiones</div>
          <div className="text-xl font-bold">{data.totales.pendientes + data.totales.liquidadas}</div>
        </Card>
      </div>

      {/* Por empleado */}
      {data.porEmpleado.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Resumen por Empleado</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Pendientes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Pendiente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Liquidadas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Liquidadas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.porEmpleado.map((emp: any) => (
                  <tr key={emp.empleado.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {emp.empleado.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {emp.pendientes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                      {formatCurrency(emp.totalPendiente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {emp.liquidadas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(emp.totalLiquidadas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                      {formatCurrency(emp.totalPendiente + emp.totalLiquidadas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de Métricas Operativas
function ReporteMetricas({
  fechaDesde,
  fechaHasta,
  clienteId,
}: {
  fechaDesde: string
  fechaHasta: string
  clienteId?: string
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    cargarDatos()
  }, [fechaDesde, fechaHasta, clienteId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      let url = `/api/reportes/metricas?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      if (clienteId) {
        url += `&clienteId=${clienteId}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const reporteData = await response.json()
        setData(reporteData)
      }
    } catch (error) {
      console.error('Error al cargar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando métricas...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Error al cargar las métricas</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Métricas Operativas</h2>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total OTs</div>
          <div className="text-2xl font-bold">{data.resumen.totalOTs}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Entregadas</div>
          <div className="text-2xl font-bold text-green-600">
            {data.resumen.porEstado.ENTREGADO}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Canceladas</div>
          <div className="text-2xl font-bold text-red-600">
            {data.resumen.porEstado.CANCELADO}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">En Proceso</div>
          <div className="text-2xl font-bold text-yellow-600">
            {data.resumen.porEstado.EN_PROCESO}
          </div>
        </Card>
      </div>

      {/* Tiempos promedio */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Tiempos Promedio (minutos)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-sm text-gray-600 mb-1">En Cola</div>
            <div className="text-xl font-bold">{data.tiemposPromedio.enCola} min</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">En Proceso</div>
            <div className="text-xl font-bold">{data.tiemposPromedio.enProceso} min</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Listo</div>
            <div className="text-xl font-bold">{data.tiemposPromedio.listo} min</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-xl font-bold text-blue-600">{data.tiemposPromedio.total} min</div>
          </Card>
        </div>
      </div>

      {/* Distribución por estado */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Distribución por Estado</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-sm text-gray-600 mb-1">En Cola</div>
            <div className="text-lg font-bold">{data.resumen.porEstado.EN_COLA}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">En Proceso</div>
            <div className="text-lg font-bold">{data.resumen.porEstado.EN_PROCESO}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Listo</div>
            <div className="text-lg font-bold">{data.resumen.porEstado.LISTO}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Entregado</div>
            <div className="text-lg font-bold text-green-600">
              {data.resumen.porEstado.ENTREGADO}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-600 mb-1">Cancelado</div>
            <div className="text-lg font-bold text-red-600">
              {data.resumen.porEstado.CANCELADO}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

