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
      if (role !== 'CLIENTE' && role !== 'DUENO' && role !== 'ENCARGADO' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // CLIENTE solo puede acceder al portal
    if (role === 'CLIENTE' && !path.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }

    // Rutas solo para DUENO / ADMIN
    if (path.startsWith('/usuarios') || path.startsWith('/config') || path.startsWith('/sucursales')) {
      if (role !== 'DUENO' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Panel de plataforma: solo ADMIN
    if (path.startsWith('/empresas')) {
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }

    // El ADMIN de plataforma administra, no opera: sin tablero, OTs,
    // catálogos, clientes, caja ni kiosco. Su inicio es /empresas.
    if (role === 'ADMIN') {
      if (
        path.startsWith('/tablero') ||
        path.startsWith('/ots') ||
        path.startsWith('/catalogos') ||
        path.startsWith('/clientes') ||
        path.startsWith('/contactos') ||
        path.startsWith('/caja') ||
        path.startsWith('/kiosco') ||
        path.startsWith('/dashboard')
      ) {
        return NextResponse.redirect(new URL('/empresas', req.url))
      }
    }

    // Contactos (campañas): solo DUEÑO
    if (path.startsWith('/contactos')) {
      if (role !== 'DUENO') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }

    // Configuración de comisiones: solo DUEÑO / ADMIN
    if (path.startsWith('/comisiones/configurar')) {
      if (role !== 'DUENO' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/comisiones', req.url))
      }
    }

    // Rutas para ENCARGADO y DUENO (no LAVADOR)
    if (
      path.startsWith('/caja') ||
      path.startsWith('/comisiones') ||
      path.startsWith('/reportes') ||
      path.startsWith('/contactos') ||
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
    '/clientes/:path*',
    '/caja/:path*',
    '/comisiones/:path*',
    '/reportes/:path*',
    '/contactos/:path*',
    '/catalogos/:path*',
    '/usuarios/:path*',
    '/sucursales/:path*',
    '/empresas/:path*',
    '/config/:path*',
    '/portal/:path*',
  ],
}

