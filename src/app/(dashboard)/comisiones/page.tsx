/**
 * Página principal de Comisiones
 * US-012, US-013: Cálculo y Liquidación de Comisiones
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Comision {
  id: string
  ordenTrabajoId: string
  empleadoId: string
  monto: number
  porcentaje: number
  estado: 'PENDIENTE' | 'LIQUIDADA'
  fechaGeneracion: string
  fechaLiquidacion?: string
  ordenTrabajo: {
    id: string
    patente: string
    nombreCliente?: string
    total: number
    fechaIngreso: string
    servicio: {
      id: string
      nombre: string
    }
  }
  empleado: {
    id: string
    nombre: string
    usuario: string
  }
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'PENDIENTE' | 'LIQUIDADA'>('TODAS')

  useEffect(() => {
    cargarComisiones()
  }, [filtroEstado])

  const cargarComisiones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODAS') {
        params.append('estado', filtroEstado)
      }

      const response = await fetch(`/api/comisiones?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setComisiones(data)
      }
    } catch (error) {
      console.error('Error al cargar comisiones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular resumen
  const totalPendiente = comisiones
    .filter((c) => c.estado === 'PENDIENTE')
    .reduce((sum, c) => sum + c.monto, 0)

  const totalLiquidadas = comisiones
    .filter((c) => c.estado === 'LIQUIDADA')
    .reduce((sum, c) => sum + c.monto, 0)

  // Agrupar por empleado para mostrar resumen
  const porEmpleado = comisiones.reduce((acc, c) => {
    if (!acc[c.empleadoId]) {
      acc[c.empleadoId] = {
        empleado: c.empleado,
        pendiente: 0,
        liquidadas: 0,
      }
    }
    if (c.estado === 'PENDIENTE') {
      acc[c.empleadoId].pendiente += c.monto
    } else {
      acc[c.empleadoId].liquidadas += c.monto
    }
    return acc
  }, {} as Record<string, { empleado: Comision['empleado']; pendiente: number; liquidadas: number }>)

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
          <h1 className="text-2xl font-bold text-gray-900">Comisiones</h1>
          <p className="text-gray-600 mt-1">Gestión de comisiones de empleados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/comisiones/configurar">
            <Button variant="secondary">⚙️ Configurar</Button>
          </Link>
          <Link href="/comisiones/liquidar">
            <Button variant="primary">💰 Liquidar</Button>
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Pendiente</div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPendiente)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Liquidadas</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalLiquidadas)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">Total Comisiones</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPendiente + totalLiquidadas)}</div>
        </Card>
      </div>

      {/* Resumen por empleado */}
      {Object.keys(porEmpleado).length > 0 && (
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">Resumen por Empleado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(porEmpleado).map((item) => (
              <div key={item.empleado.id} className="border rounded-lg p-4">
                <div className="font-semibold text-gray-900">{item.empleado.nombre}</div>
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pendiente:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(item.pendiente)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Liquidadas:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(item.liquidadas)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={filtroEstado === 'TODAS' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFiltroEstado('TODAS')}
          >
            Todas
          </Button>
          <Button
            variant={filtroEstado === 'PENDIENTE' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFiltroEstado('PENDIENTE')}
          >
            Pendientes
          </Button>
          <Button
            variant={filtroEstado === 'LIQUIDADA' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFiltroEstado('LIQUIDADA')}
          >
            Liquidadas
          </Button>
        </div>
      </Card>

      {/* Listado de comisiones */}
      <Card>
        <h2 className="text-lg font-bold mb-4">
          {filtroEstado === 'TODAS'
            ? 'Todas las Comisiones'
            : filtroEstado === 'PENDIENTE'
            ? 'Comisiones Pendientes'
            : 'Comisiones Liquidadas'}
        </h2>
        {comisiones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No hay comisiones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto OT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comisiones.map((comision) => (
                  <tr key={comision.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {comision.empleado.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/tablero/${comision.ordenTrabajoId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {comision.ordenTrabajo.patente}
                      </Link>
                      <div className="text-gray-500 text-xs">
                        {comision.ordenTrabajo.servicio.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comision.ordenTrabajo.nombreCliente || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatCurrency(comision.ordenTrabajo.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {comision.porcentaje.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(comision.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          comision.estado === 'PENDIENTE'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {comision.estado === 'PENDIENTE' ? 'Pendiente' : 'Liquidada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(new Date(comision.fechaGeneracion))}
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




