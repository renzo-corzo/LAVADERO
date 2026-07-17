/**
 * Página: Contactos (para campañas)
 * Consolida los teléfonos de todos los clientes de la empresa (desde las OTs),
 * con búsqueda, cantidad de visitas y exportación a CSV.
 */

'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { telefonoParaWhatsApp } from '@/lib/whatsapp'

interface Contacto {
  telefono: string
  telefonoNormalizado: string
  nombre: string
  visitas: number
  ultimaVisita: string
  ultimaPatente: string | null
  tipo: 'CONCESIONARIA' | 'PARTICULAR'
}

export default function ContactosPage() {
  const [busqueda, setBusqueda] = useState('')

  const { data, isLoading } = useQuery<{ total: number; contactos: Contacto[] }>({
    queryKey: ['contactos'],
    queryFn: async () => {
      const res = await fetch('/api/contactos')
      if (!res.ok) throw new Error('Error al cargar contactos')
      return res.json()
    },
  })

  const contactos = data?.contactos ?? []

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return contactos
    const qDigits = q.replace(/\D/g, '')
    return contactos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (qDigits && c.telefonoNormalizado.includes(qDigits)) ||
        (c.ultimaPatente || '').toLowerCase().includes(q)
    )
  }, [contactos, busqueda])

  const exportarCSV = () => {
    if (filtrados.length === 0) {
      toast.error('No hay contactos para exportar')
      return
    }
    const encabezado = ['Nombre', 'Teléfono', 'WhatsApp', 'Tipo', 'Visitas', 'Última visita', 'Última patente']
    const filas = filtrados.map((c) => [
      c.nombre,
      c.telefono,
      telefonoParaWhatsApp(c.telefono) || c.telefonoNormalizado,
      c.tipo === 'CONCESIONARIA' ? 'Concesionaria' : 'Particular',
      String(c.visitas),
      new Date(c.ultimaVisita).toLocaleDateString('es-AR'),
      c.ultimaPatente || '',
    ])
    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [encabezado, ...filas].map((f) => f.map(escapar).join(',')).join('\r\n')
    // BOM para que Excel abra bien los acentos
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contactos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filtrados.length} contacto(s) exportado(s)`)
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Contactos</h1>
          <p className="text-muted mt-1">
            Teléfonos de tus clientes para futuras campañas. Se arman solos con cada OT.
          </p>
        </div>
        <Button variant="primary" onClick={exportarCSV} disabled={isLoading || filtrados.length === 0}>
          ⬇ Exportar CSV
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Buscar por nombre, teléfono o patente…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted">
            {isLoading ? 'Cargando…' : `${filtrados.length} de ${contactos.length} contacto(s)`}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted">Cargando contactos…</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-8 text-muted">
            {contactos.length === 0
              ? 'Todavía no hay teléfonos cargados. Se irán sumando con cada OT.'
              : 'Ningún contacto coincide con la búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-aqua-line">
              <thead className="bg-aqua-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">Visitas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Última visita</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-aqua-line">
                {filtrados.map((c) => {
                  const wa = telefonoParaWhatsApp(c.telefono)
                  return (
                    <tr key={c.telefonoNormalizado}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-ink">{c.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted">{c.telefono}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            c.tipo === 'CONCESIONARIA'
                              ? 'bg-brand/12 text-brand'
                              : 'bg-ink/10 text-ink'
                          }`}
                        >
                          {c.tipo === 'CONCESIONARIA' ? 'Concesionaria' : 'Particular'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-ink">{c.visitas}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted">
                        {new Date(c.ultimaVisita).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {wa ? (
                          <a
                            href={`https://wa.me/${wa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[#0c8f68] hover:underline"
                          >
                            Abrir chat
                          </a>
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
