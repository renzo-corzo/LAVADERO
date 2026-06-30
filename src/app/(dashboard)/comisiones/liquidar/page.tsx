/**
 * Página de Liquidación de Comisiones
 * US-013: Liquidación de Comisiones
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Usuario {
  id: string
  nombre: string
  usuario: string
}

interface Comision {
  id: string
  monto: number
  porcentaje: number
  fechaGeneracion: string
  ordenTrabajo: {
    id: string
    patente: string
    nombreCliente?: string
    total: number
    servicio: {
      nombre: string
    }
  }
}

export default function LiquidarComisionesPage() {
  const router = useRouter()
  const [empleados, setEmpleados] = useState<Usuario[]>([])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [comisionesPendientes, setComisionesPendientes] = useState<Comision[]>([])
  const [loading, setLoading] = useState(false)
  const [liquidando, setLiquidando] = useState(false)

  useEffect(() => {
    cargarEmpleados()
    // Establecer fechas por defecto (último mes)
    const hoy = new Date()
    const haceUnMes = new Date()
    haceUnMes.setMonth(haceUnMes.getMonth() - 1)

    const obtenerFechaLocal = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setFechaDesde(obtenerFechaLocal(haceUnMes))
    setFechaHasta(obtenerFechaLocal(hoy))
  }, [])

  useEffect(() => {
    if (empleadoSeleccionado && fechaDesde && fechaHasta) {
      cargarComisionesPendientes()
    } else {
      setComisionesPendientes([])
    }
  }, [empleadoSeleccionado, fechaDesde, fechaHasta])

  const cargarEmpleados = async () => {
    try {
      const response = await fetch('/api/usuarios?rol=LAVADOR')
      if (response.ok) {
        const data = await response.json()
        setEmpleados(data.filter((u: Usuario & { rol: string }) => u.rol === 'LAVADOR'))
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error)
    }
  }

  const cargarComisionesPendientes = async () => {
    if (!empleadoSeleccionado || !fechaDesde || !fechaHasta) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        empleadoId: empleadoSeleccionado,
        estado: 'PENDIENTE',
        fechaDesde,
        fechaHasta,
      })

      const response = await fetch(`/api/comisiones?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setComisionesPendientes(data)
      }
    } catch (error) {
      console.error('Error al cargar comisiones pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLiquidar = async () => {
    if (!empleadoSeleccionado || !fechaDesde || !fechaHasta) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (comisionesPendientes.length === 0) {
      toast.error('No hay comisiones pendientes para liquidar en el período seleccionado')
      return
    }

    if (!confirm('¿Confirmas la liquidación de estas comisiones? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setLiquidando(true)
      const response = await fetch('/api/comisiones/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId: empleadoSeleccionado,
          fechaDesde,
          fechaHasta,
          // Liquidamos exactamente las comisiones mostradas (el servidor valida que
          // sigan pendientes y pertenezcan al empleado).
          comisionesIds: comisionesPendientes.map((c) => c.id),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Liquidación realizada correctamente', {
          description: `Monto total: ${formatCurrency(data.montoTotal)} · Comisiones: ${data.cantidadComisiones}`,
        })
        router.push('/comisiones')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al liquidar comisiones')
      }
    } catch (error) {
      console.error('Error al liquidar comisiones:', error)
      toast.error('Error al liquidar las comisiones')
    } finally {
      setLiquidando(false)
    }
  }

  const totalPendiente = comisionesPendientes.reduce((sum, c) => sum + c.monto, 0)
  const empleado = empleados.find((e) => e.id === empleadoSeleccionado)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidar Comisiones</h1>
          <p className="text-gray-600 mt-1">
            Selecciona el empleado y período para liquidar comisiones pendientes
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      {/* Formulario de selección */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">Seleccionar Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado *</label>
            <Select
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar empleado' },
                ...empleados.map((e) => ({ value: e.id, label: e.nombre })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde *</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta *</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Resumen */}
      {empleadoSeleccionado && fechaDesde && fechaHasta && (
        <Card className="mb-6 bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Empleado</div>
              <div className="text-lg font-semibold text-gray-900">{empleado?.nombre || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Período</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(fechaDesde).toLocaleDateString('es-AR')} -{' '}
                {new Date(fechaHasta).toLocaleDateString('es-AR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total a Liquidar</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPendiente)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Listado de comisiones pendientes */}
      {loading ? (
        <Card>
          <div className="text-center py-8 text-gray-500">Cargando comisiones...</div>
        </Card>
      ) : comisionesPendientes.length === 0 && empleadoSeleccionado && fechaDesde && fechaHasta ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No hay comisiones pendientes para liquidar</p>
            <p className="text-sm">en el período seleccionado</p>
          </div>
        </Card>
      ) : comisionesPendientes.length > 0 ? (
        <>
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                Comisiones Pendientes ({comisionesPendientes.length})
              </h2>
              <Button
                variant="primary"
                onClick={handleLiquidar}
                disabled={liquidando || comisionesPendientes.length === 0}
              >
                {liquidando ? 'Liquidando...' : `💰 Liquidar ${formatCurrency(totalPendiente)}`}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total OT
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comisionesPendientes.map((comision) => (
                    <tr key={comision.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comision.ordenTrabajo.patente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comision.ordenTrabajo.nombreCliente || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comision.ordenTrabajo.servicio.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(comision.ordenTrabajo.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {comision.porcentaje.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(comision.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(new Date(comision.fechaGeneracion))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                      {formatCurrency(totalPendiente)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}

