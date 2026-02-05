/**
 * Layout del Portal de Concesionarias (rol CLIENTE)
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'CLIENTE' && session.user.role !== 'DUENO' && session.user.role !== 'ENCARGADO') {
    redirect('/dashboard')
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>
}

