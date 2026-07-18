/**
 * Página: Reporte de costos de stock (Etapa 2.5)
 * Compras del período, costo de insumos consumidos + margen, valor del
 * depósito y detalle por producto. Por sucursal y rango de fechas.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import { obtenerFechaLocal } from '@/lib/utils-fechas'
import { useSucursales } from '@/lib/hooks/useSucursales'

interface DetalleProducto {
  nombre: string
  unidad: string
  compradoCant: number
  compradoMonto: number
  consumidoCant: number
  consumidoMonto: number
}
interface Reporte {
  periodo: { desde: string; hasta: string }
  compras: number
  insumosConsumidos: number
  valorDeposito: number
  ventas: number
  margen: number
  detalle: DetalleProducto[]
}

export default function ReporteStockPage() {
  const { sucursales, sucursalPropia, puedeElegir } = useSucursales()
  const hoy = new Date()
  const haceUnMes = new Date()
  haceUnMes.setMonth(haceUnMes.getMonth() - 1)

  const [desde, setDesde] = useState(obtenerFechaLocal(haceUnMes))
  const [hasta, setHasta] = useState(obtenerFechaLocal(hoy))
  const [sucursalId, setSucursalId] = useState('')

  const sucursalEfectiva = sucursalPropia || sucursalId || ''

  const { data, isLoading } = useQuery<Reporte>({
    queryKey: ['stock-reporte', desde, hasta, sucursalEfectiva],
    queryFn: async () => {
      const qs = new URLSearchParams({ desde, hasta })
      if (sucursalEfectiva) qs.set('sucursalId', sucursalEfectiva)
      const res = await fetch(`/api/stock/reporte?${qs}`)
      if (!res.ok) throw new Error('Error al cargar el reporte')
      return res.json()
    },
  })

  const stat = (label: string, valor: number | undefined, color = 'text-ink', hint?: string) => (
    <Card>
      <div className="text-sm text-muted mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {valor != null ? formatCurrency(valor) : '—'}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </Card>
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/stock" className="text-brand hover:underline mb-2 inline-block">← Volver al depósito</Link>
        <h1 className="text-2xl font-bold text-ink">Costos de stock</h1>
        <p className="text-muted mt-1">Gasto en insumos, consumo de los lavados y margen del período.</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {puedeElegir && (
            <Select
              label="Sucursal"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              options={[
                { value: '', label: 'Todas las sucursales' },
                ...sucursales.map((s) => ({ value: s.id, label: s.nombre })),
              ]}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Desde</label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Hasta</label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted">Cargando reporte…</div>
      ) : !data ? (
        <div className="text-center py-8 text-muted">No se pudo cargar el reporte.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {stat('Compras del período', data.compras, 'text-ink', 'Plata gastada reponiendo insumos')}
            {stat('Insumos consumidos', data.insumosConsumidos, 'text-[#b9791a]', 'Costo de insumos usados en los lavados')}
            {stat('Ventas del período', data.ventas, 'text-ink', 'OTs entregadas y pagadas')}
            {stat('Margen bruto', data.margen, data.margen >= 0 ? 'text-[#0c8f68]' : 'text-danger', 'Ventas − insumos consumidos')}
          </div>

          <div className="mb-6">
            {stat('Valor del depósito hoy', data.valorDeposito, 'text-ink', 'Stock actual × costo (foto del momento)')}
          </div>

          <Card title="Detalle por producto">
            {data.detalle.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                Sin movimientos de compra ni consumo en el período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-aqua-line">
                  <thead className="bg-aqua-bg">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Comprado</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">$ Compras</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">Consumido</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted uppercase">$ Consumo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-aqua-line">
                    {data.detalle.map((d, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-ink">{d.nombre}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted">
                          {d.compradoCant > 0 ? `${d.compradoCant} ${d.unidad}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-ink">
                          {d.compradoMonto > 0 ? formatCurrency(d.compradoMonto) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-muted">
                          {d.consumidoCant > 0 ? `${Number(d.consumidoCant.toFixed(3))} ${d.unidad}` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-[#b9791a]">
                          {d.consumidoMonto > 0 ? formatCurrency(d.consumidoMonto) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="text-xs text-muted mt-4">
            💡 El margen es aproximado: compara las ventas de OTs entregadas con el costo de los
            insumos consumidos en el período. Requiere que los productos tengan costo cargado.
          </p>
        </>
      )}
    </div>
  )
}
