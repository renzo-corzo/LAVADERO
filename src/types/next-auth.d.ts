/**
 * Extensión de tipos para NextAuth
 */

import { UserRole } from './index'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: UserRole
      empresaId?: string | null
      clienteId?: string | null
      sucursalId?: string | null
    }
  }

  interface User {
    id: string
    role: UserRole
    empresaId?: string | null
    clienteId?: string | null
    sucursalId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    empresaId?: string | null
    clienteId?: string | null
    sucursalId?: string | null
  }
}





