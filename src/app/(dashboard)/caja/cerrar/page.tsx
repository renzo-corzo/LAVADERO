/**
 * Página para Crear Cierre de Caja
 * US-010: Cierre de Caja
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default function CerrarCajaPage() {
  const router = useRouter()
  const obtenerFechaLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [fechaDesde, setFechaDesde] = useState(() => {
    return obtenerFechaLocal(new Date())
  })
  const [fechaHasta, setFechaHasta] = useState(() => {
    return obtenerFechaLocal(new Date())
  })
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrandoResumen, setMostrandoResumen] = useState(false)
  const [resumen, setResumen] = useState<any>(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)

  const cargarResumen = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione ambas fechas')
      return
    }

    try {
      setCargandoResumen(true)
      const response = await fetch(
        `/api/cierres/resumen?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      )
      if (response.ok) {
        const data = await response.json()
        setResumen(data)
        setMostrandoResumen(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'No se pudo cargar el resumen')
      }
    } catch (error) {
      console.error('Error al cargar resumen:', error)
      toast.error('Error al cargar el resumen')
    } finally {
      setCargandoResumen(false)
    }
  }

  const handleCerrarCaja = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione ambas fechas')
      return
    }

    if (!resumen || resumen.resumen.totalGeneral === 0) {
      toast.error('No hay pagos en el período seleccionado')
      return
    }

    if (!confirm('¿Confirma el cierre de caja? Este proceso no se puede deshacer.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/cierres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaDesde,
          fechaHasta,
          observaciones: observaciones.trim() || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Cierre de caja creado', {
          description: `Total: ${formatCurrency(data.totalGeneral)}`,
        })
        router.push(`/caja/cierres/${data.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'No se pudo crear el cierre')
      }
    } catch (error) {
      console.error('Error al cerrar caja:', error)
      toast.error('Error al crear el cierre de caja')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/caja" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Volver a Caja
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Cerrar Caja</h1>
        <p className="text-gray-600 mt-1">Seleccione el período a cerrar</p>
      </div>

      {/* Formulario de fechas */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">Período del Cierre</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde *
            </label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta *
            </label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <Button variant="primary" onClick={cargarResumen} disabled={cargandoResumen}>
            {cargandoResumen ? 'Cargando...' : 'Ver Resumen del Período'}
          </Button>
        </div>
      </Card>

      {/* Resumen */}
      {mostrandoResumen && resumen && (
        <>
          <Card className="mb-6">
            <h2 className="text-lg font-bold mb-4">Resumen del Período</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Total Efectivo</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(resumen.resumen.totalEfectivo)}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Total Transferencia</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(resumen.resumen.totalTransferencia)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Total General</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(resumen.resumen.totalGeneral)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Pagos registrados:</span>{' '}
                <span className="font-medium">{resumen.resumen.cantidadPagos}</span>
              </div>
              <div>
                <span className="text-gray-600">OTs cobradas:</span>{' '}
                <span className="font-medium">{resumen.resumen.cantidadOTs}</span>
              </div>
            </div>
          </Card>

          {/* Advertencias */}
          {resumen.advertencias.otsEntregadasSinPago.length > 0 && (
            <Card className="mb-6 border-yellow-300 bg-yellow-50">
              <h3 className="text-md font-bold mb-2 text-yellow-800">
                ⚠️ Advertencia
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                Hay {resumen.advertencias.otsEntregadasSinPago.length} OT(s) entregada(s) sin
                pago registrado en este período:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {resumen.advertencias.otsEntregadasSinPago.slice(0, 5).map((ot: any) => (
                  <li key={ot.id}>
                    {ot.patente || ot.descripcionVehiculo || 'Sin identificación'} -{' '}
                    {formatCurrency(ot.total)}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Lista de OTs cobradas */}
          <Card className="mb-6">
            <h2 className="text-lg font-bold mb-4">Órdenes de Trabajo Cobradas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Identificación
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
                  {resumen.otsCobradas.map((ot: any) => (
                    <tr key={ot.id}>
                      <td className="px-4 py-2 text-sm">
                        {ot.patente || ot.descripcionVehiculo || 'Sin identificación'}
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

          {/* Observaciones y confirmación */}
          <Card>
            <h2 className="text-lg font-bold mb-4">Confirmar Cierre</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones (opcional)
              </label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas o ajustes del cierre..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleCerrarCaja}
                disabled={loading || resumen.resumen.totalGeneral === 0}
              >
                {loading ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
              </Button>
              <Link href="/caja">
                <Button variant="secondary">Cancelar</Button>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

