/**
 * Página: Lista de Usuarios
 * US-016: ABM de Usuarios
 * Solo DUEÑO puede acceder
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

interface Usuario {
  id: string
  nombre: string
  usuario: string
  rol: 'DUENO' | 'ENCARGADO' | 'LAVADOR'
  activo: boolean
  createdAt: string
  updatedAt: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  const {
    data: usuarios = [],
    isLoading: loading,
    error,
  } = useQuery<Usuario[], Error & { status?: number }>({
    queryKey: ['usuarios', { activo: filtroActivo }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filtroActivo !== null) params.append('incluirInactivos', 'true')

      const response = await fetch(`/api/usuarios?${params.toString()}`)
      if (!response.ok) {
        const err = new Error('Error al cargar usuarios') as Error & { status?: number }
        err.status = response.status
        throw err
      }
      const data = (await response.json()) as Usuario[]
      // Filtrar por activo si corresponde
      if (filtroActivo !== null) {
        return data.filter((u) => (filtroActivo === 'true' ? u.activo : !u.activo))
      }
      return data
    },
  })

  // Manejo de errores de la consulta (403 redirige, resto notifica)
  useEffect(() => {
    if (!error) return
    if (error.status === 403) {
      toast.error('No tenés permisos para gestionar usuarios. Solo DUEÑO puede acceder.')
      router.push('/dashboard')
    } else {
      toast.error('Error al cargar usuarios')
    }
  }, [error, router])

  const handleDesactivar = async (id: string, nombre: string) => {
    const ok = await confirm({
      title: 'Desactivar usuario',
      description: `El usuario "${nombre}" quedará inactivo y no podrá iniciar sesión.`,
      variant: 'danger',
      confirmText: 'Desactivar',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['usuarios'] })
        toast.success('Usuario desactivado correctamente')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al desactivar usuario')
      }
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      toast.error('Error al desactivar usuario')
    }
  }

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      DUENO: 'Dueño',
      ENCARGADO: 'Encargado',
      LAVADOR: 'Lavador',
    }
    return labels[rol] || rol
  }

  const getRolColor = (rol: string) => {
    const colors: Record<string, string> = {
      DUENO: 'bg-brand/12 text-brand',
      ENCARGADO: 'bg-warn/15 text-[#b9791a]',
      LAVADOR: 'bg-ok/15 text-[#0c8f68]',
    }
    return colors[rol] || 'bg-ink/10 text-ink'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
        <Link href="/usuarios/nuevo">
          <Button variant="primary">Nuevo Usuario</Button>
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
          <div className="text-center py-8 text-muted">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8 text-muted">No hay usuarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-aqua-line">
              <thead className="bg-aqua-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-aqua-line">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className={!usuario.activo ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">{usuario.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted">{usuario.usuario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                        {getRolLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.activo ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-ok/15 text-[#0c8f68]">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger/12 text-danger">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(usuario.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/usuarios/${usuario.id}`}>
                          <Button variant="secondary" size="sm">
                            Editar
                          </Button>
                        </Link>
                        {usuario.activo && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDesactivar(usuario.id, usuario.nombre)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
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





