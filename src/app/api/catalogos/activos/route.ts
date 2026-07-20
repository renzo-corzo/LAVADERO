/**
 * API Route: Catálogos Activos
 * GET: Obtener servicios y extras activos (para crear OT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { empresaScope } from '@/lib/empresa'
import { filtroCatalogoSucursal } from '@/lib/catalogo-sucursal'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Scoping multi-tenant: cada empresa ve su propio catálogo
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    const filtroEmpresa = scope.empresaId ? { empresaId: scope.empresaId } : {}
    // Catálogo de la sucursal donde se carga la OT: lo propio + lo compartido.
    // Los empleados quedan siempre acotados a su sucursal.
    const sucursalId =
      session.user.sucursalId || request.nextUrl.searchParams.get('sucursalId')?.trim() || null
    const filtroSucursal = filtroCatalogoSucursal(sucursalId)

    const [servicios, extras] = await Promise.all([
      prisma.servicio.findMany({
        where: { activo: true, ...filtroEmpresa, ...filtroSucursal },
        orderBy: { nombre: 'asc' },
      }),
      prisma.extra.findMany({
        where: { activo: true, ...filtroEmpresa, ...filtroSucursal },
        orderBy: { nombre: 'asc' },
      }),
    ])

    return NextResponse.json({ servicios, extras })
  } catch (error) {
    console.error('Error al obtener catálogos activos:', error)
    return NextResponse.json(
      { error: 'Error al obtener catálogos' },
      { status: 500 }
    )
  }
}




