/**
 * Página: Stock / Depósito de insumos (Etapa 1 — control manual)
 * Lista de productos con su saldo, alerta de reposición y alta rápida.
 * Stock por sucursal (selector solo si el dueño tiene más de una).
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSucursales } from '@/lib/hooks/useSucursales'

interface Producto {
  id: string
  nombre: string
  unidad: string
  stockActual: number
  stockMinimo: number
  costoUnitario: number | null
  activo: boolean
  bajoStock: boolean
  sinStock: boolean
}

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'kg', label: 'Kilos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
]

export default function StockPage() {
  const queryClient = useQueryClient()
  const { sucursales, sucursalPropia, puedeElegir } = useSucursales()
  const [sucursalId, setSucursalId] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarAlta, setMostrarAlta] = useState(false)

  // Sucursal efectiva: la propia del empleado, o la elegida (dueño)
  const sucursalEfectiva = sucursalPropia || sucursalId || sucursales[0]?.id || ''

  const [nuevo, setNuevo] = useState({
    nombre: '',
    unidad: 'unidad',
    stockInicial: '',
    stockMinimo: '',
    costoUnitario: '',
  })
  const [creando, setCreando] = useState(false)

  const { data, isLoading } = useQuery<{ total: number; alertas: number; productos: Producto[] }>({
    queryKey: ['stock-productos', sucursalEfectiva],
    queryFn: async () => {
      const qs = sucursalEfectiva ? `?sucursalId=${sucursalEfectiva}` : ''
      const res = await fetch(`/api/stock/productos${qs}`)
      if (!res.ok) throw new Error('Error al cargar el stock')
      return res.json()
    },
  })

  const productos = data?.productos ?? []

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos
    // Alertas primero
    return [...base].sort((a, b) => Number(b.bajoStock) - Number(a.bajoStock))
  }, [productos, busqueda])

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevo.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      setCreando(true)
      const res = await fetch('/api/stock/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevo.nombre.trim(),
          unidad: nuevo.unidad,
          stockMinimo: nuevo.stockMinimo ? Number(nuevo.stockMinimo) : 0,
          stockInicial: nuevo.stockInicial ? Number(nuevo.stockInicial) : 0,
          costoUnitario: nuevo.costoUnitario ? Number(nuevo.costoUnitario) : null,
          sucursalId: sucursalEfectiva || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        toast.success(`"${nuevo.nombre.trim()}" agregado al depósito`)
        setNuevo({ nombre: '', unidad: 'unidad', stockInicial: '', stockMinimo: '', costoUnitario: '' })
        setMostrarAlta(false)
        queryClient.invalidateQueries({ queryKey: ['stock-productos'] })
      } else {
        toast.error(d.error || 'No se pudo crear el producto')
      }
    } catch {
      toast.error('No se pudo crear el producto')
    } finally {
      setCreando(false)
    }
  }

  const alertas = data?.alertas ?? 0

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Stock</h1>
          <p className="text-muted mt-1">
            Control de insumos: cargá entradas y salidas, y el sistema te avisa cuándo reponer.
          </p>
        </div>
        <Button variant="primary" onClick={() => setMostrarAlta((v) => !v)}>
          {mostrarAlta ? 'Cerrar' : '+ Nuevo producto'}
        </Button>
      </div>

      {/* Selector de sucursal (solo dueño con más de una) */}
      {puedeElegir && (
        <Card className="mb-4">
          <div className="max-w-xs">
            <Select
              label="Sucursal (depósito)"
              value={sucursalId || sucursales[0]?.id || ''}
              onChange={(e) => setSucursalId(e.target.value)}
              options={sucursales.map((s) => ({ value: s.id, label: s.nombre }))}
            />
          </div>
        </Card>
      )}

      {/* Alta de producto */}
      {mostrarAlta && (
        <Card className="mb-6" title="Nuevo producto">
          <form onSubmit={crear} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nombre *"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Ej: Cera líquida"
            />
            <Select
              label="Unidad"
              value={nuevo.unidad}
              onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}
              options={UNIDADES}
            />
            <Input
              label="Stock inicial"
              type="number"
              step="0.001"
              min="0"
              value={nuevo.stockInicial}
              onChange={(e) => setNuevo({ ...nuevo, stockInicial: e.target.value })}
              placeholder="Lo que tenés hoy"
            />
            <Input
              label="Stock mínimo (alerta)"
              type="number"
              step="0.001"
              min="0"
              value={nuevo.stockMinimo}
              onChange={(e) => setNuevo({ ...nuevo, stockMinimo: e.target.value })}
              placeholder="Avisar cuando baje de…"
            />
            <Input
              label="Costo por unidad (opcional)"
              type="number"
              step="0.01"
              min="0"
              value={nuevo.costoUnitario}
              onChange={(e) => setNuevo({ ...nuevo, costoUnitario: e.target.value })}
              placeholder="$ por unidad"
            />
            <div className="flex items-end">
              <Button type="submit" variant="primary" disabled={creando} className="w-full">
                {creando ? 'Guardando…' : 'Agregar al depósito'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Resumen de alertas */}
      {alertas > 0 && (
        <div className="mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-[#b9791a] font-medium">
          ⚠️ {alertas} producto(s) para reponer (sin stock o por debajo del mínimo).
        </div>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Buscar producto…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted">
            {isLoading ? 'Cargando…' : `${filtrados.length} producto(s)`}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted">Cargando stock…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-8 text-muted">
            {productos.length === 0
              ? 'Todavía no cargaste productos. Empezá con "+ Nuevo producto".'
              : 'Ningún producto coincide con la búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-aqua-line">
              <thead className="bg-aqua-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Mínimo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-aqua-line">
                {filtrados.map((p) => (
                  <tr key={p.id} className={!p.activo ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink">{p.nombre}</div>
                      <div className="text-xs text-muted">{p.unidad}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-ink">
                      {p.stockActual} <span className="text-xs font-normal text-muted">{p.unidad}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted">
                      {p.stockMinimo > 0 ? `${p.stockMinimo}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.sinStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger/12 text-danger">
                          Sin stock
                        </span>
                      ) : p.bajoStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warn/15 text-[#b9791a]">
                          Reponer
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-ok/15 text-[#0c8f68]">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link href={`/stock/${p.id}`}>
                        <Button size="sm" variant="secondary">Movimientos</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
