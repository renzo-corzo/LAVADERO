/**
 * Middleware de Next.js para proteger rutas
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verificar permisos según ruta
    const role = token.role

    // Portal de clientes (rol CLIENTE)
    if (path.startsWith('/portal')) {
      if (role !== 'CLIENTE' && role !== 'DUENO' && role !== 'ENCARGADO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // CLIENTE solo puede acceder al portal
    if (role === 'CLIENTE' && !path.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }

    // Rutas solo para DUENO
    if (path.startsWith('/usuarios') || path.startsWith('/config')) {
      if (role !== 'DUENO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Rutas para ENCARGADO y DUENO (no LAVADOR)
    if (
      path.startsWith('/caja') ||
      path.startsWith('/comisiones') ||
      path.startsWith('/reportes') ||
      path.startsWith('/catalogos')
    ) {
      if (role === 'LAVADOR') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }
    
    // LAVADOR no puede crear ni editar OTs (solo ENCARGADO y DUENO)
    if (path.startsWith('/ots/nueva') || (path.startsWith('/ots/') && path.match(/\/ots\/[^/]+\/editar/))) {
      if (role === 'LAVADOR') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tablero/:path*',
    '/kiosco/:path*',
    '/ots/:path*',
    '/caja/:path*',
    '/comisiones/:path*',
    '/reportes/:path*',
    '/catalogos/:path*',
    '/usuarios/:path*',
    '/config/:path*',
    '/portal/:path*',
  ],
}

