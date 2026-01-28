/**
 * Página: Lista de Usuarios
 * US-016: ABM de Usuarios
 * Solo DUEÑO puede acceder
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null)

  useEffect(() => {
    cargarUsuarios()
  }, [filtroActivo])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroActivo !== null) {
        params.append('incluirInactivos', 'true')
      }
      const response = await fetch(`/api/usuarios?${params.toString()}`)
      
      if (response.status === 403) {
        alert('No tienes permisos para gestionar usuarios. Solo DUEÑO puede acceder.')
        router.push('/dashboard')
        return
      }

      if (response.ok) {
        let data = await response.json()
        
        // Filtrar por activo si corresponde
        if (filtroActivo !== null) {
          data = data.filter((u: Usuario) => 
            filtroActivo === 'true' ? u.activo : !u.activo
          )
        }
        
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      alert('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleDesactivar = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de desactivar al usuario "${nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        cargarUsuarios()
        alert('Usuario desactivado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al desactivar usuario')
      }
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      alert('Error al desactivar usuario')
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
      DUENO: 'bg-purple-100 text-purple-800',
      ENCARGADO: 'bg-blue-100 text-blue-800',
      LAVADOR: 'bg-green-100 text-green-800',
    }
    return colors[rol] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
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
          <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay usuarios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className={!usuario.activo ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{usuario.usuario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                        {getRolLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usuario.activo ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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





