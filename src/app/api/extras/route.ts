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
import { empresaScope } from '@/lib/empresa'
import {
  filtroCatalogoSucursal,
  validarSucursalDeEmpresa,
  verificarNombreDisponible,
} from '@/lib/catalogo-sucursal'
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

    // Scoping multi-tenant
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const activo = searchParams.get('activo')
    // Filtro por sucursal: propio + compartido (empleados, siempre la suya)
    const sucursalId = session.user.sucursalId || searchParams.get('sucursalId')?.trim() || null

    const extras = await prisma.extra.findMany({
      where: {
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
        ...(activo !== null ? { activo: activo === 'true' } : {}),
        ...filtroCatalogoSucursal(sucursalId),
      },
      include: { sucursal: { select: { id: true, nombre: true } } },
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

    // Sucursal donde se ofrece (null = todas)
    const sucursalId = session.user.sucursalId || validationResult.data.sucursalId || null
    const errSucursal = await validarSucursalDeEmpresa(sucursalId, scope.empresaId)
    if (errSucursal) {
      return NextResponse.json({ error: errSucursal }, { status: 400 })
    }

    // Nombre libre según las reglas del catálogo por sucursal
    const nombreTrim = nombre.trim()
    const errNombre = await verificarNombreDisponible('extra', scope.empresaId, nombreTrim, sucursalId)
    if (errNombre) {
      return NextResponse.json({ error: errNombre }, { status: 400 })
    }

    const extra = await prisma.extra.create({
      data: {
        empresaId: scope.empresaId,
        sucursalId,
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





