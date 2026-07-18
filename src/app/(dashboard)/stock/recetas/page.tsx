/**
 * Página: Recetas de insumos (Etapa 2)
 * Define, por servicio y por extra, qué insumos consume y cuánto.
 * Cuando una OT llega a LISTO, esos insumos se descuentan solos.
 * Muestra costo de insumos y margen cuando los productos tienen costo.
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import { useSucursales } from '@/lib/hooks/useSucursales'

interface Producto {
  id: string
  nombre: string
  unidad: string
  costoUnitario: number | null
}
interface LineaReceta {
  productoStockId: string
  cantidad: number
  costoLinea: number | null
}
interface Item {
  id: string
  nombre: string
  precio: number
  tieneReceta: boolean
  lineas: LineaReceta[]
  costoInsumos: number | null
  margen: number | null
}
interface RecetasData {
  sucursalId: string
  productos: Producto[]
  servicios: Item[]
  extras: Item[]
}

export default function RecetasPage() {
  const queryClient = useQueryClient()
  const { sucursales, sucursalPropia, puedeElegir } = useSucursales()
  const [sucursalId, setSucursalId] = useState<string>('')
  const sucursalEfectiva = sucursalPropia || sucursalId || sucursales[0]?.id || ''

  // Item que se está editando: { tipo, id }
  const [editando, setEditando] = useState<{ tipo: 'servicio' | 'extra'; id: string } | null>(null)
  const [lineas, setLineas] = useState<{ productoStockId: string; cantidad: string }[]>([])
  const [guardando, setGuardando] = useState(false)

  const { data, isLoading } = useQuery<RecetasData>({
    queryKey: ['recetas', sucursalEfectiva],
    enabled: !!sucursalEfectiva,
    queryFn: async () => {
      const res = await fetch(`/api/stock/recetas?sucursalId=${sucursalEfectiva}`)
      if (!res.ok) throw new Error('Error al cargar recetas')
      return res.json()
    },
  })

  const productos = data?.productos ?? []
  const sinProductos = productos.length === 0

  const abrirEditor = (tipo: 'servicio' | 'extra', item: Item) => {
    setEditando({ tipo, id: item.id })
    setLineas(
      item.lineas.length > 0
        ? item.lineas.map((l) => ({ productoStockId: l.productoStockId, cantidad: String(l.cantidad) }))
        : [{ productoStockId: '', cantidad: '' }]
    )
  }

  const guardar = async () => {
    if (!editando) return
    const limpias = lineas
      .filter((l) => l.productoStockId && Number(l.cantidad) > 0)
      .map((l) => ({ productoStockId: l.productoStockId, cantidad: Number(l.cantidad) }))
    // Validar duplicados
    if (new Set(limpias.map((l) => l.productoStockId)).size !== limpias.length) {
      toast.error('Hay un producto repetido en la receta')
      return
    }
    try {
      setGuardando(true)
      const res = await fetch('/api/stock/recetas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sucursalId: sucursalEfectiva,
          ...(editando.tipo === 'servicio' ? { servicioId: editando.id } : { extraId: editando.id }),
          lineas: limpias,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(limpias.length > 0 ? 'Receta guardada' : 'Receta vaciada')
        setEditando(null)
        queryClient.invalidateQueries({ queryKey: ['recetas'] })
      } else {
        toast.error(d.error || 'No se pudo guardar la receta')
      }
    } catch {
      toast.error('No se pudo guardar la receta')
    } finally {
      setGuardando(false)
    }
  }

  const nombreProducto = (id: string) => productos.find((p) => p.id === id)?.nombre || '—'
  const unidadProducto = (id: string) => productos.find((p) => p.id === id)?.unidad || ''

  const itemActual: Item | undefined = useMemo(() => {
    if (!editando || !data) return undefined
    const lista = editando.tipo === 'servicio' ? data.servicios : data.extras
    return lista.find((i) => i.id === editando.id)
  }, [editando, data])

  const renderTabla = (titulo: string, items: Item[], tipo: 'servicio' | 'extra') => (
    <Card title={titulo} className="mb-6">
      {items.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center">No hay {tipo === 'servicio' ? 'servicios' : 'extras'} activos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aqua-line">
            <thead className="bg-aqua-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">{tipo === 'servicio' ? 'Servicio' : 'Extra'}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Receta</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Precio</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Costo insumos</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Margen</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-aqua-line">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-ink">{it.nombre}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {it.tieneReceta ? (
                      <span className="text-ink">
                        {it.lineas.map((l) => `${l.cantidad} ${unidadProducto(l.productoStockId)} ${nombreProducto(l.productoStockId)}`).join(' · ')}
                      </span>
                    ) : (
                      <span className="italic text-muted">Sin receta (no descuenta)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-ink">{formatCurrency(it.precio)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted">
                    {it.costoInsumos != null ? formatCurrency(it.costoInsumos) : '—'}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-semibold ${it.margen == null ? 'text-muted' : it.margen >= 0 ? 'text-[#0c8f68]' : 'text-danger'}`}>
                    {it.margen != null ? formatCurrency(it.margen) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Button size="sm" variant="secondary" onClick={() => abrirEditor(tipo, it)} disabled={sinProductos}>
                      {it.tieneReceta ? 'Editar' : 'Definir'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/stock" className="text-brand hover:underline mb-2 inline-block">← Volver al depósito</Link>
        <h1 className="text-2xl font-bold text-ink">Recetas de insumos</h1>
        <p className="text-muted mt-1">
          Definí qué consume cada servicio y extra. Al marcar una OT como <strong>Lista</strong>, el stock se descuenta solo.
        </p>
      </div>

      {puedeElegir && (
        <Card className="mb-4">
          <div className="max-w-xs">
            <Select
              label="Sucursal"
              value={sucursalId || sucursales[0]?.id || ''}
              onChange={(e) => setSucursalId(e.target.value)}
              options={sucursales.map((s) => ({ value: s.id, label: s.nombre }))}
            />
          </div>
        </Card>
      )}

      {sinProductos && !isLoading && (
        <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-[#b9791a]">
          Primero cargá productos en el <Link href="/stock" className="underline font-medium">depósito</Link> de esta sucursal para poder armar recetas.
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted">Cargando…</div>
      ) : (
        <>
          {data && renderTabla('Servicios', data.servicios, 'servicio')}
          {data && renderTabla('Extras', data.extras, 'extra')}
        </>
      )}

      {/* Editor de receta (modal simple) */}
      {editando && itemActual && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl shadow-aqua-lg w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink mb-1">Receta — {itemActual.nombre}</h2>
            <p className="text-sm text-muted mb-4">Cantidad de cada insumo que consume un lavado.</p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {lineas.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select
                      value={l.productoStockId}
                      onChange={(e) => {
                        const next = [...lineas]
                        next[i].productoStockId = e.target.value
                        setLineas(next)
                      }}
                      placeholder="Producto"
                      options={productos.map((p) => ({ value: p.id, label: `${p.nombre} (${p.unidad})` }))}
                    />
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={l.cantidad}
                    onChange={(e) => {
                      const next = [...lineas]
                      next[i].cantidad = e.target.value
                      setLineas(next)
                    }}
                    placeholder="Cant."
                    className="w-24 rounded-lg border border-aqua-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                  <button
                    type="button"
                    onClick={() => setLineas(lineas.filter((_, j) => j !== i))}
                    className="text-danger text-sm font-semibold px-2"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => setLineas([...lineas, { productoStockId: '', cantidad: '' }])}
            >
              + Agregar insumo
            </Button>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-aqua-line">
              <Button type="button" variant="secondary" onClick={() => setEditando(null)} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar receta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
