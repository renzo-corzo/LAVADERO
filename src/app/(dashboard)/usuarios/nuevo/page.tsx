/**
 * Página: Crear Usuario
 * US-016: ABM de Usuarios
 * Solo DUEÑO puede acceder
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    confirmPassword: '',
    rol: '' as 'ADMIN' | 'DUENO' | 'ENCARGADO' | 'LAVADOR' | '',
    activo: true,
  })

  const rolOptions = [
    // El rol ADMIN solo lo puede asignar otro ADMIN
    ...(session?.user.role === 'ADMIN' ? [{ value: 'ADMIN', label: 'Admin' }] : []),
    { value: 'DUENO', label: 'Dueño' },
    { value: 'ENCARGADO', label: 'Encargado' },
    { value: 'LAVADOR', label: 'Lavador' },
  ]

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

    if (!formData.password) {
      setError('La contraseña es requerida')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (!formData.rol) {
      setError('El rol es requerido')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          usuario: formData.usuario.trim(),
          password: formData.password,
          rol: formData.rol,
          activo: formData.activo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/usuarios')
      } else {
        setError(data.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error al crear usuario:', error)
      setError('Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Usuario</h1>
        <p className="text-gray-600 mt-1">Complete los datos para crear un nuevo usuario</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
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
              error={error && !formData.nombre ? 'El nombre es requerido' : undefined}
            />

            <Input
              id="usuario"
              label="Usuario (Login) *"
              value={formData.usuario}
              onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
              required
              error={error && !formData.usuario ? 'El usuario es requerido' : undefined}
            />

            <Input
              id="password"
              label="Contraseña *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              error={error && (!formData.password || formData.password.length < 6) ? 'La contraseña debe tener al menos 6 caracteres' : undefined}
            />

            <Input
              id="confirmPassword"
              label="Confirmar Contraseña *"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              error={error && formData.password !== formData.confirmPassword ? 'Las contraseñas no coinciden' : undefined}
            />

            <Select
              id="rol"
              label="Rol *"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
              options={rolOptions}
              placeholder="Seleccionar rol"
              required
              error={error && !formData.rol ? 'El rol es requerido' : undefined}
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
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}





