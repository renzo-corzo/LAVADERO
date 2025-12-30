/**
 * Página: Editar Usuario
 * US-016: ABM de Usuarios
 * Solo DUEÑO puede acceder
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Usuario {
  id: string
  nombre: string
  usuario: string
  rol: 'DUENO' | 'ENCARGADO' | 'LAVADOR'
  activo: boolean
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    rol: '' as 'DUENO' | 'ENCARGADO' | 'LAVADOR' | '',
    activo: true,
  })

  const [passwordData, setPasswordData] = useState({
    nuevaPassword: '',
    confirmPassword: '',
  })

  const rolOptions = [
    { value: 'DUENO', label: 'Dueño' },
    { value: 'ENCARGADO', label: 'Encargado' },
    { value: 'LAVADOR', label: 'Lavador' },
  ]

  useEffect(() => {
    cargarUsuario()
  }, [id])

  const cargarUsuario = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/usuarios/${id}`)
      
      if (response.status === 403) {
        alert('No tienes permisos para editar usuarios. Solo DUEÑO puede acceder.')
        router.push('/usuarios')
        return
      }

      if (response.ok) {
        const data: Usuario = await response.json()
        setFormData({
          nombre: data.nombre,
          usuario: data.usuario,
          rol: data.rol,
          activo: data.activo,
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cargar usuario')
        router.push('/usuarios')
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error)
      alert('Error al cargar usuario')
      router.push('/usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.usuario.trim()) {
      setError('El usuario es requerido')
      return
    }

    if (!formData.rol) {
      setError('El rol es requerido')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          usuario: formData.usuario.trim(),
          rol: formData.rol,
          activo: formData.activo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/usuarios')
      } else {
        setError(data.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      setError('Error al actualizar usuario')
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordData.nuevaPassword) {
      setError('La nueva contraseña es requerida')
      return
    }

    if (passwordData.nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (passwordData.nuevaPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/usuarios/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevaPassword: passwordData.nuevaPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Contraseña actualizada correctamente')
        setMostrarCambiarPassword(false)
        setPasswordData({ nuevaPassword: '', confirmPassword: '' })
      } else {
        setError(data.error || 'Error al cambiar contraseña')
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      setError('Error al cambiar contraseña')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Cargando usuario...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
        <p className="text-gray-600 mt-1">Modifique los datos del usuario</p>
      </div>

      <div className="space-y-6">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !mostrarCambiarPassword && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="nombre"
                label="Nombre Completo *"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />

              <Input
                id="usuario"
                label="Usuario (Login) *"
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
                required
              />

              <Select
                id="rol"
                label="Rol *"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                options={rolOptions}
                placeholder="Seleccionar rol"
                required
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h2>
              <p className="text-sm text-gray-600 mt-1">Establecer una nueva contraseña para este usuario</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMostrarCambiarPassword(!mostrarCambiarPassword)
                setPasswordData({ nuevaPassword: '', confirmPassword: '' })
                setError(null)
              }}
            >
              {mostrarCambiarPassword ? 'Cancelar' : 'Cambiar Contraseña'}
            </Button>
          </div>

          {mostrarCambiarPassword && (
            <form onSubmit={handleCambiarPassword} className="space-y-4 pt-4 border-t">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="nuevaPassword"
                  label="Nueva Contraseña *"
                  type="password"
                  value={passwordData.nuevaPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, nuevaPassword: e.target.value })}
                  required
                  minLength={6}
                />

                <Input
                  id="confirmPassword"
                  label="Confirmar Contraseña *"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

