/**
 * Componente Header con navegación y usuario — sistema de diseño "Aqua"
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useSucursales } from '@/lib/hooks/useSucursales'

interface MenuItem {
  href: string
  label: string
  icon: string
  roles: string[]
  destacado?: boolean
}

// El ADMIN de plataforma administra (empresas, usuarios, reportes) pero NO
// opera el lavadero: sin tablero, OTs, catálogos, clientes ni caja.
const menuItems: MenuItem[] = [
  { href: '/tablero', label: 'Tablero', icon: '▦', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/ots/nueva', label: 'Nueva OT', icon: '＋', roles: ['DUENO', 'ENCARGADO'], destacado: true },
  { href: '/catalogos', label: 'Catálogos', icon: '📚', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/stock', label: 'Stock', icon: '📦', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/clientes', label: 'Clientes', icon: '👥', roles: ['DUENO', 'ENCARGADO'] },
  { href: '/contactos', label: 'Contactos', icon: '📇', roles: ['DUENO'] },
  { href: '/caja', label: 'Caja', icon: '💰', roles: ['DUENO', 'ENCARGADO'] },
  // Comisiones oculto: el negocio usa sueldo fijo (páginas y API siguen existiendo).
  { href: '/reportes', label: 'Reportes', icon: '📈', roles: ['DUENO', 'ENCARGADO', 'ADMIN'] },
  { href: '/sucursales', label: 'Sucursales', icon: '🏬', roles: ['DUENO', 'ADMIN'] },
  { href: '/usuarios', label: 'Usuarios', icon: '👤', roles: ['DUENO', 'ADMIN'] },
  { href: '/empresas', label: 'Empresas', icon: '🏢', roles: ['ADMIN'] },
]

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const role = session?.user.role
  const { sucursales } = useSucursales()

  // Cada rol ve solo su lista. "Sucursales" solo aparece para DUEÑO si su
  // empresa tiene más de una (con una sola la app se ve igual que siempre).
  const itemsFiltrados = menuItems.filter((item) => {
    if (!role) return false
    if (!item.roles.includes(role)) return false
    if (item.href === '/sucursales' && role === 'DUENO') return sucursales.length > 1
    return true
  })

  // El "inicio" del ADMIN es el panel de plataforma, no el tablero
  const homeHref = role === 'ADMIN' ? '/empresas' : '/tablero'

  return (
    <header className="bg-white/80 backdrop-blur border-b border-aqua-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra superior */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {/* Botón volver al menú (solo móvil vía CSS, y solo si no estás en el inicio) */}
            {pathname !== homeHref && (
              <Link href={homeHref} className="lg:hidden">
                <Button variant="secondary" size="sm">
                  ← Menú
                </Button>
              </Link>
            )}
            <Link href={homeHref} className="flex items-center gap-2.5 font-extrabold text-ink">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-blue text-white grid place-items-center text-lg shadow-brand">
                ≈
              </span>
              <span className="text-lg">Lavadero</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{session?.user.name}</div>
                <div className="text-xs text-muted capitalize">
                  {session?.user.role?.toLowerCase()}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-blue text-white grid place-items-center font-extrabold">
                {session?.user.name?.charAt(0).toUpperCase() ?? '·'}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Salir
            </Button>
          </div>
        </div>

        {/* Menú de navegación central - Solo en desktop */}
        <nav className="hidden lg:block pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {itemsFiltrados.map((item) => {
              const activo = pathname === item.href || pathname?.startsWith(item.href + '/')

              if (item.destacado) {
                return (
                  <Link key={item.href} href={item.href} className="ml-1">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-teal to-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-all hover:-translate-y-px hover:brightness-105">
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activo ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    activo
                      ? 'bg-white text-brand shadow-aqua ring-1 ring-aqua-line'
                      : 'text-muted hover:bg-white/70 hover:text-ink'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}
