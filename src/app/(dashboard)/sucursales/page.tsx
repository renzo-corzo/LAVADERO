/**
 * Página: Sucursales (ABM)
 * Solo DUEÑO/ADMIN. Permite crear, renombrar y activar/desactivar sucursales.
 */

'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface Sucursal {
  id: string
  nombre: string
  direccion?: string | null
  activo: boolean
}

export default function SucursalesPage() {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editDireccion, setEditDireccion] = useState('')

  const { data: sucursales = [], isLoading } = useQuery<Sucursal[]>({
    queryKey: ['sucursales-admin'],
    queryFn: async () => {
      const res = await fetch('/api/sucursales?incluirInactivas=true')
      if (!res.ok) throw new Error('Error al cargar sucursales')
      return (await res.json()) as Sucursal[]
    },
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['sucursales-admin'] })
    queryClient.invalidateQueries({ queryKey: ['sucursales'] })
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      setCreando(true)
      const res = await fetch('/api/sucursales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), direccion: direccion.trim() || null }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sucursal "${data.nombre}" creada`)
        setNombre('')
        setDireccion('')
        invalidar()
      } else {
        toast.error(data.error || 'No se pudo crear la sucursal')
      }
    } catch {
      toast.error('No se pudo crear la sucursal')
    } finally {
      setCreando(false)
    }
  }

  const guardarEdicion = async (s: Sucursal, cambios?: Partial<Sucursal>) => {
    try {
      const res = await fetch(`/api/sucursales/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cambios?.nombre ?? editNombre ?? s.nombre,
          direccion: cambios?.direccion ?? editDireccion ?? s.direccion ?? null,
          activo: cambios?.activo ?? s.activo,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Sucursal actualizada')
        setEditandoId(null)
        invalidar()
      } else {
        toast.error(data.error || 'No se pudo actualizar')
      }
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Sucursales</h1>
        <p className="text-muted mt-1">
          Cada sucursal tiene sus propios horarios, tablero y cierre de caja.
        </p>
      </div>

      <Card className="mb-6" title="Nueva sucursal">
        <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Input
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Sucursal Centro"
          />
          <Input
            label="Dirección (opcional)"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Av. Colón 1234"
          />
          <Button type="submit" variant="primary" disabled={creando}>
            {creando ? 'Creando…' : 'Crear'}
          </Button>
        </form>
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-muted text-center py-6">Cargando sucursales…</p>
        ) : (
          <div className="divide-y divide-aqua-line">
            {sucursales.map((s) => (
              <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                {editandoId === s.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                    <Input
                      label="Nombre"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                    />
                    <Input
                      label="Dirección"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                    />
                    <Button size="sm" variant="primary" onClick={() => guardarEdicion(s)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold text-ink flex items-center gap-2">
                        {s.nombre}
                        {!s.activo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-danger/12 text-danger">
                            Inactiva
                          </span>
                        )}
                      </div>
                      {s.direccion && <div className="text-sm text-muted">{s.direccion}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditandoId(s.id)
                          setEditNombre(s.nombre)
                          setEditDireccion(s.direccion || '')
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={s.activo ? 'outline' : 'primary'}
                        onClick={() =>
                          guardarEdicion(s, {
                            nombre: s.nombre,
                            direccion: s.direccion ?? undefined,
                            activo: !s.activo,
                          })
                        }
                      >
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
