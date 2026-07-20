/**
 * Página: Lista de Servicios
 * US-002: ABM de Servicios
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import { useSucursales } from '@/lib/hooks/useSucursales'
import type { Servicio } from '@/types'

type ServicioConSucursal = Servicio & {
  sucursalId?: string | null
  sucursal?: { id: string; nombre: string } | null
}

export default function ServiciosPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)
  // Filtro por sucursal: muestra lo que se ofrece en esa sede (propio + compartido)
  const { sucursales, puedeElegir } = useSucursales()
  const [filtroSucursal, setFiltroSucursal] = useState<string>('')

  const {
    data: servicios = [],
    isLoading: loading,
  } = useQuery<ServicioConSucursal[]>({
    queryKey: ['servicios', { activo: filtroActivo, sucursal: filtroSucursal }],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (filtroActivo) qs.set('activo', filtroActivo)
      if (filtroSucursal) qs.set('sucursalId', filtroSucursal)
      const params = qs.toString() ? `?${qs}` : ''
      const response = await fetch(`/api/servicios${params}`)
      if (!response.ok) throw new Error('Error al cargar servicios')
      return (await response.json()) as ServicioConSucursal[]
    },
  })

  const handleDesactivar = async (id: string) => {
    const ok = await confirm({
      title: 'Desactivar servicio',
      description: 'El servicio dejará de estar disponible para nuevas OTs.',
      variant: 'danger',
      confirmText: 'Desactivar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/servicios/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['servicios'] })
        toast.success('Servicio desactivado')
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'No se pudo desactivar el servicio')
      }
    } catch (error) {
      console.error('Error al desactivar servicio:', error)
      toast.error('Error al desactivar servicio')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Servicios</h1>
        <Link href="/catalogos/servicios/nuevo">
          <Button variant="primary">Nuevo Servicio</Button>
        </Link>
      </div>

      <Card>
        {puedeElegir && (
          <div className="mb-4 max-w-xs">
            <Select
              label="Sucursal"
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              options={[
                { value: '', label: 'Todas (catálogo completo)' },
                ...sucursales.map((s) => ({ value: s.id, label: `Se ofrece en ${s.nombre}` })),
              ]}
            />
          </div>
        )}
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
        ) : servicios.length === 0 ? (
          <p className="text-muted">No hay servicios registrados</p>
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
                    Tipo Vehículo
                  </th>
                  {puedeElegir && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Sucursal
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-aqua-line">
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">{servicio.nombre}</div>
                      {servicio.descripcion && (
                        <div className="text-sm text-muted">{servicio.descripcion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {formatCurrency(Number(servicio.precio))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {servicio.duracionEstimada ? `${servicio.duracionEstimada} min` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {servicio.tipoVehiculo || '-'}
                    </td>
                    {puedeElegir && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {servicio.sucursal ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand/12 text-brand">
                            {servicio.sucursal.nombre}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-ink/8 text-muted">
                            Todas
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          servicio.activo
                            ? 'bg-ok/15 text-[#0c8f68]'
                            : 'bg-ink/10 text-ink'
                        }`}
                      >
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/catalogos/servicios/${servicio.id}`}
                        className="text-brand hover:text-brand-dark mr-4"
                      >
                        Editar
                      </Link>
                      {servicio.activo && (
                        <button
                          onClick={() => handleDesactivar(servicio.id)}
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





