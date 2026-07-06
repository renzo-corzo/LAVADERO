/**
 * Página para Registrar Pago de OT
 * US-009: Registro de Pagos
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import type { OrdenTrabajo, Pago, MedioPago } from '@/types'

export default function RegistrarPagoPage() {
  const params = useParams()
  const router = useRouter()
  const otId = params.otId as string

  const queryClient = useQueryClient()
  const [guardando, setGuardando] = useState(false)

  const [monto, setMonto] = useState('')
  const [medioPago, setMedioPago] = useState<MedioPago>('EFECTIVO')
  const [referencia, setReferencia] = useState('')

  const {
    data: ot = null,
    isLoading: loading,
    error,
  } = useQuery<OrdenTrabajo>({
    queryKey: ['ot', otId],
    queryFn: async () => {
      const response = await fetch(`/api/ots/${otId}`)
      if (!response.ok) throw new Error('Error al cargar la OT')
      return (await response.json()) as OrdenTrabajo
    },
  })

  const { data: pagos = [] } = useQuery<Pago[]>({
    queryKey: ['pagos', otId],
    queryFn: async () => {
      const response = await fetch(`/api/pagos?otId=${otId}`)
      if (!response.ok) return []
      return (await response.json()) as Pago[]
    },
  })

  useEffect(() => {
    if (error) {
      toast.error('Error al cargar la OT')
      router.push('/tablero')
    }
  }, [error, router])

  // Establecer monto automáticamente cuando se cargan los datos
  useEffect(() => {
    if (ot) {
      const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0)
      const pendiente = ot.precio - totalPagado
      // Solo establecer el monto si no hay uno ingresado y hay pendiente
      if (pendiente > 0 && monto === '') {
        setMonto(pendiente.toFixed(2))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ot, pagos])

  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0)
  const pendiente = ot ? ot.precio - totalPagado : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!monto || Number(monto) <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }

    if (Number(monto) > pendiente) {
      toast.error(`El monto no puede ser mayor al pendiente (${formatCurrency(pendiente)})`)
      return
    }

    if (medioPago === 'TRANSFERENCIA' && !referencia.trim()) {
      toast.error(
        'La referencia es obligatoria para transferencia. Indique CBU, alias o número de operación.'
      )
      return
    }

    try {
      setGuardando(true)
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenTrabajoId: otId,
          monto: parseFloat(monto),
          medioPago,
          referencia: referencia.trim() || null,
        }),
      })

      if (response.ok) {
        const nuevoPendiente = pendiente - Number(monto)

        // Refrescar OT, pagos y el tablero con los datos nuevos
        queryClient.invalidateQueries({ queryKey: ['ot', otId] })
        queryClient.invalidateQueries({ queryKey: ['pagos', otId] })
        queryClient.invalidateQueries({ queryKey: ['ots'] })

        if (nuevoPendiente <= 0) {
          toast.success('Pago registrado', { description: 'La OT está completamente pagada.' })
        } else {
          toast.success('Pago registrado exitosamente')
        }
        // Redirigir al tablero para continuar trabajando
        router.push('/tablero')
      } else {
        const data = await response.json()
        const base = data.error || 'No se pudo registrar el pago'
        const fromDetails =
          Array.isArray(data.details) && data.details.length > 1
            ? data.details.map((d: { message: string }) => d.message).join(' · ')
            : undefined
        toast.error(base, fromDetails ? { description: fromDetails } : undefined)
      }
    } catch (error) {
      console.error('Error al registrar pago:', error)
      toast.error('Error al registrar el pago')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Cargando...</p>
      </div>
    )
  }

  if (!ot) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">OT no encontrada</p>
        <Link href="/tablero">
          <Button variant="secondary">Volver al Tablero</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/tablero/${otId}`} className="text-brand hover:underline mb-2 inline-block">
          ← Volver al Detalle
        </Link>
        <h1 className="text-2xl font-bold text-ink">Registrar Pago</h1>
        <p className="text-muted mt-1">
          OT: {ot.patente || ot.descripcionVehiculo || 'Sin identificación'}
        </p>
      </div>

      {/* Resumen de OT */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">Resumen de OT</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">Total OT:</span>
            <span className="font-bold">{formatCurrency(ot.precio)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Pagado:</span>
            <span className="font-bold text-ok">{formatCurrency(totalPagado)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium">Pendiente:</span>
            <span className={`font-bold text-lg ${pendiente > 0 ? 'text-danger' : 'text-ok'}`}>
              {formatCurrency(pendiente)}
            </span>
          </div>
        </div>
      </Card>

      {/* Formulario de Pago */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Nuevo Pago</h2>
          {pendiente <= 0 && (
            <span className="px-3 py-1 bg-ok/15 text-[#0c8f68] rounded-full text-sm font-medium">
              ✓ Completamente Pagada
            </span>
          )}
        </div>
        
        {pendiente <= 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="text-4xl mb-2">✓</div>
              <h3 className="text-lg font-semibold text-ok mb-2">
                Orden de Trabajo Completamente Pagada
              </h3>
              <p className="text-muted">
                La OT ya tiene todos los pagos registrados. No se pueden agregar más pagos.
              </p>
            </div>
            <Link href={`/tablero/${otId}`}>
              <Button variant="secondary">Volver al Detalle</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Monto *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={pendiente}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={`Máximo: ${formatCurrency(pendiente)}`}
              required
            />
            {Number(monto) > 0 && Number(monto) <= pendiente && (
              <p className="text-xs text-muted mt-1">
                Nuevo pendiente: {formatCurrency(pendiente - Number(monto))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Medio de Pago *
            </label>
            <Select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value as MedioPago)}
              required
              options={[
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'TRANSFERENCIA', label: 'Transferencia' },
              ]}
            />
          </div>

          {medioPago === 'TRANSFERENCIA' && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Referencia de la transferencia *
              </label>
              <Input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="CBU, alias, número de operación..."
                required
                aria-required
              />
              <p className="text-xs text-muted mt-1">
                Obligatorio para identificar el pago en el banco
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={
                guardando ||
                !monto ||
                Number(monto) <= 0 ||
                Number(monto) > pendiente ||
                (medioPago === 'TRANSFERENCIA' && !referencia.trim())
              }
            >
              {guardando ? 'Registrando...' : 'Registrar Pago'}
            </Button>
            <Link href={`/tablero/${otId}`}>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
        )}
      </Card>

      {/* Historial de Pagos */}
      {pagos.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-bold mb-4">Pagos Anteriores</h2>
          <div className="space-y-2">
            {pagos.map((pago) => (
              <div key={pago.id} className="p-3 bg-aqua-bg rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{formatCurrency(pago.monto)}</div>
                    <div className="text-sm text-muted">{pago.medioPago}</div>
                    {pago.referencia && (
                      <div className="text-xs text-muted mt-1">Ref: {pago.referencia}</div>
                    )}
                    <div className="text-xs text-muted mt-1">
                      {new Date(pago.fechaHora).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

