/**
 * Página: Detalle de producto de stock
 * Registrar entrada / salida / ajuste, ver saldo actual e historial.
 */

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { formatDateTime } from '@/lib/utils'

interface Movimiento {
  id: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number // con signo
  costoUnitario: number | null
  motivo: string | null
  fechaHora: string
  usuario: string
}
interface Detalle {
  producto: {
    id: string
    nombre: string
    unidad: string
    stockActual: number
    stockMinimo: number
    costoUnitario: number | null
    activo: boolean
  }
  movimientos: Movimiento[]
}

type TipoMov = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

export default function ProductoStockPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productoId = params.id as string

  const [tipo, setTipo] = useState<TipoMov>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [resta, setResta] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const { data, isLoading } = useQuery<Detalle>({
    queryKey: ['stock-producto', productoId],
    queryFn: async () => {
      const res = await fetch(`/api/stock/productos/${productoId}`)
      if (!res.ok) throw new Error('Error al cargar el producto')
      return res.json()
    },
  })

  const p = data?.producto

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(cantidad)
    if (!cantidad || isNaN(n) || n <= 0) {
      toast.error('Ingresá una cantidad mayor a cero')
      return
    }
    try {
      setGuardando(true)
      const res = await fetch('/api/stock/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId,
          tipo,
          cantidad: n,
          resta: tipo === 'AJUSTE' ? resta : false,
          costoUnitario: tipo === 'ENTRADA' && costo ? Number(costo) : null,
          motivo: motivo || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success('Movimiento registrado')
        setCantidad('')
        setCosto('')
        setMotivo('')
        setResta(false)
        queryClient.invalidateQueries({ queryKey: ['stock-producto', productoId] })
        queryClient.invalidateQueries({ queryKey: ['stock-productos'] })
      } else {
        toast.error(d.error || 'No se pudo registrar el movimiento')
      }
    } catch {
      toast.error('No se pudo registrar el movimiento')
    } finally {
      setGuardando(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted">Cargando…</p></div>
  }
  if (!p) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">Producto no encontrado</p>
        <Link href="/stock"><Button variant="secondary">Volver al depósito</Button></Link>
      </div>
    )
  }

  const bajoStock = p.stockActual <= 0 || (p.stockMinimo > 0 && p.stockActual <= p.stockMinimo)

  const etiquetaTipo = (t: TipoMov) =>
    t === 'ENTRADA' ? 'Entrada (compra)' : t === 'SALIDA' ? 'Salida (consumo)' : 'Ajuste de inventario'

  return (
    <div>
      <div className="mb-6">
        <Link href="/stock" className="text-brand hover:underline mb-2 inline-block">← Volver al depósito</Link>
        <h1 className="text-2xl font-bold text-ink">{p.nombre}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saldo + registrar movimiento */}
        <div className="space-y-6">
          <Card>
            <div className="text-sm text-muted">Stock actual</div>
            <div className={`text-3xl font-bold ${bajoStock ? 'text-danger' : 'text-ink'}`}>
              {p.stockActual} <span className="text-lg font-normal text-muted">{p.unidad}</span>
            </div>
            {p.stockMinimo > 0 && (
              <div className="text-xs text-muted mt-1">Mínimo: {p.stockMinimo} {p.unidad}</div>
            )}
            {bajoStock && (
              <div className="mt-3 rounded-lg bg-warn/10 text-[#b9791a] text-sm font-medium px-3 py-2">
                ⚠️ Conviene reponer
              </div>
            )}
          </Card>

          <Card title="Registrar movimiento">
            <form onSubmit={registrar} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['ENTRADA', 'SALIDA', 'AJUSTE'] as TipoMov[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border-2 transition ${
                      tipo === t
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-ink border-aqua-line hover:border-brand/40'
                    }`}
                  >
                    {t === 'ENTRADA' ? 'Entrada' : t === 'SALIDA' ? 'Salida' : 'Ajuste'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted -mt-2">{etiquetaTipo(tipo)}</p>

              {tipo === 'AJUSTE' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResta(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 ${!resta ? 'bg-ok/15 text-[#0c8f68] border-ok/40' : 'border-aqua-line text-muted'}`}
                  >
                    + Sumar
                  </button>
                  <button
                    type="button"
                    onClick={() => setResta(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 ${resta ? 'bg-danger/10 text-danger border-danger/40' : 'border-aqua-line text-muted'}`}
                  >
                    − Restar
                  </button>
                </div>
              )}

              <Input
                label={`Cantidad (${p.unidad}) *`}
                type="number"
                step="0.001"
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
              />

              {tipo === 'ENTRADA' && (
                <Input
                  label="Costo por unidad (opcional)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  placeholder="$ por unidad"
                />
              )}

              <Textarea
                label="Motivo / nota (opcional)"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={tipo === 'AJUSTE' ? 'Ej: conteo físico, derrame…' : 'Ej: compra a proveedor X'}
              />

              <Button type="submit" variant="primary" className="w-full" disabled={guardando}>
                {guardando ? 'Registrando…' : 'Registrar'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2">
          <Card title="Historial de movimientos">
            {data.movimientos.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">Todavía no hay movimientos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-aqua-line">
                  <thead className="bg-aqua-bg">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Tipo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Motivo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Quién</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-aqua-line">
                    {data.movimientos.map((m) => {
                      const positivo = m.cantidad >= 0
                      return (
                        <tr key={m.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-muted">
                            {formatDateTime(new Date(m.fechaHora))}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              m.tipo === 'ENTRADA' ? 'bg-ok/15 text-[#0c8f68]'
                                : m.tipo === 'SALIDA' ? 'bg-danger/12 text-danger'
                                : 'bg-ink/10 text-ink'
                            }`}>
                              {m.tipo === 'ENTRADA' ? 'Entrada' : m.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'}
                            </span>
                          </td>
                          <td className={`px-4 py-2 whitespace-nowrap text-right text-sm font-semibold ${positivo ? 'text-[#0c8f68]' : 'text-danger'}`}>
                            {positivo ? '+' : ''}{m.cantidad} {p.unidad}
                          </td>
                          <td className="px-4 py-2 text-sm text-muted max-w-[220px] truncate" title={m.motivo || ''}>
                            {m.motivo || '—'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-muted">{m.usuario}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
