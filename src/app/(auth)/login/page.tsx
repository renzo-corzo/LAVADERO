/**
 * Página de Login
 * US-001: Autenticación de Usuarios
 */

'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { getSession } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        usuario,
        password,
        redirect: false,
      })

      if (result?.error) {
        // NextAuth devuelve 'CredentialsSignin' cuando authorize retorna null
        // (usuario/clave inválidos). Si es otro mensaje, viene de un throw nuestro
        // (rate limit, servicio no disponible) y debe mostrarse tal cual.
        setError(
          result.error === 'CredentialsSignin'
            ? 'Usuario o contraseña incorrectos'
            : result.error
        )
      } else {
        // Redirigir según rol
        const session = await getSession()
        if (session?.user?.role === 'CLIENTE') {
          router.push('/portal')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-7">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-blue text-white grid place-items-center text-2xl shadow-brand mb-4">
            ≈
          </span>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Lavadero</h1>
          <p className="mt-1 text-muted text-sm">Iniciá sesión para continuar</p>
        </div>

        <form
          className="bg-white border border-aqua-line rounded-2xl shadow-aqua-lg p-6 sm:p-7 space-y-5"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              role="alert"
              className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-ink mb-1.5">
                Usuario
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white border border-aqua-line rounded-xl text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                placeholder="Ingresá tu usuario"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-white border border-aqua-line rounded-xl text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                placeholder="Ingresá tu contraseña"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}





