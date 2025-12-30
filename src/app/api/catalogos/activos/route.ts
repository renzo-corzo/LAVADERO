/**
 * API Route: Catálogos Activos
 * GET: Obtener servicios y extras activos (para crear OT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [servicios, extras] = await Promise.all([
      prisma.servicio.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.extra.findMany({
        where: { activo: true },
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

