/**
 * Página de Configuración de Comisiones
 * US-011: Configuración de Comisiones
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Usuario {
  id: string
  nombre: string
  usuario: string
  rol: string
}

interface ConfigComision {
  id?: string
  empleadoId: string
  empleado?: Usuario
  modelo: 'POR_ITEM' | 'POR_OT'
  porcentaje: number
  porcentajePorServicio?: Record<string, number> | null
  activo: boolean
}

export default function ConfigurarComisionesPage() {
  const router = useRouter()
  const [empleados, setEmpleados] = useState<Usuario[]>([])
  const [configs, setConfigs] = useState<Record<string, ConfigComision>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      // Cargar empleados (solo LAVADOR)
      const empleadosRes = await fetch('/api/usuarios?rol=LAVADOR')
      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json()
        setEmpleados(empleadosData.filter((u: Usuario) => u.rol === 'LAVADOR'))
      }

      // Cargar configuraciones
      const configsRes = await fetch('/api/comisiones/config')
      if (configsRes.ok) {
        const configsData = await configsRes.json()
        const configsMap: Record<string, ConfigComision> = {}
        configsData.forEach((c: ConfigComision) => {
          configsMap[c.empleadoId] = c
        })
        setConfigs(configsMap)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarConfig = (empleadoId: string, campo: keyof ConfigComision, valor: any) => {
    setConfigs((prev) => ({
      ...prev,
      [empleadoId]: {
        ...prev[empleadoId],
        empleadoId,
        empleado: prev[empleadoId]?.empleado || empleados.find((e) => e.id === empleadoId),
        modelo: prev[empleadoId]?.modelo || 'POR_OT',
        porcentaje: prev[empleadoId]?.porcentaje || 0,
        activo: prev[empleadoId]?.activo !== undefined ? prev[empleadoId].activo : true,
        [campo]: valor,
      },
    }))
  }

  const guardarConfig = async (empleadoId: string) => {
    const config = configs[empleadoId]
    if (!config) return

    if (config.porcentaje < 0 || config.porcentaje > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100')
      return
    }

    try {
      setSaving(empleadoId)
      const response = await fetch('/api/comisiones/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId: config.empleadoId,
          modelo: config.modelo,
          porcentaje: config.porcentaje,
          porcentajePorServicio: config.porcentajePorServicio || null,
          activo: config.activo,
        }),
      })

      if (response.ok) {
        toast.success('Configuración guardada correctamente')
        await cargarDatos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurar Comisiones</h1>
          <p className="text-gray-600 mt-1">
            Define el modelo y porcentaje de comisión para cada empleado
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Volver
        </Button>
      </div>

      {empleados.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <p>No hay empleados (LAVADOR) registrados en el sistema</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {empleados.map((empleado) => {
            const config = configs[empleado.id] || {
              empleadoId: empleado.id,
              empleado,
              modelo: 'POR_OT' as const,
              porcentaje: 0,
              activo: true,
            }

            return (
              <Card key={empleado.id}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empleado
                    </label>
                    <div className="font-medium text-gray-900">{empleado.nombre}</div>
                    <div className="text-sm text-gray-500">{empleado.usuario}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <Select
                      value={config.modelo}
                      onChange={(e) =>
                        actualizarConfig(empleado.id, 'modelo', e.target.value as 'POR_ITEM' | 'POR_OT')
                      }
                      options={[
                        { value: 'POR_OT', label: 'Por OT (sobre total)' },
                        { value: 'POR_ITEM', label: 'Por Ítem (servicio + extras)' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={config.porcentaje}
                      onChange={(e) =>
                        actualizarConfig(empleado.id, 'porcentaje', parseFloat(e.target.value) || 0)
                      }
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {config.modelo === 'POR_OT'
                        ? 'Sobre el total de la OT'
                        : 'Sobre cada ítem (servicio/extras)'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Activo</label>
                      <div className="flex items-center h-10">
                        <input
                          type="checkbox"
                          checked={config.activo}
                          onChange={(e) => actualizarConfig(empleado.id, 'activo', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => guardarConfig(empleado.id)}
                      disabled={saving === empleado.id}
                    >
                      {saving === empleado.id ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="mt-6 bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Información</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Modelo POR_OT:</strong> Calcula la comisión sobre el total de la OT (servicio +
            extras)
          </p>
          <p>
            <strong>Modelo POR_ITEM:</strong> Calcula la comisión por cada ítem (servicio y cada
            extra) por separado
          </p>
          <p>
            <strong>Porcentaje:</strong> El porcentaje a aplicar. Ejemplo: 10% = 10 unidades
          </p>
        </div>
      </Card>
    </div>
  )
}





