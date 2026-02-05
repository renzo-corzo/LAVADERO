/**
 * API Route: Extras
 * GET: Listar extras
 * POST: Crear extra
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { crearExtraSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const activo = searchParams.get('activo')

    const extras = await prisma.extra.findMany({
      where: activo !== null ? { activo: activo === 'true' } : undefined,
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(extras)
  } catch (error) {
    console.error('Error al obtener extras:', error)
    return NextResponse.json(
      { error: 'Error al obtener extras' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    // Validación con Zod
    const validationResult = crearExtraSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const { nombre, precio, duracionEstimada, descripcion } = validationResult.data
    const activo = body.activo !== undefined ? body.activo : true

    // Verificar que el nombre sea único
    const nombreTrim = nombre.trim()
    const existente = await prisma.extra.findUnique({
      where: { nombre: nombreTrim },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un extra con ese nombre' },
        { status: 400 }
      )
    }

    const extra = await prisma.extra.create({
      data: {
        nombre: nombreTrim,
        precio,
        duracionEstimada: duracionEstimada ?? null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
      },
    })

    return NextResponse.json(extra, { status: 201 })
  } catch (error) {
    console.error('Error al crear extra:', error)
    return NextResponse.json(
      { error: 'Error al crear extra' },
      { status: 500 }
    )
  }
}





