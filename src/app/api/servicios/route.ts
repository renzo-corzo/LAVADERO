/**
 * API Route: Servicios
 * GET: Listar servicios
 * POST: Crear servicio
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { crearServicioSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo ENCARGADO y DUEÑO pueden ver servicios
    if (!hasPermission(session.user.role, 'servicio:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const activo = searchParams.get('activo')

    const servicios = await prisma.servicio.findMany({
      where: activo !== null ? { activo: activo === 'true' } : undefined,
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(servicios)
  } catch (error) {
    console.error('Error al obtener servicios:', error)
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
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
    const validationResult = crearServicioSchema.safeParse(body)
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

    const { nombre, precio, duracionEstimada, tipoVehiculo, descripcion } = validationResult.data
    const activo = body.activo !== undefined ? body.activo : true

    // Verificar que el nombre sea único
    const existente = await prisma.servicio.findUnique({
      where: { nombre },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con ese nombre' },
        { status: 400 }
      )
    }

    const servicio = await prisma.servicio.create({
      data: {
        nombre,
        precio: parseFloat(precio),
        duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : null,
        tipoVehiculo: tipoVehiculo || null,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true,
      },
    })

    return NextResponse.json(servicio, { status: 201 })
  } catch (error) {
    console.error('Error al crear servicio:', error)
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    )
  }
}





