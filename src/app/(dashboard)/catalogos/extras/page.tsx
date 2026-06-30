/**
 * Página: Lista de Extras
 * US-003: ABM de Extras
 * Similar a servicios pero para extras
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Extra } from '@/types'

export default function ExtrasPage() {
  const [extras, setExtras] = useState<Extra[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  useEffect(() => {
    cargarExtras()
  }, [filtroActivo])

  const cargarExtras = async () => {
    try {
      setLoading(true)
      const params = filtroActivo ? `?activo=${filtroActivo}` : ''
      const response = await fetch(`/api/extras${params}`)
      if (response.ok) {
        const data = await response.json()
        setExtras(data)
      }
    } catch (error) {
      console.error('Error al cargar extras:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar este extra?')) {
      return
    }

    try {
      const response = await fetch(`/api/extras/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        cargarExtras()
        toast.success('Extra desactivado')
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'No se pudo desactivar el extra')
      }
    } catch (error) {
      console.error('Error al desactivar extra:', error)
      toast.error('Error al desactivar extra')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Extras</h1>
        <Link href="/catalogos/extras/nuevo">
          <Button variant="primary">Nuevo Extra</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4">
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

        {loading ? (
          <p>Cargando...</p>
        ) : extras.length === 0 ? (
          <p className="text-gray-500">No hay extras registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
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
                {extras.map((extra) => (
                  <tr key={extra.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{extra.nombre}</div>
                      {extra.descripcion && (
                        <div className="text-sm text-gray-500">{extra.descripcion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(extra.precio))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {extra.duracionEstimada ? `${extra.duracionEstimada} min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          extra.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {extra.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/catalogos/extras/${extra.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </Link>
                      {extra.activo && (
                        <button
                          onClick={() => handleDesactivar(extra.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Desactivar
                        </button>
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





