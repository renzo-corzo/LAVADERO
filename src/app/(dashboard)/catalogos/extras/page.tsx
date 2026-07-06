/**
 * Página: Lista de Extras
 * US-003: ABM de Extras
 * Similar a servicios pero para extras
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Extra } from '@/types'

export default function ExtrasPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  const {
    data: extras = [],
    isLoading: loading,
  } = useQuery<Extra[]>({
    queryKey: ['extras', { activo: filtroActivo }],
    queryFn: async () => {
      const params = filtroActivo ? `?activo=${filtroActivo}` : ''
      const response = await fetch(`/api/extras${params}`)
      if (!response.ok) throw new Error('Error al cargar extras')
      return (await response.json()) as Extra[]
    },
  })

  const handleDesactivar = async (id: string) => {
    const ok = await confirm({
      title: 'Desactivar extra',
      description: 'El extra dejará de estar disponible para nuevas OTs.',
      variant: 'danger',
      confirmText: 'Desactivar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/extras/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['extras'] })
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
        <h1 className="text-2xl font-bold text-ink">Extras</h1>
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
          <p className="text-muted">No hay extras registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-aqua-line">
              <thead className="bg-aqua-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-aqua-line">
                {extras.map((extra) => (
                  <tr key={extra.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">{extra.nombre}</div>
                      {extra.descripcion && (
                        <div className="text-sm text-muted">{extra.descripcion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {formatCurrency(Number(extra.precio))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {extra.duracionEstimada ? `${extra.duracionEstimada} min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          extra.activo
                            ? 'bg-ok/15 text-[#0c8f68]'
                            : 'bg-ink/10 text-ink'
                        }`}
                      >
                        {extra.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/catalogos/extras/${extra.id}`}
                        className="text-brand hover:text-brand-dark mr-4"
                      >
                        Editar
                      </Link>
                      {extra.activo && (
                        <button
                          onClick={() => handleDesactivar(extra.id)}
                          className="text-danger hover:text-danger"
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





