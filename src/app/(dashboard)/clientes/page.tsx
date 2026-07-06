/**
 * Página: Lista de Clientes
 * ABM de Clientes (Concesionarias y Walk-in)
 * Solo DUEÑO y ENCARGADO pueden acceder
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  const {
    data: clientes = [],
    isLoading: loading,
    error,
  } = useQuery<Cliente[], Error & { status?: number }>({
    queryKey: ['clientes', { tipo: filtroTipo, activo: filtroActivo }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroTipo) params.append('tipo', filtroTipo)
      if (filtroActivo !== null) params.append('activo', filtroActivo)

      const response = await fetch(`/api/clientes?${params.toString()}`)
      if (!response.ok) {
        const err = new Error('Error al cargar clientes') as Error & { status?: number }
        err.status = response.status
        throw err
      }
      const data = await response.json()
      return (data.clientes ?? []) as Cliente[]
    },
  })

  // Manejo de errores de la consulta (403 redirige, resto notifica)
  useEffect(() => {
    if (!error) return
    if (error.status === 403) {
      toast.error('No tenés permisos para gestionar clientes.')
      router.push('/dashboard')
    } else {
      toast.error('Error al cargar clientes')
    }
  }, [error, router])

  const handleDesactivar = async (id: string, nombre: string) => {
    const ok = await confirm({
      title: 'Desactivar cliente',
      description: `El cliente "${nombre}" quedará inactivo.`,
      variant: 'danger',
      confirmText: 'Desactivar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
        toast.success('Cliente desactivado correctamente')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al desactivar cliente')
      }
    } catch (error) {
      console.error('Error al desactivar cliente:', error)
      toast.error('Error al desactivar cliente')
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
      CONCESIONARIA: 'bg-brand/10 text-brand',
      WALK_IN: 'bg-ink/10 text-ink',
    }
    return colors[tipo] || 'bg-ink/10 text-ink'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Clientes</h1>
        <Link href="/clientes/nuevo">
          <Button variant="primary">Nuevo Cliente</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
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
            <label className="block text-sm font-medium text-ink mb-2">
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
          <div className="text-center py-8 text-muted">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-8 text-muted">No hay clientes registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-aqua-line">
              <thead className="bg-aqua-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tarifa / Descuento
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
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className={cliente.activo ? '' : 'opacity-60'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">{cliente.nombre}</div>
                      {cliente.email && (
                        <div className="text-sm text-muted">{cliente.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(cliente.tipo)}`}>
                        {getTipoLabel(cliente.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {cliente.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                      {cliente.usaMontosFijos
                        ? 'Tarifa fija'
                        : cliente.descuentoPorcentaje
                          ? `${cliente.descuentoPorcentaje}%`
                          : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.activo 
                          ? 'bg-ok/15 text-[#0c8f68]' 
                          : 'bg-danger/12 text-danger'
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

