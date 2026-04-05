/**
 * Configuración de NextAuth
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@/types'

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
      async authorize(credentials) {
        try {
          const dbUrl = process.env.DATABASE_URL?.trim() ?? ''
          if (!dbUrl || !isAllowedPostgresUrl(dbUrl)) {
            console.error(
              '[AUTH] rechazo_login motivo=DATABASE_URL_invalida (revisar .env vs variables de entorno del sistema)'
            )
            throw new Error('DATABASE_URL no configurada correctamente')
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

          const user = await prisma.usuario.findUnique({
            where: {
              usuario: usuarioLogin,
            },
          })

          if (!user) {
            console.error('[AUTH] rechazo_login motivo=usuario_no_encontrado usuario=', usuarioLogin)
            return null
          }

          if (!user.activo) {
            console.error('[AUTH] rechazo_login motivo=usuario_inactivo usuario=', usuarioLogin)
            return null
          }

          const isValidPassword = await compare(credentials.password, user.password)

          if (!isValidPassword) {
            console.error('[AUTH] rechazo_login motivo=password_incorrecta usuario=', usuarioLogin)
            return null
          }

          return {
            id: user.id,
            name: user.nombre,
            email: null, // No tenemos email en el modelo
            role: user.rol,
            clienteId: user.clienteId ?? null,
          }
        } catch {
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
        token.clienteId = (user as any).clienteId ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.clienteId = (token as any).clienteId ?? null
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

