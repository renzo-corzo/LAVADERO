/**
 * Página: Empresas (plataforma — solo ADMIN)
 * Crear empresas con sus sucursales y su dueño, renombrar, activar/desactivar
 * y elegir la empresa "en contexto" para operar como si fuera de esa empresa.
 */

'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface EmpresaResumen {
  id: string
  nombre: string
  activo: boolean
  sucursales: { id: string; nombre: string; activo: boolean }[]
  duenos: { id: string; nombre: string; usuario: string; activo: boolean }[]
  totalOTs: number
  totalUsuarios: number
}

const COOKIE_CONTEXTO = 'empresa-contexto'

function leerContexto(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)empresa-contexto=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function escribirContexto(empresaId: string | null) {
  if (empresaId) {
    document.cookie = `${COOKIE_CONTEXTO}=${encodeURIComponent(empresaId)}; path=/; max-age=${60 * 60 * 8}`
  } else {
    document.cookie = `${COOKIE_CONTEXTO}=; path=/; max-age=0`
  }
}

export default function EmpresasPage() {
  const queryClient = useQueryClient()

  // Wizard de creación
  const [nombre, setNombre] = useState('')
  const [sucursales, setSucursales] = useState<string[]>([''])
  const [duenoNombre, setDuenoNombre] = useState('')
  const [duenoUsuario, setDuenoUsuario] = useState('')
  const [duenoPassword, setDuenoPassword] = useState('')
  const [creando, setCreando] = useState(false)

  // Edición de nombre
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')

  const [contexto, setContexto] = useState<string | null>(leerContexto)

  const { data: empresas = [], isLoading } = useQuery<EmpresaResumen[]>({
    queryKey: ['empresas-admin'],
    queryFn: async () => {
      const res = await fetch('/api/empresas')
      if (!res.ok) throw new Error('Error al cargar empresas')
      return (await res.json()) as EmpresaResumen[]
    },
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['empresas-admin'] })
  }

  const cambiarContexto = (empresaId: string | null, nombreEmpresa?: string) => {
    escribirContexto(empresaId)
    setContexto(empresaId)
    // Todo lo cacheado era de otra empresa: invalidar todo
    queryClient.invalidateQueries()
    if (empresaId) {
      toast.success(`Trabajando en contexto de "${nombreEmpresa}"`)
    } else {
      toast.success('Contexto de empresa quitado (vista global)')
    }
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombresSucursales = sucursales.map((s) => s.trim()).filter(Boolean)
    if (!nombre.trim() || nombresSucursales.length === 0 || !duenoNombre.trim() || !duenoUsuario.trim() || !duenoPassword) {
      toast.error('Completá el nombre, al menos una sucursal y los datos del dueño')
      return
    }
    try {
      setCreando(true)
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          sucursales: nombresSucursales,
          dueno: {
            nombre: duenoNombre.trim(),
            usuario: duenoUsuario.trim(),
            password: duenoPassword,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Empresa "${data.nombre}" creada con ${data.sucursales.length} sucursal(es) y su dueño`)
        setNombre('')
        setSucursales([''])
        setDuenoNombre('')
        setDuenoUsuario('')
        setDuenoPassword('')
        invalidar()
      } else {
        toast.error(data.error || 'No se pudo crear la empresa')
      }
    } catch {
      toast.error('No se pudo crear la empresa')
    } finally {
      setCreando(false)
    }
  }

  const guardarEdicion = async (empresa: EmpresaResumen, cambios?: { nombre?: string; activo?: boolean }) => {
    try {
      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cambios?.nombre ?? editNombre ?? empresa.nombre,
          activo: cambios?.activo ?? empresa.activo,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Empresa actualizada')
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Empresas</h1>
        <p className="text-muted mt-1">
          Panel de plataforma: creá cada empresa con sus sucursales y su dueño. Los datos de cada
          empresa quedan totalmente aislados del resto.
        </p>
      </div>

      <Card className="mb-6" title="Nueva empresa">
        <form onSubmit={handleCrear} className="space-y-5">
          <Input
            label="Nombre de la empresa *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: New Cars"
          />

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Sucursales *</label>
            <div className="space-y-2">
              {sucursales.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={s}
                    onChange={(e) => {
                      const next = [...sucursales]
                      next[i] = e.target.value
                      setSucursales(next)
                    }}
                    placeholder={`Ej: Sucursal ${i === 0 ? 'Centro' : 'Norte'}`}
                  />
                  {sucursales.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSucursales(sucursales.filter((_, j) => j !== i))}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => setSucursales([...sucursales, ''])}
            >
              + Agregar sucursal
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Dueño *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nombre"
                value={duenoNombre}
                onChange={(e) => setDuenoNombre(e.target.value)}
                placeholder="Ej: Ariel"
              />
              <Input
                label="Usuario"
                value={duenoUsuario}
                onChange={(e) => setDuenoUsuario(e.target.value)}
                placeholder="Ej: ariel"
              />
              <Input
                label="Contraseña"
                type="password"
                value={duenoPassword}
                onChange={(e) => setDuenoPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={creando}>
            {creando ? 'Creando…' : 'Crear empresa completa'}
          </Button>
        </form>
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-muted text-center py-6">Cargando empresas…</p>
        ) : empresas.length === 0 ? (
          <p className="text-muted text-center py-6">Todavía no hay empresas creadas.</p>
        ) : (
          <div className="divide-y divide-aqua-line">
            {empresas.map((e) => (
              <div key={e.id} className="py-4 first:pt-0 last:pb-0">
                {editandoId === e.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                    <Input
                      label="Nombre"
                      value={editNombre}
                      onChange={(ev) => setEditNombre(ev.target.value)}
                    />
                    <Button size="sm" variant="primary" onClick={() => guardarEdicion(e)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink flex items-center gap-2 flex-wrap">
                        {e.nombre}
                        {!e.activo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-danger/12 text-danger">
                            Inactiva
                          </span>
                        )}
                        {contexto === e.id && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-teal/12 text-brand-teal">
                            En contexto
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted mt-1">
                        🏬 {e.sucursales.map((s) => s.nombre).join(', ') || 'Sin sucursales'}
                      </div>
                      <div className="text-sm text-muted">
                        👤 Dueño: {e.duenos.map((d) => `${d.nombre} (${d.usuario})`).join(', ') || '—'}
                        {' · '}
                        {e.totalUsuarios} usuario(s) · {e.totalOTs} OT(s)
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {contexto === e.id ? (
                        <Button size="sm" variant="primary" onClick={() => cambiarContexto(null)}>
                          Salir del contexto
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => cambiarContexto(e.id, e.nombre)}
                          disabled={!e.activo}
                        >
                          Operar esta empresa
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditandoId(e.id)
                          setEditNombre(e.nombre)
                        }}
                      >
                        Renombrar
                      </Button>
                      <Button
                        size="sm"
                        variant={e.activo ? 'outline' : 'primary'}
                        onClick={() => guardarEdicion(e, { nombre: e.nombre, activo: !e.activo })}
                      >
                        {e.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-sm text-muted mt-4">
        💡 “Operar esta empresa” hace que Usuarios, Sucursales y Reportes muestren los datos de
        esa empresa mientras navegás como ADMIN. La operación diaria (tablero, OTs, caja) es de
        cada dueño.
      </p>
    </div>
  )
}
