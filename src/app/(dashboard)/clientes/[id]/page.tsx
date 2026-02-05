/**
 * Página: Editar Cliente
 * ABM de Clientes
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { formatCurrency } from '@/lib/utils'
import type { Cliente, Extra, Servicio } from '@/types'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)

  const [loadingCatalogos, setLoadingCatalogos] = useState(true)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalCreds, setPortalCreds] = useState<{ usuario: string; password: string } | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [portalInfoLoading, setPortalInfoLoading] = useState(false)
  const [portalInfo, setPortalInfo] = useState<{ portalUser?: { usuario: string } | null; sugerido?: string } | null>(
    null
  )
  const [portalForm, setPortalForm] = useState({
    usuario: '',
    password: '',
    resetPassword: true,
  })

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'WALK_IN' as 'CONCESIONARIA' | 'WALK_IN',
    telefono: '',
    email: '',
    descuentoPorcentaje: '',
    trabajoExterno: false,
    usaMontosFijos: false,
    montosFijosServicios: {} as Record<string, number>,
    montosFijosExtras: {} as Record<string, number>,
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

  const cargarCatalogos = async () => {
    try {
      setLoadingCatalogos(true)
      const response = await fetch('/api/catalogos/activos')
      if (response.ok) {
        const data = await response.json()
        setServicios(data.servicios || [])
        setExtras(data.extras || [])
      }
    } catch (e) {
      console.error('Error al cargar catálogos:', e)
    } finally {
      setLoadingCatalogos(false)
    }
  }

  useEffect(() => {
    cargarCatalogos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarPortalInfo = async () => {
    try {
      setPortalInfoLoading(true)
      const res = await fetch(`/api/clientes/${clienteId}/portal-usuario`)
      const json = await res.json()
      if (!res.ok) return
      setPortalInfo(json)
      const usuarioSugerido = (json?.portalUser?.usuario || json?.sugerido || '') as string
      setPortalForm((prev) => ({ ...prev, usuario: prev.usuario || usuarioSugerido }))
    } catch (e) {
      // silencioso
    } finally {
      setPortalInfoLoading(false)
    }
  }

  const upsertPortalUser = async () => {
    try {
      setPortalLoading(true)
      setPortalError(null)
      setPortalCreds(null)

      const res = await fetch(`/api/clientes/${clienteId}/portal-usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: portalForm.usuario?.trim() || undefined,
          password: portalForm.password?.trim() || undefined,
          resetPassword: portalForm.resetPassword,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setPortalError(json?.error || 'Error al generar acceso portal')
        return { ok: false as const, json }
      }
      setPortalCreds(json?.credentials || null)
      // refrescar info (usuario actual)
      cargarPortalInfo()
      return { ok: true as const, json }
    } catch (e) {
      setPortalError('Error al generar acceso portal')
      return { ok: false as const, json: null }
    } finally {
      setPortalLoading(false)
    }
  }

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
          trabajoExterno: Boolean(clienteData.trabajoExterno),
          usaMontosFijos: Boolean(clienteData.usaMontosFijos),
          montosFijosServicios: (clienteData.montosFijosServicios as Record<string, number> | null) || {},
          montosFijosExtras: (clienteData.montosFijosExtras as Record<string, number> | null) || {},
          observaciones: clienteData.observaciones || '',
          activo: clienteData.activo ?? true,
        })
        // Cargar info portal cuando ya sabemos que existe el cliente
        cargarPortalInfo()
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

    // Si el usuario completó credenciales del portal, aplicarlas al guardar (para evitar confusión)
    const portalUsuarioTrim = portalForm.usuario.trim()
    const portalPasswordTrim = portalForm.password.trim()
    const usuarioActualPortal = portalInfo?.portalUser?.usuario || ''
    const quiereCambiarUsuario = portalUsuarioTrim && portalUsuarioTrim !== usuarioActualPortal
    const quiereCambiarPassword = Boolean(portalPasswordTrim)
    const noExistePortal = !portalInfo?.portalUser?.usuario

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
    if (!formData.usaMontosFijos && formData.descuentoPorcentaje && (isNaN(Number(formData.descuentoPorcentaje)) || Number(formData.descuentoPorcentaje) < 0 || Number(formData.descuentoPorcentaje) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100')
      return
    }

    // Si es concesionaria y se completó algo de portal, aplicar primero el portal user
    if (formData.tipo === 'CONCESIONARIA' && (noExistePortal || quiereCambiarUsuario || quiereCambiarPassword)) {
      if (!portalUsuarioTrim) {
        setError('Para generar el acceso al portal, completá el usuario portal.')
        return
      }
      const resPortal = await upsertPortalUser()
      if (!resPortal.ok) {
        // El error ya queda mostrado en portalError, pero también lo reflejamos arriba
        setError((resPortal.json as any)?.error || 'No se pudo generar el acceso al portal')
        return
      }
      // Si la contraseña fue autogenerada (campo vacío), mostrarla antes de salir
      if (!portalPasswordTrim) {
        const creds = (resPortal.json as any)?.credentials
        if (creds?.usuario && creds?.password) {
          alert(`Credenciales portal:\nUsuario: ${creds.usuario}\nContraseña: ${creds.password}\n\nGuardalas ahora: no se vuelven a mostrar.`)
        }
      }
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
          descuentoPorcentaje: formData.usaMontosFijos
            ? null
            : formData.descuentoPorcentaje
              ? Number(formData.descuentoPorcentaje)
              : null,
          trabajoExterno: Boolean(formData.trabajoExterno),
          usaMontosFijos: formData.usaMontosFijos,
          montosFijosServicios: formData.usaMontosFijos ? formData.montosFijosServicios : null,
          montosFijosExtras: formData.usaMontosFijos ? formData.montosFijosExtras : null,
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
              disabled={formData.usaMontosFijos}
            />

          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="usaMontosFijos"
              checked={formData.usaMontosFijos}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  usaMontosFijos: e.target.checked,
                  descuentoPorcentaje: e.target.checked ? '' : prev.descuentoPorcentaje,
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="usaMontosFijos" className="ml-2 block text-sm text-gray-900">
              Usar montos fijos por cliente (sin descuentos)
            </label>
          </div>

          {formData.tipo === 'CONCESIONARIA' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="trabajoExterno"
                checked={formData.trabajoExterno}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trabajoExterno: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="trabajoExterno" className="ml-2 block text-sm text-gray-900">
                Trabajo externo (sin turnos, OTs en paralelo)
              </label>
            </div>
          )}

          {formData.usaMontosFijos && (
            <div className="space-y-6 border-t pt-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Tarifa fija por servicio (opcional)</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/catalogos/servicios/nuevo">
                      <Button type="button" variant="secondary" size="sm">
                        + Crear servicio (catálogo)
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => cargarCatalogos()}
                      disabled={loadingCatalogos}
                    >
                      Actualizar lista
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Si dejás un precio vacío, se usará el precio del catálogo. El valor que cargues acá aplica solo a este cliente.
                </p>
                {loadingCatalogos ? (
                  <p className="text-sm text-gray-500">Cargando servicios...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {servicios.map((s) => (
                      <Input
                        key={s.id}
                        id={`servicio-${s.id}`}
                        label={`${s.nombre} (catálogo: ${formatCurrency(Number(s.precio))})`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.montosFijosServicios[s.id]?.toString() ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => {
                            const next = { ...prev.montosFijosServicios }
                            if (!value) {
                              delete next[s.id]
                            } else {
                              next[s.id] = Number(value)
                            }
                            return { ...prev, montosFijosServicios: next }
                          })
                        }}
                        placeholder="Precio fijo (solo este cliente)"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Tarifa fija por extra (opcional)</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/catalogos/extras/nuevo">
                      <Button type="button" variant="secondary" size="sm">
                        + Crear extra (catálogo)
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => cargarCatalogos()}
                      disabled={loadingCatalogos}
                    >
                      Actualizar lista
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Nota: “Crear extra” crea el extra para todos los clientes. El precio fijo de este cliente se define acá abajo.
                </p>
                {loadingCatalogos ? (
                  <p className="text-sm text-gray-500">Cargando extras...</p>
                ) : extras.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay extras en el catálogo.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extras.map((ex) => (
                      <Input
                        key={ex.id}
                        id={`extra-${ex.id}`}
                        label={`${ex.nombre} (catálogo: ${formatCurrency(Number(ex.precio))})`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.montosFijosExtras[ex.id]?.toString() ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData((prev) => {
                            const next = { ...prev.montosFijosExtras }
                            if (!value) {
                              delete next[ex.id]
                            } else {
                              next[ex.id] = Number(value)
                            }
                            return { ...prev, montosFijosExtras: next }
                          })
                        }}
                        placeholder="Precio fijo (solo este cliente)"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Portal (para el cliente)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Esto crea (o actualiza) un usuario para que la concesionaria entre al portal y vea su reporte.
            </p>

            {portalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {portalError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                id="portalUsuario"
                label="Usuario portal"
                value={portalForm.usuario}
                onChange={(e) => setPortalForm((prev) => ({ ...prev, usuario: e.target.value }))}
                placeholder={portalInfoLoading ? 'Cargando...' : portalInfo?.sugerido || 'cliente_concesionaria'}
              />
              <Input
                id="portalPassword"
                label="Contraseña portal (nueva)"
                type="text"
                value={portalForm.password}
                onChange={(e) => setPortalForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Dejá vacío para autogenerar"
              />
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="portalResetPassword"
                checked={portalForm.resetPassword}
                onChange={(e) => setPortalForm((prev) => ({ ...prev, resetPassword: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="portalResetPassword" className="ml-2 block text-sm text-gray-900">
                Resetear contraseña (si el usuario ya existe)
              </label>
            </div>

            {(portalInfo?.portalUser?.usuario || portalCreds?.usuario) && (
              <p className="text-xs text-gray-600 mb-4">
                Usuario actual: <strong>{portalInfo?.portalUser?.usuario || portalCreds?.usuario}</strong>
              </p>
            )}

            {portalCreds && (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded mb-4">
                <div className="text-sm font-semibold mb-2">Credenciales generadas</div>
                <div className="text-sm">
                  <div>
                    <strong>Usuario:</strong> {portalCreds.usuario}
                  </div>
                  <div>
                    <strong>Contraseña:</strong> {portalCreds.password}
                  </div>
                  <div className="text-xs text-blue-800 mt-2">
                    Guardá esta contraseña ahora: no se vuelve a mostrar.
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open('/portal', '_blank')}
              >
                Abrir Portal
              </Button>
              <Button type="button" variant="primary" onClick={upsertPortalUser} disabled={portalLoading}>
                {portalLoading ? 'Generando...' : 'Generar / Resetear acceso'}
              </Button>
            </div>
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

