/**
 * Página: Editar Cliente
 * ABM de Clientes
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { Cliente } from '@/types'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'WALK_IN' as 'CONCESIONARIA' | 'WALK_IN',
    telefono: '',
    email: '',
    descuentoPorcentaje: '',
    observaciones: '',
    activo: true,
  })

  const tipoOptions = [
    { value: 'CONCESIONARIA', label: '🏢 Concesionaria' },
    { value: 'WALK_IN', label: '👤 Walk-in' },
  ]

  useEffect(() => {
    cargarCliente()
  }, [clienteId])

  const cargarCliente = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clientes/${clienteId}`)

      if (response.status === 404) {
        alert('Cliente no encontrado')
        router.push('/clientes')
        return
      }

      if (response.ok) {
        const data = await response.json()
        const clienteData = data.cliente
        setCliente(clienteData)
        setFormData({
          nombre: clienteData.nombre || '',
          tipo: clienteData.tipo || 'WALK_IN',
          telefono: clienteData.telefono || '',
          email: clienteData.email || '',
          descuentoPorcentaje: clienteData.descuentoPorcentaje?.toString() || '',
          observaciones: clienteData.observaciones || '',
          activo: clienteData.activo ?? true,
        })
      } else {
        setError('Error al cargar el cliente')
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error)
      setError('Error al cargar el cliente')
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
      setSaving(true)
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          telefono: formData.telefono.trim() || null,
          email: formData.email.trim() || null,
          descuentoPorcentaje: formData.descuentoPorcentaje ? Number(formData.descuentoPorcentaje) : null,
          prioridad: 0, // Por ahora sin prioridad
          observaciones: formData.observaciones.trim() || null,
          activo: formData.activo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/clientes')
      } else {
        setError(data.error || 'Error al actualizar cliente')
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      setError('Error al actualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="text-center py-8 text-gray-500">Cargando cliente...</div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div>
        <div className="text-center py-8 text-red-500">Cliente no encontrado</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
        <p className="text-gray-600 mt-1">Modifique los datos del cliente</p>
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
              Cliente activo
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
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

