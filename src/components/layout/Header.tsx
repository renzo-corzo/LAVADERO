/**
 * Componente Header con navegación y usuario
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const menuItems = [
    {
      href: '/tablero',
      label: 'Tablero',
      icon: '📋',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    },
    {
      href: '/ots/nueva',
      label: 'Nueva OT',
      icon: '➕',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
      destacado: true,
      grande: true,
    },
    {
      href: '/catalogos',
      label: 'Catálogos',
      icon: '📚',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200',
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: '👥',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      href: '/caja',
      label: 'Caja',
      icon: '💰',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    {
      href: '/comisiones',
      label: 'Comisiones',
      icon: '💵',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
    },
    {
      href: '/reportes',
      label: 'Reportes',
      icon: '📈',
      roles: ['DUENO', 'ENCARGADO'],
      color: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
    },
    {
      href: '/usuarios',
      label: 'Usuarios',
      icon: '👤',
      roles: ['DUENO'],
      color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
    },
  ]

  const itemsFiltrados = menuItems.filter((item) =>
    session?.user.role && item.roles.includes(session.user.role as 'DUENO' | 'ENCARGADO')
  )

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barra superior */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Botón volver al menú (solo móvil vía CSS, y solo si no estás en /tablero) */}
            {pathname !== '/tablero' && (
              <Link href="/tablero" className="lg:hidden">
                <Button variant="secondary" size="sm">
                  ← Menú
                </Button>
              </Link>
            )}
            <Link href="/tablero" className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span>🚗</span>
              <span className="hidden sm:inline">Lavadero Sistema</span>
              <span className="sm:hidden">Lavadero</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 hidden sm:flex items-center space-x-2">
              <span className="font-medium">{session?.user.name}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {session?.user.role}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Menú de navegación central - Solo en desktop */}
        <nav className="hidden lg:block py-4 border-t">
          <div className="flex flex-wrap justify-center gap-3">
            {itemsFiltrados.map((item) => {
              const estaActivo = pathname === item.href || pathname?.startsWith(item.href + '/')
              const esGrande = item.grande || false
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 rounded-lg font-medium
                    transition-all duration-200 border-2
                    ${esGrande ? 'px-6 py-4' : 'px-4 py-2.5'}
                    ${item.destacado ? 'shadow-lg' : ''}
                    ${estaActivo 
                      ? `${item.color.replace('hover:', '')} border-2 border-current shadow-md` 
                      : `${item.color} border-transparent hover:shadow-md`
                    }
                  `}
                >
                  <span className={esGrande ? 'text-2xl' : 'text-xl'}>{item.icon}</span>
                  <span className={esGrande ? 'text-base font-semibold' : 'text-sm'}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Menú móvil - Oculto, se usa la página de menú principal */}
        {/* El menú móvil ahora está en la página principal del tablero */}
      </div>
    </header>
  )
}

