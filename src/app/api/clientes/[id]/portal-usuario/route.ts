/**
 * API: Crear / Resetear usuario de Portal para una Concesionaria (Cliente)
 * Requiere permiso portal:manage (ENCARGADO/DUENO) o DUENO (*)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const bodySchema = z.object({
  usuario: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  resetPassword: z.boolean().optional().default(true),
})

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

async function generateUniqueUsername(base: string) {
  const baseTrim = base.trim()
  let username = baseTrim
  let i = 1
  while (true) {
    const exists = await prisma.usuario.findUnique({ where: { usuario: username } })
    if (!exists) return username
    i += 1
    username = `${baseTrim}_${i}`
  }
}

function normalizeUsername(s: string) {
  // Evitar espacios y trims (para que sea fácil de tipear en login)
  return s.trim().replace(/\s+/g, '_')
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!hasPermission(session.user.role, 'portal:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      select: { id: true, nombre: true, tipo: true, activo: true },
    })
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Buscar por clienteId (defensivo): si por algún bug quedó con rol incorrecto, igual lo mostramos
    const portalUser = await prisma.usuario.findFirst({
      where: { clienteId: cliente.id },
      select: { id: true, usuario: true, activo: true, createdAt: true, rol: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      cliente: { id: cliente.id, nombre: cliente.nombre, tipo: cliente.tipo },
      portalUser,
      sugerido: `cliente_${slugify(cliente.nombre)}`,
    })
  } catch (error) {
    console.error('Error obteniendo usuario portal:', error)
    return NextResponse.json({ error: 'Error al obtener usuario portal' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (!hasPermission(session.user.role, 'portal:manage')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      select: { id: true, nombre: true, tipo: true, activo: true },
    })

    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    if (cliente.tipo !== 'CONCESIONARIA') {
      return NextResponse.json({ error: 'El cliente no es una concesionaria' }, { status: 400 })
    }

    // Defensivo: si existe un usuario con este clienteId aunque tenga rol incorrecto,
    // lo tomamos como "portal user" y lo corregimos a rol=CLIENTE.
    const existingPortalUser = await prisma.usuario.findFirst({
      where: { clienteId: cliente.id },
      select: { id: true, usuario: true, activo: true, rol: true },
      orderBy: { createdAt: 'desc' },
    })

    const requestedUsername = parsed.data.usuario ? normalizeUsername(parsed.data.usuario) : undefined
    const usernameBase = requestedUsername || `cliente_${slugify(cliente.nombre)}`
    const username = existingPortalUser
      ? requestedUsername || existingPortalUser.usuario
      : await generateUniqueUsername(usernameBase)

    const shouldResetPassword = Boolean(parsed.data.password) || Boolean(parsed.data.resetPassword)
    const plainPassword = parsed.data.password || generatePassword(10)
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Validar unicidad del username si se está cambiando
    if (existingPortalUser && requestedUsername && requestedUsername !== existingPortalUser.usuario) {
      const taken = await prisma.usuario.findUnique({ where: { usuario: username } })
      if (taken) {
        return NextResponse.json({ error: 'El usuario ya existe. Elegí otro.' }, { status: 400 })
      }
    }

    const portalUser = existingPortalUser
      ? await prisma.usuario.update({
          where: { id: existingPortalUser.id },
          data: {
            usuario: username,
            ...(shouldResetPassword ? { password: hashedPassword } : {}),
            activo: true,
            nombre: cliente.nombre,
            rol: 'CLIENTE',
            clienteId: cliente.id,
          },
          select: { id: true, nombre: true, usuario: true, rol: true, activo: true, clienteId: true },
        })
      : await prisma.usuario.create({
          data: {
            nombre: cliente.nombre,
            usuario: username,
            password: hashedPassword,
            rol: 'CLIENTE',
            clienteId: cliente.id,
            activo: true,
          },
          select: { id: true, nombre: true, usuario: true, rol: true, activo: true, clienteId: true },
        })

    await prisma.auditoriaLog.create({
      data: {
        usuarioId: session.user.id,
        accion: existingPortalUser
          ? existingPortalUser.rol === 'CLIENTE'
            ? 'PORTAL_USER_RESET'
            : 'PORTAL_USER_ROLE_FIXED'
          : 'PORTAL_USER_CREATED',
        entidad: 'Usuario',
        entidadId: portalUser.id,
        datos: JSON.stringify({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          usuario: portalUser.usuario,
        }),
      },
    })

    // Devolver la contraseña solo en esta respuesta (no se guarda en texto plano)
    return NextResponse.json(
      {
        portalUser,
        credentials: {
          usuario: portalUser.usuario,
          password: plainPassword,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creando usuario portal:', error)
    return NextResponse.json({ error: 'Error al crear usuario portal' }, { status: 500 })
  }
}

