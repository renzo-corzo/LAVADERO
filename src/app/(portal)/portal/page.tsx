/**
 * Portal: Reporte de vehículos realizados para una Concesionaria
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

type ReporteClienteResponse = {
  cliente: { id: string; nombre: string }
  filtro: { desde: string; hasta: string; estado: string }
  resumen: { cantidadOTs: number; totalGeneral: number }
  ots: Array<{
    id: string
    fechaIngreso: string
    patente: string
    nombreCliente: string | null
    servicio: string
    extras: string[]
    estado: string
    total: number
  }>
}

function toYYYYMMDD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] || {})
  const escape = (v: any) => {
    const s = String(v ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const content = [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function PortalPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReporteClienteResponse | null>(null)

  const [desde, setDesde] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return toYYYYMMDD(d)
  })
  const [hasta, setHasta] = useState(() => toYYYYMMDD(new Date()))
  const [estado, setEstado] = useState('ENTREGADO')

  const puedeElegirCliente = session?.user.role === 'DUENO' || session?.user.role === 'ENCARGADO' || session?.user.role === 'ADMIN'
  const [clienteId, setClienteId] = useState<string>('')
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const isClientePortal = session?.user.role === 'CLIENTE'

  const cargar = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ desde, hasta })
      if (estado) params.set('estado', estado)
      if (puedeElegirCliente && clienteId) params.set('clienteId', clienteId)
      const res = await fetch(`/api/reportes/cliente?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Error al cargar reporte')
        setData(null)
        return
      }
      setData(json)
    } catch (e) {
      setError('Error al cargar reporte')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    // CLIENTE: carga automática (usa su clienteId del token)
    if (isClientePortal) {
      cargar()
      return
    }
    // DUENO/ENCARGADO: no cargar hasta elegir cliente
    setData(null)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isClientePortal])

  useEffect(() => {
    const cargarClientes = async () => {
      if (!puedeElegirCliente) return
      try {
        setLoadingClientes(true)
        const res = await fetch('/api/clientes?tipo=CONCESIONARIA&activo=true')
        const json = await res.json()
        if (res.ok) {
          setClientes((json?.clientes || []).map((c: any) => ({ id: c.id, nombre: c.nombre })))
        }
      } catch (e) {
        // silencioso
      } finally {
        setLoadingClientes(false)
      }
    }
    if (status === 'authenticated') cargarClientes()
  }, [status, puedeElegirCliente])

  const csvRows = useMemo(() => {
    if (!data) return []
    return data.ots.map((ot) => ({
      fecha: new Date(ot.fechaIngreso).toLocaleString('es-AR'),
      patente: ot.patente,
      cliente: ot.nombreCliente || '',
      servicio: ot.servicio,
      extras: ot.extras.join(' + '),
      estado: ot.estado,
      total: ot.total,
    }))
  }, [data])

  if (status === 'loading') return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Reportes</h1>
          <p className="text-gray-600 mt-1">
            {data?.cliente?.nombre ? `Concesionaria: ${data.cliente.nombre}` : 'Reporte de vehículos realizados'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => signOut({ callbackUrl: '/login' })}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <Card title="Filtros">
        <div className={`grid grid-cols-1 md:grid-cols-${puedeElegirCliente ? '5' : '4'} gap-4`}>
          {puedeElegirCliente && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concesionaria</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={loadingClientes}
              >
                <option value="">{loadingClientes ? 'Cargando...' : 'Seleccionar concesionaria'}</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Todos</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="LISTO">Listo</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="EN_COLA">En Cola</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={cargar} disabled={loading}>
              {loading ? 'Cargando...' : 'Aplicar'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (csvRows.length === 0) return
                downloadCsv(`reporte_${data?.cliente?.nombre || 'cliente'}_${desde}_${hasta}.csv`, csvRows)
              }}
              disabled={csvRows.length === 0}
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        {puedeElegirCliente && (
          <p className="text-xs text-gray-500 mt-3">
            Elegí una concesionaria para ver su reporte (como DUENO/ENCARGADO).
          </p>
        )}
      </Card>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Resumen">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">OTs</span>
              <span className="font-semibold">{data?.resumen?.cantidadOTs ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{formatCurrency(data?.resumen?.totalGeneral ?? 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Vehículos realizados">
          {!data ? (
            <div className="text-sm text-gray-500">Sin datos.</div>
          ) : data.ots.length === 0 ? (
            <div className="text-sm text-gray-500">No hay órdenes en el período seleccionado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extras</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.ots.map((ot) => (
                    <tr key={ot.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(ot.fechaIngreso).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{ot.patente}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ot.servicio}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{ot.extras.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(ot.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

