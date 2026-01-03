/**
 * Página: Crear Cliente
 * ABM de Clientes
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'WALK_IN' as 'CONCESIONARIA' | 'WALK_IN',
    telefono: '',
    email: '',
    descuentoPorcentaje: '',
    observaciones: '',
  })

  const tipoOptions = [
    { value: 'CONCESIONARIA', label: '🏢 Concesionaria' },
    { value: 'WALK_IN', label: '👤 Walk-in' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!formData.tipo) {
      setError('El tipo es requerido')
      return
    }

    // Validar descuento si está presente
    if (formData.descuentoPorcentaje && (isNaN(Number(formData.descuentoPorcentaje)) || Number(formData.descuentoPorcentaje) < 0 || Number(formData.descuentoPorcentaje) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100')
      return
    }


    try {
      setLoading(true)
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          telefono: formData.telefono.trim() || null,
          email: formData.email.trim() || null,
          descuentoPorcentaje: formData.descuentoPorcentaje ? Number(formData.descuentoPorcentaje) : null,
          prioridad: 0, // Por ahora sin prioridad
          observaciones: formData.observaciones.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/clientes')
      } else {
        setError(data.error || 'Error al crear cliente')
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      setError('Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
        <p className="text-gray-600 mt-1">Complete los datos para crear un nuevo cliente</p>
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
              label="Nombre *"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              error={error && !formData.nombre ? 'El nombre es requerido' : undefined}
            />

            <Select
              id="tipo"
              label="Tipo de Cliente *"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'CONCESIONARIA' | 'WALK_IN' })}
              options={tipoOptions}
              required
            />

            <Input
              id="telefono"
              label="Teléfono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej: +54 9 11 1234-5678"
            />

            <Input
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ej: cliente@ejemplo.com"
            />

            <Input
              id="descuentoPorcentaje"
              label="Descuento (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.descuentoPorcentaje}
              onChange={(e) => setFormData({ ...formData, descuentoPorcentaje: e.target.value })}
              placeholder="Ej: 10 para 10% de descuento"
            />

          </div>

          <Textarea
            id="observaciones"
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
            placeholder="Notas adicionales sobre el cliente..."
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

