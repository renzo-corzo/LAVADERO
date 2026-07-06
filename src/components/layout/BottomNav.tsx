/**
 * Barra de navegación inferior (solo móvil) — sistema de diseño "Aqua".
 * Se oculta en desktop (lg:hidden), donde se usa la nav del Header.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Tab {
  href: string
  label: string
  icon: string
  roles: string[]
  destacado?: boolean
}

const tabs: Tab[] = [
  { href: '/tablero', label: 'Tablero', icon: '▦', roles: ['DUENO', 'ENCARGADO', 'LAVADOR'] },
  { href: '/caja', label: 'Caja', icon: '💰', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/ots/nueva', label: 'Nueva OT', icon: '＋', roles: ['DUENO', 'ENCARGADO'], destacado: true },
  { href: '/clientes', label: 'Clientes', icon: '👥', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/reportes', label: 'Reportes', icon: '📈', roles: ['DUENO', 'ENCARGADO'] },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user.role

  const visibles = tabs.filter((t) => role && t.roles.includes(role))
  if (visibles.length === 0) return null

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-aqua-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {visibles.map((tab) => {
          const activo = pathname === tab.href || pathname?.startsWith(tab.href + '/')

          if (tab.destacado) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center px-3"
              >
                <span className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-blue text-white grid place-items-center text-2xl shadow-brand">
                  {tab.icon}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold text-muted">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={activo ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-semibold transition-colors ${
                activo ? 'text-brand' : 'text-muted'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
