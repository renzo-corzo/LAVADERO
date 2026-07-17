/**
 * Página: Editar OT
 * Permite corregir una OT cargada mal. Reglas:
 * - Solo EN_COLA o EN_PROCESO
 * - Si ya tiene pagos registrados NO se puede editar (la caja quedaría rota)
 * - Todo cambio queda registrado en auditoría (antes → después)
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Servicio, Extra } from '@/types'

interface BloqueHorario {
  hora: string
  disponible: boolean
  ocupadoPor?: { patente: string; cliente: string; fin: string }
}

export default function EditarOTPage() {
  const params = useParams()
  const router = useRouter()
  const otId = params.id as string

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [noEditable, setNoEditable] = useState<string | null>(null)

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [esExterna, setEsExterna] = useState(false)
  const [horaOriginal, setHoraOriginal] = useState<string>('')
  const [bloques, setBloques] = useState<BloqueHorario[] | null>(null)

  const [formData, setFormData] = useState({
    servicioId: '',
    extrasIds: [] as string[],
    patente: '',
    tipoVehiculo: '',
    descripcionVehiculo: '',
    nombreCliente: '',
    telefonoCliente: '',
    horarioDeseado: '', // HH:MM
    observaciones: '',
    precioAjustado: '',
    justificacionPrecio: '',
  })

  // Cargar OT + catálogos
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true)
        const [otRes, catRes] = await Promise.all([
          fetch(`/api/ots/${otId}`),
          fetch('/api/catalogos/activos'),
        ])
        if (!otRes.ok) {
          toast.error('No se pudo cargar la OT')
          router.push('/tablero')
          return
        }
        const ot = await otRes.json()
        if (catRes.ok) {
          const cat = await catRes.json()
          setServicios(cat.servicios)
          setExtras(cat.extras)
        }

        // Reglas de edición (el backend valida igual; esto es para avisar antes)
        if (ot.estado !== 'EN_COLA' && ot.estado !== 'EN_PROCESO') {
          setNoEditable('Solo se pueden editar OTs en estado EN COLA o EN PROCESO.')
        } else if ((ot.totalPagado ?? 0) > 0) {
          setNoEditable(
            'Esta OT ya tiene pagos registrados y no se puede editar. Si hay un error, anulá el pago primero.'
          )
        }

        const hora = ot.horarioDeseado
          ? new Date(ot.horarioDeseado).toTimeString().slice(0, 5)
          : ''
        setHoraOriginal(hora)
        setEsExterna(Boolean(ot.esExterna))
        setFormData({
          servicioId: ot.servicioId || ot.servicio?.id || '',
          extrasIds: (ot.extras || []).map((e: any) => e.id),
          patente: ot.patente || '',
          tipoVehiculo: ot.tipoVehiculo || '',
          descripcionVehiculo: ot.descripcionVehiculo || '',
          nombreCliente: ot.nombreCliente || '',
          telefonoCliente: ot.telefonoCliente || '',
          horarioDeseado: hora,
          observaciones: ot.observaciones || '',
          precioAjustado: ot.precioAjustado != null ? String(ot.precioAjustado) : '',
          justificacionPrecio: ot.justificacionPrecio || '',
        })
      } catch {
        toast.error('No se pudo cargar la OT')
        router.push('/tablero')
      } finally {
        setCargando(false)
      }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otId])

  // Grilla de horarios del día (excluyendo esta OT para no auto-bloquearse)
  useEffect(() => {
    const cargarBloques = async () => {
      if (esExterna || !formData.servicioId || noEditable) {
        setBloques(null)
        return
      }
      try {
        const ahora = new Date()
        const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
        const horaLocalCliente = {
          año: ahora.getFullYear(),
          mes: ahora.getMonth(),
          dia: ahora.getDate(),
          hora: ahora.getHours(),
          minuto: ahora.getMinutes(),
          segundo: ahora.getSeconds(),
          iso: ahora.toISOString(),
        }
        const qs = new URLSearchParams({
          fecha: fechaHoy,
          servicioId: formData.servicioId,
          extrasIds: formData.extrasIds.join(','),
          excludeOTId: otId,
          horaActual: JSON.stringify(horaLocalCliente),
        })
        const res = await fetch(`/api/ots/horarios-disponibles?${qs}`)
        if (res.ok) {
          const data = await res.json()
          setBloques(data.bloques || [])
        }
      } catch {
        setBloques(null)
      }
    }
    cargarBloques()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.servicioId, formData.extrasIds.join(','), esExterna, noEditable])

  const toggleExtra = (extraId: string) => {
    setFormData((prev) => ({
      ...prev,
      extrasIds: prev.extrasIds.includes(extraId)
        ? prev.extrasIds.filter((id) => id !== extraId)
        : [...prev.extrasIds, extraId],
    }))
  }

  const calcularTotal = () => {
    if (formData.precioAjustado && parseFloat(formData.precioAjustado) > 0) {
      return parseFloat(formData.precioAjustado)
    }
    const servicio = servicios.find((s) => s.id === formData.servicioId)
    if (!servicio) return 0
    let total = Number(servicio.precio)
    formData.extrasIds.forEach((id) => {
      const extra = extras.find((e) => e.id === id)
      if (extra) total += Number(extra.precio)
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!formData.patente.trim()) newErrors.patente = 'La patente es obligatoria'
    if (!formData.nombreCliente.trim()) newErrors.nombreCliente = 'El nombre es obligatorio'
    if (!formData.telefonoCliente.trim()) newErrors.telefonoCliente = 'El teléfono es obligatorio'
    if (!formData.servicioId) newErrors.servicioId = 'El servicio es obligatorio'
    if (!esExterna && !formData.horarioDeseado) {
      newErrors.horarioDeseado = 'El horario es obligatorio'
    }
    if (formData.precioAjustado && !formData.justificacionPrecio) {
      newErrors.justificacionPrecio = 'Justificación requerida para precio ajustado'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setGuardando(true)
    try {
      const res = await fetch(`/api/ots/${otId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicioId: formData.servicioId,
          extrasIds: formData.extrasIds,
          patente: formData.patente,
          tipoVehiculo: formData.tipoVehiculo || null,
          descripcionVehiculo: formData.descripcionVehiculo || null,
          nombreCliente: formData.nombreCliente,
          telefonoCliente: formData.telefonoCliente,
          observaciones: formData.observaciones || null,
          precioAjustado: formData.precioAjustado ? parseFloat(formData.precioAjustado) : null,
          justificacionPrecio: formData.justificacionPrecio || null,
          horarioDeseado: esExterna
            ? null
            : (() => {
                const hoy = new Date()
                const [h, m] = formData.horarioDeseado.split(':')
                hoy.setHours(parseInt(h), parseInt(m), 0, 0)
                return hoy.toISOString()
              })(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('OT actualizada. El cambio quedó registrado en auditoría.')
        router.push(`/tablero/${otId}`)
      } else {
        const details = Array.isArray(data.details) ? data.details : []
        const msg = details.length > 0
          ? details.map((d: any) => `${d.field}: ${d.message}`).join(' · ')
          : data.error
        toast.error('No se pudo guardar', { description: msg })
        setErrors({ submit: data.error || 'Error al guardar' })
      }
    } catch {
      toast.error('No se pudo guardar la OT')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Cargando OT...</p>
      </div>
    )
  }

  if (noEditable) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-ink mb-2">Esta OT no se puede editar</h1>
        <p className="text-muted mb-6">{noEditable}</p>
        <Link href={`/tablero/${otId}`}>
          <Button variant="secondary">Volver al detalle</Button>
        </Link>
      </div>
    )
  }

  const total = calcularTotal()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/tablero/${otId}`} className="text-brand hover:underline mb-2 inline-block">
          ← Volver al detalle
        </Link>
        <h1 className="text-2xl font-bold text-ink">Editar OT — {formData.patente}</h1>
        <p className="text-muted mt-1">
          Todo cambio queda registrado en la auditoría del sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Datos del Vehículo y Cliente">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Patente *"
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                    error={errors.patente}
                  />
                  <Select
                    label="Tipo de Vehículo (opcional)"
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
                  label="Descripción del Vehículo (opcional)"
                  rows={2}
                  value={formData.descripcionVehiculo}
                  onChange={(e) => setFormData({ ...formData, descripcionVehiculo: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Cliente *"
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    error={errors.nombreCliente}
                  />
                  <Input
                    label="Teléfono del Cliente *"
                    type="tel"
                    value={formData.telefonoCliente}
                    onChange={(e) => setFormData({ ...formData, telefonoCliente: e.target.value })}
                    error={errors.telefonoCliente}
                  />
                </div>

                {/* Horario */}
                {!esExterna && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario Deseado *
                      {horaOriginal && (
                        <span className="ml-2 text-xs text-muted font-normal">
                          (actual: {horaOriginal})
                        </span>
                      )}
                    </label>
                    {bloques ? (
                      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded">
                          {bloques
                            .filter((b) => b.ocupadoPor?.patente !== 'Horario pasado' || b.hora === formData.horarioDeseado)
                            .map((b) => {
                              // El horario actual de la OT siempre se puede mantener
                              const esActual = b.hora === horaOriginal
                              const seleccionable = b.disponible || esActual
                              const isSelected = formData.horarioDeseado === b.hora
                              return (
                                <button
                                  key={b.hora}
                                  type="button"
                                  onClick={() => {
                                    if (seleccionable) {
                                      setFormData({ ...formData, horarioDeseado: b.hora })
                                    }
                                  }}
                                  disabled={!seleccionable}
                                  className={`relative min-h-[48px] px-3 py-3 sm:px-2 sm:py-2.5 text-sm sm:text-xs font-medium rounded-md border-2 transition-all active:scale-95 touch-manipulation ${
                                    seleccionable
                                      ? isSelected
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-300 z-10'
                                        : 'bg-green-100 text-green-800 border-green-400 active:bg-green-200 cursor-pointer'
                                      : 'bg-red-100 text-red-600 border-red-400 cursor-not-allowed opacity-60'
                                  }`}
                                  title={
                                    b.ocupadoPor
                                      ? `Ocupado: ${b.ocupadoPor.patente} - ${b.ocupadoPor.cliente}`
                                      : seleccionable
                                        ? 'Disponible'
                                        : 'No disponible'
                                  }
                                >
                                  {b.hora}
                                  {isSelected && ' ✓'}
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Cargando horarios...</p>
                    )}
                    {errors.horarioDeseado && (
                      <p className="text-sm text-red-600 mt-1">{errors.horarioDeseado}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card title="Servicio">
              <Select
                label="Servicio Principal *"
                value={formData.servicioId}
                onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
                error={errors.servicioId}
                placeholder="Seleccionar servicio"
                options={servicios.map((s) => ({
                  value: s.id,
                  label: `${s.nombre} - ${formatCurrency(Number(s.precio))}`,
                }))}
              />
            </Card>

            <Card title="Extras (opcional)">
              {extras.length === 0 ? (
                <p className="text-gray-500">No hay extras disponibles</p>
              ) : (
                <div className="space-y-2">
                  {extras.map((extra) => (
                    <label
                      key={extra.id}
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.extrasIds.includes(extra.id)}
                        onChange={() => toggleExtra(extra.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 flex-1">
                        <span className="font-medium">{extra.nombre}</span>
                        <span className="ml-2 text-gray-600">{formatCurrency(Number(extra.precio))}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Observaciones (opcional)">
              <Textarea
                rows={3}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Resumen">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Nuevo total:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
                <div className="border-t pt-4">
                  <details className="text-sm" open={!!formData.precioAjustado}>
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Ajustar precio manualmente
                    </summary>
                    <div className="mt-2 space-y-2">
                      <Input
                        label="Precio Ajustado"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precioAjustado}
                        onChange={(e) => setFormData({ ...formData, precioAjustado: e.target.value })}
                      />
                      <Textarea
                        label="Justificación"
                        rows={2}
                        value={formData.justificacionPrecio}
                        onChange={(e) => setFormData({ ...formData, justificacionPrecio: e.target.value })}
                        error={errors.justificacionPrecio}
                        placeholder="Motivo del ajuste..."
                      />
                    </div>
                  </details>
                </div>
              </div>
            </Card>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push(`/tablero/${otId}`)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
