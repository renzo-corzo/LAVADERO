import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Redirigir al tablero (menú principal) en lugar del dashboard
    redirect('/tablero')
  } else {
    redirect('/login')
  }
}

