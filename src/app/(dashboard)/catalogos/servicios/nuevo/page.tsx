/**
 * Página: Crear Servicio
 * US-002: ABM de Servicios
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'

export default function NuevoServicioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    duracionEstimada: '',
    tipoVehiculo: '',
    descripcion: '',
    activo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a cero'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nombre: formData.nombre.trim(),
          precio: parseFloat(formData.precio),
          duracionEstimada: formData.duracionEstimada ? parseInt(formData.duracionEstimada) : undefined,
          tipoVehiculo: formData.tipoVehiculo || undefined,
          descripcion: formData.descripcion,
        }),
      })

      if (response.ok) {
        router.push('/catalogos/servicios')
      } else {
        const data = await response.json()
        setErrors({ submit: data.error || 'Error al crear servicio' })
      }
    } catch (error) {
      setErrors({ submit: 'Error al crear servicio' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Servicio</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre"
              id="nombre"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              error={errors.nombre}
            />

            <Input
              label="Precio"
              id="precio"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              error={errors.precio}
            />

            <Input
              label="Duración Estimada (minutos)"
              id="duracionEstimada"
              type="number"
              min="0"
              value={formData.duracionEstimada}
              onChange={(e) => setFormData({ ...formData, duracionEstimada: e.target.value })}
            />

            <Select
              label="Tipo de Vehículo"
              id="tipoVehiculo"
              value={formData.tipoVehiculo}
              onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })}
              placeholder="Seleccionar tipo (opcional)"
              options={[
                { value: 'chico', label: 'Chico' },
                { value: 'mediano', label: 'Mediano' },
                { value: 'camioneta', label: 'Camioneta' },
              ]}
            />
          </div>

          <Textarea
            label="Descripción"
            id="descripcion"
            rows={4}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
              Activo
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}





