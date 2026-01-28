/**
 * API Route: Configuración de Comisiones
 * GET: Obtener configuración de comisiones por empleado
 * POST: Crear o actualizar configuración de comisiones
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'comision:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const empleadoId = request.nextUrl.searchParams.get('empleadoId')

    if (empleadoId) {
      // Obtener configuración de un empleado específico
      const config = await prisma.configComision.findUnique({
        where: { empleadoId },
        include: { empleado: { select: { id: true, nombre: true, usuario: true } } },
      })

      if (!config) {
        return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
      }

      return NextResponse.json({
        ...config,
        porcentaje: Number(config.porcentaje),
        porcentajePorServicio: config.porcentajePorServicio
          ? JSON.parse(config.porcentajePorServicio)
          : null,
      })
    } else {
      // Obtener todas las configuraciones
      const configs = await prisma.configComision.findMany({
        include: { empleado: { select: { id: true, nombre: true, usuario: true } } },
        orderBy: { empleado: { nombre: 'asc' } },
      })

      return NextResponse.json(
        configs.map((config) => ({
          ...config,
          porcentaje: Number(config.porcentaje),
          porcentajePorServicio: config.porcentajePorServicio
            ? JSON.parse(config.porcentajePorServicio)
            : null,
        }))
      )
    }
  } catch (error) {
    console.error('Error al obtener configuración de comisiones:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración de comisiones' },
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

    if (!hasPermission(session.user.role, 'comision:config')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { empleadoId, modelo, porcentaje, porcentajePorServicio, activo } = body

    if (!empleadoId || !modelo || porcentaje === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: empleadoId, modelo, porcentaje' },
        { status: 400 }
      )
    }

    // Validar que el empleado existe
    const empleado = await prisma.usuario.findUnique({
      where: { id: empleadoId },
    })

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Validar porcentaje
    if (porcentaje < 0 || porcentaje > 100) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 100' },
        { status: 400 }
      )
    }

    // Crear o actualizar configuración (upsert)
    const config = await prisma.configComision.upsert({
      where: { empleadoId },
      update: {
        modelo: modelo as any,
        porcentaje: parseFloat(porcentaje),
        porcentajePorServicio: porcentajePorServicio
          ? JSON.stringify(porcentajePorServicio)
          : null,
        activo: activo !== undefined ? activo : true,
      },
      create: {
        empleadoId,
        modelo: modelo as any,
        porcentaje: parseFloat(porcentaje),
        porcentajePorServicio: porcentajePorServicio
          ? JSON.stringify(porcentajePorServicio)
          : null,
        activo: activo !== undefined ? activo : true,
      },
      include: { empleado: { select: { id: true, nombre: true, usuario: true } } },
    })

    // Registrar en log de auditoría
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: 'COMISION_CONFIG_UPDATED',
        entidad: 'ConfigComision',
        entidadId: config.id,
        datos: JSON.stringify({
          empleadoId,
          modelo,
          porcentaje,
          activo,
        }),
      },
    })

    return NextResponse.json({
      ...config,
      porcentaje: Number(config.porcentaje),
      porcentajePorServicio: config.porcentajePorServicio
        ? JSON.parse(config.porcentajePorServicio)
        : null,
    })
  } catch (error) {
    console.error('Error al guardar configuración de comisiones:', error)
    return NextResponse.json(
      { error: 'Error al guardar configuración de comisiones' },
      { status: 500 }
    )
  }
}





