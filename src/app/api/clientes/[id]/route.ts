/**
 * API: Gestión de un Cliente específico
 * GET: Obtener cliente por ID
 * PUT: Actualizar cliente
 * DELETE: Desactivar cliente (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

// GET: Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:view')) {
      return NextResponse.json({ error: 'No tienes permisos para ver clientes' }, { status: 403 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:edit')) {
      return NextResponse.json({ error: 'No tienes permisos para editar clientes' }, { status: 403 })
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!clienteExistente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { nombre, tipo, telefono, email, descuentoPorcentaje, prioridad, observaciones, activo } = body

    // Validaciones
    if (nombre && (typeof nombre !== 'string' || !nombre.trim())) {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    if (tipo && tipo !== 'CONCESIONARIA' && tipo !== 'WALK_IN') {
      return NextResponse.json(
        { error: 'El tipo debe ser CONCESIONARIA o WALK_IN' },
        { status: 400 }
      )
    }

    // Verificar que no exista otro cliente con el mismo nombre (si se está cambiando)
    if (nombre && nombre.trim() !== clienteExistente.nombre) {
      const clienteConMismoNombre = await prisma.cliente.findUnique({
        where: { nombre: nombre.trim() },
      })

      if (clienteConMismoNombre) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar cliente
    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(tipo && { tipo }),
        ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(descuentoPorcentaje !== undefined && { descuentoPorcentaje: descuentoPorcentaje ? Number(descuentoPorcentaje) : null }),
        ...(prioridad !== undefined && { prioridad: Number(prioridad) }),
        ...(observaciones !== undefined && { observaciones: observaciones?.trim() || null }),
        ...(activo !== undefined && { activo: activo }),
      },
    })

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'CLIENTE_UPDATED',
        entidad: 'Cliente',
        entidadId: cliente.id,
        datos: JSON.stringify({
          nombre: cliente.nombre,
          tipo: cliente.tipo,
          activo: cliente.activo,
        }),
      },
    })

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE: Desactivar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'usuario:delete')) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar clientes' }, { status: 403 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        ordenesTrabajo: {
          where: {
            estado: {
              notIn: ['ENTREGADO', 'CANCELADO'],
            },
          },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga OTs activas
    if (cliente.ordenesTrabajo.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el cliente porque tiene órdenes de trabajo activas' },
        { status: 400 }
      )
    }

    // Soft delete: desactivar
    const clienteDesactivado = await prisma.cliente.update({
      where: { id: params.id },
      data: { activo: false },
    })

    // Log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'CLIENTE_DELETED',
        entidad: 'Cliente',
        entidadId: cliente.id,
        datos: JSON.stringify({
          nombre: cliente.nombre,
        }),
      },
    })

    return NextResponse.json({ cliente: clienteDesactivado })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}




