/**
 * Barra de navegación inferior (solo móvil) — sistema de diseño "Aqua".
 * 4 accesos fijos + botón "Más" que abre un panel con TODAS las secciones
 * del rol. Se oculta en desktop (lg:hidden), donde se usa la nav del Header.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useSucursales } from '@/lib/hooks/useSucursales'

interface Destino {
  href: string
  label: string
  icon: string
  roles: string[]
  soloMultiSucursal?: boolean
}

// Todas las secciones del sistema (mismas reglas que el menú de escritorio).
const DESTINOS: Destino[] = [
  { href: '/tablero', label: 'Tablero', icon: '▦', roles: ['DUENO', 'ENCARGADO', 'LAVADOR'] },
  { href: '/ots/nueva', label: 'Nueva OT', icon: '＋', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/caja', label: 'Caja', icon: '💰', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/clientes', label: 'Clientes', icon: '👥', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/catalogos', label: 'Catálogos', icon: '📚', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/stock', label: 'Stock', icon: '📦', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/contactos', label: 'Contactos', icon: '📇', roles: ['DUENO'] },
  { href: '/reportes', label: 'Reportes', icon: '📈', roles: ['DUENO', 'ENCARGADO', 'ADMIN'] },
  { href: '/sucursales', label: 'Sucursales', icon: '🏬', roles: ['DUENO', 'ADMIN'], soloMultiSucursal: true },
  { href: '/usuarios', label: 'Usuarios', icon: '👤', roles: ['DUENO', 'ADMIN'] },
  { href: '/empresas', label: 'Empresas', icon: '🏢', roles: ['ADMIN'] },
]

// Orden de los accesos fijos de la barra por rol (el "＋" va destacado al centro).
const BARRA_POR_ROL: Record<string, { izquierda: string[]; centro?: string; derecha: string[] }> = {
  DUENO: { izquierda: ['/tablero', '/caja'], centro: '/ots/nueva', derecha: ['/clientes'] },
  ENCARGADO: { izquierda: ['/tablero', '/caja'], centro: '/ots/nueva', derecha: ['/clientes'] },
  ADMIN: { izquierda: ['/empresas'], derecha: ['/reportes'] },
  LAVADOR: { izquierda: ['/tablero'], derecha: [] },
}

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user.role
  const { sucursales } = useSucursales()
  const [masAbierto, setMasAbierto] = useState(false)

  if (!role) return null

  // Destinos permitidos para el rol (respetando la regla de Sucursales)
  const permitidos = DESTINOS.filter((d) => {
    if (!d.roles.includes(role)) return false
    if (d.soloMultiSucursal && role === 'DUENO') return sucursales.length > 1
    return true
  })
  const buscar = (href: string) => permitidos.find((d) => d.href === href)

  const config = BARRA_POR_ROL[role] ?? { izquierda: [], derecha: [] }
  const izquierda = config.izquierda.map(buscar).filter(Boolean) as Destino[]
  const derecha = config.derecha.map(buscar).filter(Boolean) as Destino[]
  const centro = config.centro ? buscar(config.centro) : undefined

  // Todo lo que no está en la barra va al panel "Más"
  const enBarra = new Set([...izquierda, ...derecha, ...(centro ? [centro] : [])].map((d) => d.href))
  const enMas = permitidos.filter((d) => !enBarra.has(d.href))

  const esActivo = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const TabLink = ({ d }: { d: Destino }) => (
    <Link
      href={d.href}
      onClick={() => setMasAbierto(false)}
      aria-current={esActivo(d.href) ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-semibold transition-colors ${
        esActivo(d.href) ? 'text-brand' : 'text-muted'
      }`}
    >
      <span className="text-xl leading-none">{d.icon}</span>
      {d.label}
    </Link>
  )

  return (
    <>
      {/* Panel "Más": scrim + hoja inferior con todas las secciones */}
      {masAbierto && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
          onClick={() => setMasAbierto(false)}
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-aqua-lg p-4 pb-6 animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Todas las secciones"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-aqua-line" />
            <h3 className="text-[15px] font-bold text-ink">Todo el sistema</h3>
            <p className="mb-4 text-xs text-muted">Accesos rápidos a cada sección</p>

            <div className="grid grid-cols-3 gap-2.5">
              {enMas.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  onClick={() => setMasAbierto(false)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition-colors ${
                    esActivo(d.href)
                      ? 'border-brand/40 bg-brand/5'
                      : 'border-aqua-line bg-aqua-bg active:bg-white'
                  }`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-teal/12 text-xl">
                    {d.icon}
                  </span>
                  <span className="text-[11px] font-semibold text-ink">{d.label}</span>
                </Link>
              ))}

              <button
                type="button"
                onClick={() => {
                  setMasAbierto(false)
                  signOut({ callbackUrl: '/login' })
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-aqua-line bg-aqua-bg p-3.5 text-center active:bg-white"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger/12 text-xl">🚪</span>
                <span className="text-[11px] font-semibold text-ink">Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-aqua-line bg-white/90 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navegación principal"
      >
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {izquierda.map((d) => (
            <TabLink key={d.href} d={d} />
          ))}

          {centro && (
            <Link
              href={centro.href}
              onClick={() => setMasAbierto(false)}
              aria-label={centro.label}
              className="flex flex-col items-center justify-center px-3"
            >
              <span className="-mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-blue text-2xl text-white shadow-brand">
                {centro.icon}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-muted">{centro.label}</span>
            </Link>
          )}

          {derecha.map((d) => (
            <TabLink key={d.href} d={d} />
          ))}

          {/* Botón "Más": abre el panel con el resto de las secciones */}
          {enMas.length > 0 && (
            <button
              type="button"
              onClick={() => setMasAbierto((v) => !v)}
              aria-expanded={masAbierto}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-semibold transition-colors ${
                masAbierto ? 'text-brand' : 'text-muted'
              }`}
            >
              <span className="text-xl leading-none tracking-widest">•••</span>
              Más
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
