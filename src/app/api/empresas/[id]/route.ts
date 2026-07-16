/**
 * API Route: Empresa individual (plataforma)
 * PUT: Renombrar / activar-desactivar empresa (solo ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const existente = await prisma.empresa.findUnique({ where: { id: params.id } })
    if (!existente) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : existente.nombre
    const activo = typeof body.activo === 'boolean' ? body.activo : existente.activo

    if (!nombre || nombre.length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (nombre !== existente.nombre) {
      const conMismoNombre = await prisma.empresa.findUnique({ where: { nombre } })
      if (conMismoNombre && conMismoNombre.id !== params.id) {
        return NextResponse.json(
          { error: 'Ya existe una empresa con ese nombre' },
          { status: 400 }
        )
      }
    }

    const empresa = await prisma.empresa.update({
      where: { id: params.id },
      data: { nombre, activo },
      select: { id: true, nombre: true, activo: true },
    })

    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'EMPRESA_UPDATED',
        entidad: 'Empresa',
        entidadId: empresa.id,
        datos: JSON.stringify({ nombre: empresa.nombre, activo: empresa.activo }),
      },
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error('Error al editar empresa:', error)
    return NextResponse.json({ error: 'Error al editar empresa' }, { status: 500 })
  }
}
