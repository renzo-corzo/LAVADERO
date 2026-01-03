/**
 * API: Gestión de Clientes
 * GET: Listar clientes
 * POST: Crear nuevo cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

// GET: Listar clientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo DUEÑO y ENCARGADO pueden ver clientes
    if (!hasPermission(session.user.role, 'usuario:view')) {
      return NextResponse.json({ error: 'No tienes permisos para ver clientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'CONCESIONARIA' | 'WALK_IN' | null (todos)
    const activo = searchParams.get('activo') // 'true' | 'false' | null (todos)

    const where: any = {}
    if (tipo) {
      where.tipo = tipo
    }
    if (activo !== null) {
      where.activo = activo === 'true'
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: [
        { prioridad: 'desc' }, // Mayor prioridad primero
        { nombre: 'asc' },
      ],
    })

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error('Error al listar clientes:', error)
    return NextResponse.json(
      { error: 'Error al listar clientes' },
      { status: 500 }
    )
  }
}

// POST: Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo DUEÑO puede crear clientes
    if (!hasPermission(session.user.role, 'usuario:create')) {
      return NextResponse.json({ error: 'No tienes permisos para crear clientes' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, tipo, telefono, email, descuentoPorcentaje, prioridad, observaciones } = body

    // Validaciones
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    if (!tipo || (tipo !== 'CONCESIONARIA' && tipo !== 'WALK_IN')) {
      return NextResponse.json(
        { error: 'El tipo debe ser CONCESIONARIA o WALK_IN' },
        { status: 400 }
      )
    }

    // Verificar que no exista un cliente con el mismo nombre
    const clienteExistente = await prisma.cliente.findUnique({
      where: { nombre: nombre.trim() },
    })

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con ese nombre' },
        { status: 400 }
      )
    }

    // Crear cliente
    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        tipo: tipo,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        descuentoPorcentaje: descuentoPorcentaje ? Number(descuentoPorcentaje) : null,
        prioridad: prioridad ? Number(prioridad) : 0,
        observaciones: observaciones?.trim() || null,
        activo: true,
      },
    })

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'CLIENTE_CREATED',
        entidad: 'Cliente',
        entidadId: cliente.id,
        datos: JSON.stringify({
          nombre: cliente.nombre,
          tipo: cliente.tipo,
        }),
      },
    })

    return NextResponse.json({ cliente }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cliente:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: 'Error al crear cliente',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

