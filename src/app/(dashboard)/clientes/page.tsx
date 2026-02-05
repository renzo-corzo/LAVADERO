/**
 * Página: Lista de Clientes
 * ABM de Clientes (Concesionarias y Walk-in)
 * Solo DUEÑO y ENCARGADO pueden acceder
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  useEffect(() => {
    cargarClientes()
  }, [filtroTipo, filtroActivo])

  const cargarClientes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroTipo) {
        params.append('tipo', filtroTipo)
      }
      if (filtroActivo !== null) {
        params.append('activo', filtroActivo)
      }
      const response = await fetch(`/api/clientes?${params.toString()}`)
      
      if (response.status === 403) {
        alert('No tienes permisos para gestionar clientes.')
        router.push('/dashboard')
        return
      }

      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      alert('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDesactivar = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de desactivar al cliente "${nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        cargarClientes()
        alert('Cliente desactivado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al desactivar cliente')
      }
    } catch (error) {
      console.error('Error al desactivar cliente:', error)
      alert('Error al desactivar cliente')
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CONCESIONARIA: '🏢 Concesionaria',
      WALK_IN: '👤 Walk-in',
    }
    return labels[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      CONCESIONARIA: 'bg-blue-100 text-blue-800',
      WALK_IN: 'bg-gray-100 text-gray-800',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link href="/clientes/nuevo">
          <Button variant="primary">Nuevo Cliente</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por tipo:
            </label>
            <div className="flex space-x-2">
              <Button
                variant={filtroTipo === null ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroTipo(null)}
              >
                Todos
              </Button>
              <Button
                variant={filtroTipo === 'CONCESIONARIA' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroTipo('CONCESIONARIA')}
              >
                Concesionarias
              </Button>
              <Button
                variant={filtroTipo === 'WALK_IN' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroTipo('WALK_IN')}
              >
                Walk-in
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por estado:
            </label>
            <div className="flex space-x-2">
              <Button
                variant={filtroActivo === null ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroActivo(null)}
              >
                Todos
              </Button>
              <Button
                variant={filtroActivo === 'true' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroActivo('true')}
              >
                Activos
              </Button>
              <Button
                variant={filtroActivo === 'false' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFiltroActivo('false')}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay clientes registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarifa / Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className={cliente.activo ? '' : 'opacity-60'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                      {cliente.email && (
                        <div className="text-sm text-gray-500">{cliente.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(cliente.tipo)}`}>
                        {getTipoLabel(cliente.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.usaMontosFijos
                        ? 'Tarifa fija'
                        : cliente.descuentoPorcentaje
                          ? `${cliente.descuentoPorcentaje}%`
                          : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/clientes/${cliente.id}`}>
                        <Button variant="secondary" size="sm" className="mr-2">
                          Editar
                        </Button>
                      </Link>
                      {cliente.activo && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDesactivar(cliente.id, cliente.nombre)}
                        >
                          Desactivar
                        </Button>
                      )}
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

