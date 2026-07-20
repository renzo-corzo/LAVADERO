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
import { empresaScope } from '@/lib/empresa'
import {
  filtroCatalogoSucursal,
  validarSucursalDeEmpresa,
  verificarNombreDisponible,
} from '@/lib/catalogo-sucursal'
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

    // Scoping multi-tenant
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const activo = searchParams.get('activo')
    // Filtro por sucursal: devuelve lo que se ofrece ahí (propio + compartido).
    // Los empleados con sucursal propia quedan siempre acotados a la suya.
    const sucursalId = session.user.sucursalId || searchParams.get('sucursalId')?.trim() || null

    const servicios = await prisma.servicio.findMany({
      where: {
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
        ...(activo !== null ? { activo: activo === 'true' } : {}),
        ...filtroCatalogoSucursal(sucursalId),
      },
      include: { sucursal: { select: { id: true, nombre: true } } },
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

    // Scoping multi-tenant: el catálogo pertenece a una empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    if (!scope.empresaId) {
      return NextResponse.json(
        { error: 'Debe indicar la empresa (contexto de plataforma)' },
        { status: 400 }
      )
    }

    // Sucursal donde se ofrece (null = todas). El empleado con sucursal propia
    // solo puede cargar en la suya.
    const sucursalId = session.user.sucursalId || validationResult.data.sucursalId || null
    const errSucursal = await validarSucursalDeEmpresa(sucursalId, scope.empresaId)
    if (errSucursal) {
      return NextResponse.json({ error: errSucursal }, { status: 400 })
    }

    // Nombre libre según las reglas del catálogo por sucursal
    const nombreTrim = nombre.trim()
    const errNombre = await verificarNombreDisponible('servicio', scope.empresaId, nombreTrim, sucursalId)
    if (errNombre) {
      return NextResponse.json({ error: errNombre }, { status: 400 })
    }

    const servicio = await prisma.servicio.create({
      data: {
        empresaId: scope.empresaId,
        sucursalId,
        nombre: nombreTrim,
        precio,
        duracionEstimada: duracionEstimada ?? null,
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





