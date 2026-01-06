/**
 * Página: Crear Nueva OT
 * US-004: Crear Orden de Trabajo (OT) - rápida en 30-60 segundos
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Servicio, Extra, Usuario, Cliente } from '@/types'

export default function NuevaOTPage() {
  const router = useRouter()
  const { data: session } = useSession()

  // LAVADOR ahora puede crear OTs (pero no puede editar ni cancelar)
  const [loading, setLoading] = useState(false)
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validandoHorario, setValidandoHorario] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState<{
    disponible: boolean
    conflicto?: string
    horariosDisponibles?: string[]
  } | null>(null)
  const [mostrarSelectorHorarios, setMostrarSelectorHorarios] = useState(false)
  const [horariosDelDia, setHorariosDelDia] = useState<{
    bloques: Array<{
      hora: string
      disponible: boolean
      ocupadoPor?: { patente: string; cliente: string; fin: string }
    }>
  } | null>(null)

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [formData, setFormData] = useState({
    tipoCliente: 'WALK_IN' as 'FIJO' | 'WALK_IN',
    clienteId: '',
    servicioId: '',
    extrasIds: [] as string[],
    patente: '',
    tipoVehiculo: '',
    descripcionVehiculo: '',
    nombreCliente: '',
    telefonoCliente: '',
    horarioDeseado: '',
    observaciones: '',
    precioAjustado: '',
    justificacionPrecio: '',
  })

  useEffect(() => {
    cargarCatalogos()
  }, [])

  // Cargar datos del cliente cuando se selecciona
  useEffect(() => {
    if (formData.clienteId && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === formData.clienteId)
      setClienteSeleccionado(cliente || null)
      if (cliente) {
        // Si es cliente fijo, prellenar nombre y teléfono
        setFormData((prev) => ({
          ...prev,
          nombreCliente: cliente.nombre,
          telefonoCliente: cliente.telefono || '',
        }))
      }
    } else {
      setClienteSeleccionado(null)
    }
  }, [formData.clienteId, clientes])

  // Limpiar campos cuando cambia el tipo de cliente
  useEffect(() => {
    if (formData.tipoCliente === 'WALK_IN') {
      setFormData((prev) => ({
        ...prev,
        clienteId: '',
        nombreCliente: '',
        telefonoCliente: '',
      }))
      setClienteSeleccionado(null)
    }
  }, [formData.tipoCliente])

  useEffect(() => {
    if (session && (session.user.role === 'DUENO' || session.user.role === 'ENCARGADO')) {
      cargarClientes()
    }
  }, [session])

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true)
      const response = await fetch('/api/clientes?tipo=CONCESIONARIA&activo=true')
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const cargarCatalogos = async () => {
    try {
      setLoadingCatalogos(true)
      const response = await fetch('/api/catalogos/activos')
      if (response.ok) {
        const data = await response.json()
        setServicios(data.servicios)
        setExtras(data.extras)
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error)
    } finally {
      setLoadingCatalogos(false)
    }
  }


  // Calcular total automáticamente
  const calcularTotal = () => {
    const servicioSeleccionado = servicios.find((s) => s.id === formData.servicioId)
    if (!servicioSeleccionado) return 0

    let total = Number(servicioSeleccionado.precio)
    formData.extrasIds.forEach((extraId) => {
      const extra = extras.find((e) => e.id === extraId)
      if (extra) {
        total += Number(extra.precio)
      }
    })

    // Aplicar descuento del cliente si hay uno seleccionado
    if (formData.tipoCliente === 'FIJO' && clienteSeleccionado && clienteSeleccionado.descuentoPorcentaje) {
      const descuento = (total * clienteSeleccionado.descuentoPorcentaje) / 100
      total = total - descuento
    }

    // Si hay precio ajustado, usar ese
    if (formData.precioAjustado && parseFloat(formData.precioAjustado) > 0) {
      return parseFloat(formData.precioAjustado)
    }

    return total
  }

  // Validar disponibilidad de horario
  const validarDisponibilidadHorario = async () => {
    if (!formData.servicioId || !formData.horarioDeseado) {
      setDisponibilidad(null)
      return
    }

    try {
      setValidandoHorario(true)
      const hoy = new Date()
      const [horas, minutos] = formData.horarioDeseado.split(':')
      hoy.setHours(parseInt(horas), parseInt(minutos), 0, 0)

      const response = await fetch('/api/ots/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicioId: formData.servicioId,
          extrasIds: formData.extrasIds,
          horarioDeseado: hoy.toISOString(),
          fechaIngreso: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDisponibilidad(data)
        
        // Solo mostrar advertencia, NO bloquear (el usuario puede decidir manualmente)
        // No agregar error, solo mostrar información
        if (!data.disponible) {
          // No agregar error, solo informar visualmente
        } else {
          // Limpiar error si está disponible
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.horarioDeseado
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error('Error al validar disponibilidad:', error)
    } finally {
      setValidandoHorario(false)
    }
  }

  // Cargar horarios disponibles del día cuando cambia servicio o se abre el selector
  const cargarHorariosDisponibles = async () => {
    if (!formData.servicioId) {
      setHorariosDelDia(null)
      return
    }

    try {
      const hoy = new Date().toISOString().split('T')[0]
      const params = new URLSearchParams({
        fecha: hoy,
        servicioId: formData.servicioId,
        extrasIds: formData.extrasIds.join(','),
      })

      console.log('[nueva-ot] Cargando horarios disponibles...', { fecha: hoy, servicioId: formData.servicioId })
      
      const response = await fetch(`/api/ots/horarios-disponibles?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[nueva-ot] Horarios recibidos:', { 
          bloques: data.bloques?.length || 0, 
          disponibles: data.bloques?.filter((b: any) => b.disponible).length || 0 
        })
        
        setHorariosDelDia(data)
        
        // Automatically select the first available slot if none is selected
        if (!formData.horarioDeseado && data.bloques?.some((b: any) => b.disponible)) {
          const firstAvailable = data.bloques.find((b: any) => b.disponible)
          if (firstAvailable) {
            console.log('[nueva-ot] Seleccionando automáticamente:', firstAvailable.hora)
            setFormData((prev) => ({ ...prev, horarioDeseado: firstAvailable.hora }))
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('[nueva-ot] Error al cargar horarios:', response.status, errorData)
        setHorariosDelDia(null)
        alert(`Error al cargar horarios: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('[nueva-ot] Error al cargar horarios disponibles:', error)
      setHorariosDelDia(null)
      alert('Error al cargar horarios disponibles. Por favor, recarga la página.')
    }
  }

  // Cargar horarios cuando se selecciona un servicio
  useEffect(() => {
    if (formData.servicioId) {
      cargarHorariosDisponibles()
    } else {
      setHorariosDelDia(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.servicioId, formData.extrasIds.join(',')])

  // Validar disponibilidad cuando cambia servicio, extras o horario
  useEffect(() => {
    if (formData.servicioId && formData.horarioDeseado) {
      const timeoutId = setTimeout(() => {
        validarDisponibilidadHorario()
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timeoutId)
    } else {
      setDisponibilidad(null)
    }
  }, [formData.servicioId, formData.extrasIds.join(','), formData.horarioDeseado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!formData.patente || formData.patente.trim() === '') {
      newErrors.patente = 'La patente es obligatoria'
    }
    if (!formData.nombreCliente || formData.nombreCliente.trim() === '') {
      newErrors.nombreCliente = 'El nombre del cliente es obligatorio'
    }
    if (!formData.telefonoCliente || formData.telefonoCliente.trim() === '') {
      newErrors.telefonoCliente = 'El teléfono del cliente es obligatorio'
    }
    if (!formData.horarioDeseado || formData.horarioDeseado.trim() === '') {
      newErrors.horarioDeseado = 'El horario deseado es obligatorio'
    }
    // NO bloquear por conflictos - solo advertir, el usuario decide manualmente
    if (!formData.servicioId) {
      newErrors.servicioId = 'El servicio es obligatorio'
    }
    // tipoVehiculo ahora es opcional, no se valida
    if (formData.precioAjustado && !formData.justificacionPrecio) {
      newErrors.justificacionPrecio = 'Justificación requerida para precio ajustado'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/ots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tipoVehiculo: formData.tipoVehiculo || null,
          clienteId: formData.tipoCliente === 'FIJO' && formData.clienteId ? formData.clienteId : null,
          precioAjustado: formData.precioAjustado ? parseFloat(formData.precioAjustado) : null,
          justificacionPrecio: formData.justificacionPrecio || null,
          // Combinar fecha actual con la hora seleccionada
          horarioDeseado: formData.horarioDeseado ? (() => {
            const hoy = new Date()
            const [horas, minutos] = formData.horarioDeseado.split(':')
            hoy.setHours(parseInt(horas), parseInt(minutos), 0, 0)
            return hoy.toISOString()
          })() : null,
        }),
      })

      if (response.ok) {
        // Redirigir al tablero (en móvil mostrará el menú, en desktop el kanban)
        // Si es móvil, redirigir al menú principal; si es desktop, al kanban
        const isMobile = typeof window !== 'undefined' && (window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        if (isMobile) {
          // En móvil, ir al menú principal (no al kanban)
          router.push('/tablero')
        } else {
          // En desktop, ir al kanban
          router.push('/tablero?kanban=true')
        }
        // Forzar recarga completa de la página para asegurar que se vea la nueva OT
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const data = await response.json()
        console.error('[nueva-ot] Error del servidor:', data)
        const errorMessage = data.details?.message || data.error || 'Error al crear orden de trabajo'
        setErrors({ submit: errorMessage })
        alert(`Error: ${errorMessage}${data.details?.meta ? '\n\nDetalles: ' + JSON.stringify(data.details.meta) : ''}`)
      }
    } catch (error) {
      setErrors({ submit: 'Error al crear orden de trabajo' })
    } finally {
      setLoading(false)
    }
  }

  const toggleExtra = (extraId: string) => {
    setFormData({
      ...formData,
      extrasIds: formData.extrasIds.includes(extraId)
        ? formData.extrasIds.filter((id) => id !== extraId)
        : [...formData.extrasIds, extraId],
    })
  }


  const total = calcularTotal()

  return (
    <div className="relative">
      {/* Overlay de carga solo cuando está creando la OT */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <p className="text-gray-700 font-medium">Creando orden de trabajo...</p>
          </div>
        </div>
      )}
      {/* Debug: mostrar estados de carga si están activos por mucho tiempo */}
      {loadingCatalogos && !loading && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded z-40 text-sm">
          Cargando catálogos...
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Trabajo</h1>
        <p className="text-gray-600 mt-1">Complete los datos del vehículo y seleccione el servicio</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Datos del Vehículo */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Datos del Vehículo y Cliente">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Patente *"
                    id="patente"
                    required
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                    placeholder="ABC123"
                    error={errors.patente}
                  />

                  <Select
                    label="Tipo de Vehículo (opcional)"
                    id="tipoVehiculo"
                    value={formData.tipoVehiculo}
                    onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })}
                    error={errors.tipoVehiculo}
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
                  id="descripcionVehiculo"
                  rows={2}
                  value={formData.descripcionVehiculo}
                  onChange={(e) => setFormData({ ...formData, descripcionVehiculo: e.target.value })}
                  placeholder="Ej: Auto rojo, modelo..."
                />

                {/* Selector de tipo de cliente - solo para DUEÑO y ENCARGADO */}
                {(session?.user.role === 'DUENO' || session?.user.role === 'ENCARGADO') && (
                  <div>
                    <Select
                      label="Tipo de Cliente *"
                      id="tipoCliente"
                      value={formData.tipoCliente}
                      onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value as 'FIJO' | 'WALK_IN' })}
                      options={[
                        { value: 'WALK_IN', label: '👤 Cliente Walk-in (Por orden de llegada)' },
                        { value: 'FIJO', label: '🏢 Cliente Fijo (Concesionaria)' },
                      ]}
                      required
                    />
                  </div>
                )}

                {/* Selector de cliente fijo - solo si es tipo FIJO y es DUEÑO/ENCARGADO */}
                {(session?.user.role === 'DUENO' || session?.user.role === 'ENCARGADO') && formData.tipoCliente === 'FIJO' && (
                  <div>
                    <Select
                      label="Cliente (Concesionaria) *"
                      id="clienteId"
                      value={formData.clienteId}
                      onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                      options={[
                        { value: '', label: 'Seleccionar cliente...' },
                        ...clientes.map((c) => ({
                          value: c.id,
                          label: `${c.nombre}${c.descuentoPorcentaje ? ` (${c.descuentoPorcentaje}% desc.)` : ''}`,
                        })),
                      ]}
                      required
                      disabled={loadingClientes}
                    />
                    {clienteSeleccionado && clienteSeleccionado.descuentoPorcentaje && (
                      <p className="text-sm text-green-600 mt-1">
                        ✓ Se aplicará un descuento del {clienteSeleccionado.descuentoPorcentaje}%
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Cliente *"
                    id="nombreCliente"
                    required
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    placeholder="Juan Pérez"
                    error={errors.nombreCliente}
                    disabled={formData.tipoCliente === 'FIJO' && formData.clienteId !== ''}
                  />

                  <Input
                    label="Teléfono del Cliente *"
                    id="telefonoCliente"
                    required
                    type="tel"
                    value={formData.telefonoCliente}
                    onChange={(e) => setFormData({ ...formData, telefonoCliente: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                    error={errors.telefonoCliente}
                    disabled={formData.tipoCliente === 'FIJO' && formData.clienteId !== ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horario Deseado *
                  </label>
                  
                  {/* Selector visual de horarios (siempre visible cuando hay servicio) */}
                  {formData.servicioId ? (
                    <>
                      {horariosDelDia ? (
                        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                          <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            Selecciona un horario disponible
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded">
                            {horariosDelDia.bloques.map((bloque) => {
                              const isSelected = formData.horarioDeseado === bloque.hora
                              return (
                                <button
                                  key={bloque.hora}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    if (bloque.disponible) {
                                      setFormData({ ...formData, horarioDeseado: bloque.hora })
                                    }
                                  }}
                                  onTouchStart={(e) => {
                                    e.stopPropagation()
                                  }}
                                  disabled={!bloque.disponible}
                                  className={`
                                    relative min-h-[48px] px-3 py-3 sm:px-2 sm:py-2.5 text-sm sm:text-xs font-medium rounded-md border-2 transition-all active:scale-95 touch-manipulation
                                    ${bloque.disponible
                                      ? isSelected
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 sm:ring-4 ring-blue-300 z-10'
                                        : 'bg-green-100 text-green-800 border-green-400 active:bg-green-200 active:border-green-500 active:shadow-md cursor-pointer'
                                      : 'bg-red-100 text-red-600 border-red-400 cursor-not-allowed opacity-60'
                                    }
                                  `}
                                  title={
                                    bloque.ocupadoPor
                                      ? `Ocupado: ${bloque.ocupadoPor.patente} - ${bloque.ocupadoPor.cliente} (hasta ${bloque.ocupadoPor.fin})`
                                      : bloque.disponible
                                      ? 'Disponible - Toca para seleccionar'
                                      : 'No disponible'
                                  }
                                >
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="leading-tight">{bloque.hora}</span>
                                    {isSelected && (
                                      <span className="text-xs sm:text-[10px] mt-0.5">✓</span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-200 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-green-100 border-2 border-green-400 rounded"></div>
                              <span className="text-gray-700">Disponible</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-red-100 border-2 border-red-400 rounded"></div>
                              <span className="text-gray-700">Ocupado</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-600 border-2 border-blue-700 rounded ring-2 ring-blue-300"></div>
                              <span className="text-gray-700 font-medium">Seleccionado</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border rounded bg-gray-50">
                          <p className="text-sm text-gray-600">Cargando horarios disponibles...</p>
                        </div>
                      )}
                      
                      {/* Campo de hora oculto para validación (se actualiza automáticamente) */}
                      <input
                        type="hidden"
                        value={formData.horarioDeseado}
                        required
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Selecciona un servicio para ver los horarios disponibles</p>
                  )}
                  
                  {errors.horarioDeseado && (
                    <p className="text-sm text-red-600 mt-1">{errors.horarioDeseado}</p>
                  )}
                  
                  {validandoHorario && (
                    <p className="text-xs text-blue-600 mt-1">⏳ Validando disponibilidad...</p>
                  )}
                  
                  {disponibilidad && !validandoHorario && (
                    <div className="mt-2">
                      {disponibilidad.disponible ? (
                        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                          ✓ Horario disponible
                        </div>
                      ) : (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          <div className="flex items-start gap-2">
                            <span className="text-base">⚠️</span>
                            <div className="flex-1">
                              <p className="font-medium mb-1">Advertencia:</p>
                              <p className="text-xs">{disponibilidad.conflicto}</p>
                              <p className="text-xs mt-1 text-orange-700 italic">
                                Puedes continuar, pero considera el conflicto al planificar el trabajo.
                              </p>
                              {disponibilidad.horariosDisponibles && disponibilidad.horariosDisponibles.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium mb-1 text-xs">Horarios alternativos sugeridos:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {disponibilidad.horariosDisponibles.map((hora) => (
                                      <button
                                        key={hora}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, horarioDeseado: hora })
                                        }}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                      >
                                        {hora}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selector visual ya está arriba, este código se puede eliminar si no se usa */}
                  {false && mostrarSelectorHorarios && horariosDelDia && (
                    <div className="mt-4 border-2 border-gray-300 rounded-lg p-4 bg-white shadow-lg">
                      <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        Selecciona un horario disponible
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded">
                        {horariosDelDia?.bloques.map((bloque) => {
                          const isSelected = formData.horarioDeseado === bloque.hora
                          return (
                            <button
                              key={bloque.hora}
                              type="button"
                              onClick={() => {
                                if (bloque.disponible) {
                                  setFormData({ ...formData, horarioDeseado: bloque.hora })
                                  setMostrarSelectorHorarios(false)
                                }
                              }}
                              disabled={!bloque.disponible}
                              className={`
                                relative px-2 py-2.5 text-xs font-medium rounded-md border-2 transition-all transform hover:scale-105
                                ${bloque.disponible
                                  ? isSelected
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-4 ring-blue-300 scale-110 z-10'
                                    : 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200 hover:border-green-500 hover:shadow-md cursor-pointer'
                                  : 'bg-red-100 text-red-600 border-red-400 cursor-not-allowed opacity-60'
                                }
                              `}
                              title={
                                bloque.ocupadoPor
                                  ? `Ocupado: ${bloque.ocupadoPor.patente} - ${bloque.ocupadoPor.cliente} (hasta ${bloque.ocupadoPor.fin})`
                                  : bloque.disponible
                                  ? 'Disponible - Click para seleccionar'
                                  : 'No disponible'
                              }
                            >
                              <div className="flex flex-col items-center">
                                <span>{bloque.hora}</span>
                                {isSelected && (
                                  <span className="text-xs mt-0.5">✓</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-200 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-100 border-2 border-green-400 rounded"></div>
                          <span className="text-gray-700">Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-red-100 border-2 border-red-400 rounded"></div>
                          <span className="text-gray-700">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-600 border-2 border-blue-700 rounded ring-2 ring-blue-300"></div>
                          <span className="text-gray-700 font-medium">Seleccionado</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.patente && <p className="text-sm text-red-600">{errors.patente}</p>}
              </div>
            </Card>

            <Card title="Servicio">
              {loadingCatalogos ? (
                <p>Cargando servicios...</p>
              ) : (
                <Select
                  label="Servicio Principal"
                  id="servicioId"
                  required
                  value={formData.servicioId}
                  onChange={(e) => setFormData({ ...formData, servicioId: e.target.value })}
                  error={errors.servicioId}
                  placeholder="Seleccionar servicio"
                  options={servicios.map((s) => ({
                    value: s.id,
                    label: `${s.nombre} - ${formatCurrency(Number(s.precio))}`,
                  }))}
                />
              )}
            </Card>

            <Card title="Extras (opcional)">
              {loadingCatalogos ? (
                <p>Cargando extras...</p>
              ) : extras.length === 0 ? (
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
                        <span className="ml-2 text-gray-600">
                          {formatCurrency(Number(extra.precio))}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Observaciones (opcional)">
              <Textarea
                id="observaciones"
                rows={3}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </Card>
          </div>

          {/* Columna 2: Resumen y Acciones */}
          <div className="space-y-6">
            <Card title="Resumen">
              <div className="space-y-4">

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Ajustar precio manualmente
                    </summary>
                    <div className="mt-2 space-y-2">
                      <Input
                        label="Precio Ajustado"
                        id="precioAjustado"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precioAjustado}
                        onChange={(e) => setFormData({ ...formData, precioAjustado: e.target.value })}
                      />
                      <Textarea
                        label="Justificación"
                        id="justificacionPrecio"
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
              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Orden de Trabajo'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.back()}
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

