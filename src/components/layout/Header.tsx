/**
 * Componente Header con navegación y usuario
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              🚗 Lavadero Sistema
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/tablero"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Tablero
              </Link>
              {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO' || session?.user.role === 'LAVADOR') && (
                <Link
                  href="/ots/nueva"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  + Nueva OT
                </Link>
              )}
              {(session?.user.role === 'ENCARGADO' || session?.user.role === 'DUENO') && (
                <>
                  <Link
                    href="/catalogos"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Catálogos
                  </Link>
                  <Link
                    href="/caja"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Caja
                  </Link>
                  <Link
                    href="/comisiones"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Comisiones
                  </Link>
                  <Link
                    href="/reportes"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Reportes
                  </Link>
                </>
              )}
              {session?.user.role === 'DUENO' && (
                <Link
                  href="/usuarios"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Usuarios
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{session?.user.name}</span>
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                {session?.user.role}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

