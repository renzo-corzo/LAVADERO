/**
 * API Route: Sucursal individual
 * PUT: Editar sucursal (solo DUEÑO/ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { empresaScope } from '@/lib/empresa'
import { crearSucursalSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'DUENO' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const validation = crearSucursalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    // Scoping multi-tenant: solo sucursales de la propia empresa
    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const existente = await prisma.sucursal.findFirst({
      where: {
        id: params.id,
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
      },
    })
    if (!existente) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
    }

    const { nombre, direccion } = validation.data
    const activo = typeof body.activo === 'boolean' ? body.activo : existente.activo

    // No permitir desactivar la última sucursal activa DE LA EMPRESA
    if (!activo) {
      const activas = await prisma.sucursal.count({
        where: { activo: true, empresaId: existente.empresaId },
      })
      if (activas <= 1 && existente.activo) {
        return NextResponse.json(
          { error: 'No se puede desactivar la única sucursal activa' },
          { status: 400 }
        )
      }
    }

    const conMismoNombre = await prisma.sucursal.findUnique({
      where: { empresaId_nombre: { empresaId: existente.empresaId, nombre } },
    })
    if (conMismoNombre && conMismoNombre.id !== params.id) {
      return NextResponse.json({ error: 'Ya existe una sucursal con ese nombre' }, { status: 400 })
    }

    const sucursal = await prisma.sucursal.update({
      where: { id: params.id },
      data: { nombre: nombre.trim(), direccion: direccion?.trim() || null, activo },
      select: { id: true, nombre: true, direccion: true, activo: true },
    })

    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'SUCURSAL_UPDATED',
        entidad: 'Sucursal',
        entidadId: sucursal.id,
        datos: JSON.stringify({ nombre: sucursal.nombre, activo: sucursal.activo }),
      },
    })

    return NextResponse.json(sucursal)
  } catch (error) {
    console.error('Error al editar sucursal:', error)
    return NextResponse.json({ error: 'Error al editar sucursal' }, { status: 500 })
  }
}
