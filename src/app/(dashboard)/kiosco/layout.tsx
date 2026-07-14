/**
 * Layout especial para Modo Kiosco
 * Sin Header - Interfaz limpia y minimalista
 * Acceso: ENCARGADO y DUEÑO (quien opera / puede ser lavador)
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function KioscoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Modo Kiosco: ENCARGADO y DUEÑO (quien puede operar como lavador)
  const puedeKiosco = session.user.role === 'ENCARGADO' || session.user.role === 'DUENO' || session.user.role === 'ADMIN'
  if (!puedeKiosco) {
    redirect('/tablero')
  }

  // Layout sin Header - interfaz limpia
  return <>{children}</>
}
