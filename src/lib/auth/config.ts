/**
 * Configuración de NextAuth
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@/types'
import {
  checkLoginRateLimit,
  registrarFalloLogin,
  registrarLoginExitoso,
} from './rate-limit'

/** Error de login con mensaje seguro para mostrar al usuario (rate limit, config). */
class LoginError extends Error {}

function isAllowedPostgresUrl(raw: string): boolean {
  const url = raw.trim()
  return (
    url.startsWith('postgresql://') ||
    url.startsWith('postgres://') ||
    url.startsWith('prisma+postgres://') ||
    url.startsWith('prisma+postgresql://')
  )
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          const dbUrl = process.env.DATABASE_URL?.trim() ?? ''
          if (!dbUrl || !isAllowedPostgresUrl(dbUrl)) {
            console.error(
              '[AUTH] rechazo_login motivo=DATABASE_URL_invalida (revisar .env vs variables de entorno del sistema)'
            )
            throw new LoginError(
              'El servicio no está disponible en este momento. Intentá más tarde.'
            )
          }

          if (!credentials?.usuario || !credentials?.password) {
            console.error('[AUTH] rechazo_login motivo=credenciales_vacias')
            return null
          }

          const usuarioLogin = credentials.usuario.trim()
          if (!usuarioLogin) {
            console.error('[AUTH] rechazo_login motivo=usuario_solo_espacios')
            return null
          }

          // Clave de rate limit: usuario + IP de origen (best-effort detrás de proxy).
          const ip =
            (req?.headers?.['x-forwarded-for'] as string | undefined)
              ?.split(',')[0]
              ?.trim() ||
            (req?.headers?.['x-real-ip'] as string | undefined) ||
            'desconocida'
          const claveRate = `${usuarioLogin.toLowerCase()}|${ip}`

          const limite = checkLoginRateLimit(claveRate)
          if (!limite.allowed) {
            const segundos = Math.ceil((limite.retryAfterMs ?? 0) / 1000)
            console.error('[AUTH] rechazo_login motivo=rate_limit')
            throw new LoginError(
              `Demasiados intentos fallidos. Esperá ${segundos} segundos antes de reintentar.`
            )
          }

          const user = await prisma.usuario.findUnique({
            where: {
              usuario: usuarioLogin,
            },
          })

          if (!user) {
            registrarFalloLogin(claveRate)
            console.error('[AUTH] rechazo_login motivo=usuario_no_encontrado')
            return null
          }

          if (!user.activo) {
            console.error('[AUTH] rechazo_login motivo=usuario_inactivo')
            return null
          }

          const isValidPassword = await compare(credentials.password, user.password)

          if (!isValidPassword) {
            registrarFalloLogin(claveRate)
            console.error('[AUTH] rechazo_login motivo=password_incorrecta')
            return null
          }

          registrarLoginExitoso(claveRate)

          return {
            id: user.id,
            name: user.nombre,
            email: null, // No tenemos email en el modelo
            role: user.rol,
            empresaId: user.empresaId ?? null,
            clienteId: user.clienteId ?? null,
            sucursalId: user.sucursalId ?? null,
          }
        } catch (error) {
          // Solo propagamos errores controlados (rate limit, servicio no disponible)
          // con mensaje seguro. Cualquier otro error interno se oculta al cliente.
          if (error instanceof LoginError) throw error
          console.error('[AUTH] rechazo_login motivo=error_interno')
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.empresaId = (user as any).empresaId ?? null
        token.clienteId = (user as any).clienteId ?? null
        token.sucursalId = (user as any).sucursalId ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.empresaId = (token as any).empresaId ?? null
        session.user.clienteId = (token as any).clienteId ?? null
        session.user.sucursalId = (token as any).sucursalId ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (según RN-082)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

