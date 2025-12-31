/**
 * Configuración de NextAuth
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@/types'

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
          console.log('🔐 [AUTH] Intento de login para usuario:', credentials?.usuario)
          console.log('🔐 [AUTH] DATABASE_URL configurada:', !!process.env.DATABASE_URL)
          console.log('🔐 [AUTH] NEXTAUTH_SECRET configurado:', !!process.env.NEXTAUTH_SECRET)
          console.log('🔐 [AUTH] NEXTAUTH_URL:', process.env.NEXTAUTH_URL)

          if (!credentials?.usuario || !credentials?.password) {
            console.log('❌ [AUTH] Credenciales faltantes')
            return null
          }

          const user = await prisma.usuario.findUnique({
            where: {
              usuario: credentials.usuario,
            },
          })

          console.log('👤 [AUTH] Usuario encontrado:', user ? `Sí (${user.nombre}, activo: ${user.activo})` : 'No')

          if (!user || !user.activo) {
            console.log('❌ [AUTH] Usuario no encontrado o inactivo')
            return null
          }

          // Verificar contraseña
          const isValidPassword = await compare(credentials.password, user.password)
          console.log('🔑 [AUTH] Contraseña válida:', isValidPassword)

          if (!isValidPassword) {
            console.log('❌ [AUTH] Contraseña incorrecta')
            return null
          }

          console.log('✅ [AUTH] Login exitoso para:', user.usuario)
          return {
            id: user.id,
            name: user.nombre,
            email: null, // No tenemos email en el modelo
            role: user.rol,
          }
        } catch (error) {
          console.error('❌ [AUTH] Error en authorize:', error)
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
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

