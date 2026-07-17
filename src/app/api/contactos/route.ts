/**
 * API Route: Contactos (para campañas)
 * GET: Lista de teléfonos únicos de la empresa, agregados desde las OTs.
 *      Incluye nombre, cantidad de visitas, última visita y última patente.
 *
 * Los datos ya existen en las OTs (telefonoCliente); acá se consolidan.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { hasPermission } from '@/lib/auth'
import { empresaScope } from '@/lib/empresa'

export const dynamic = 'force-dynamic'

/** Normaliza un teléfono a solo dígitos para poder agrupar (ignora espacios, guiones, +). */
function normalizarTelefono(tel: string): string {
  return tel.replace(/\D/g, '')
}

interface Contacto {
  telefono: string // el último formato tal como se ingresó (para mostrar/llamar)
  telefonoNormalizado: string
  nombre: string
  visitas: number
  ultimaVisita: string
  ultimaPatente: string | null
  tipo: 'CONCESIONARIA' | 'PARTICULAR'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Mismos permisos que ver clientes/reportes (DUEÑO/ENCARGADO/ADMIN)
    if (!hasPermission(session.user.role, 'usuario:view')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const scope = empresaScope(session, request)
    if (!scope.valido) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }

    const ots = await prisma.ordenTrabajo.findMany({
      where: {
        ...(scope.empresaId ? { empresaId: scope.empresaId } : {}),
        telefonoCliente: { not: null },
      },
      select: {
        nombreCliente: true,
        telefonoCliente: true,
        patente: true,
        fechaIngreso: true,
        cliente: { select: { tipo: true } },
      },
      orderBy: { fechaIngreso: 'desc' },
    })

    // Agrupar por teléfono normalizado; la OT más reciente define nombre/patente
    const mapa = new Map<string, Contacto>()
    for (const ot of ots) {
      const telRaw = (ot.telefonoCliente || '').trim()
      const norm = normalizarTelefono(telRaw)
      if (!norm || norm.length < 6) continue // descartar basura

      const existente = mapa.get(norm)
      if (existente) {
        existente.visitas += 1
        // ots vienen ordenadas desc: la primera vista ya es la más reciente
      } else {
        mapa.set(norm, {
          telefono: telRaw,
          telefonoNormalizado: norm,
          nombre: ot.nombreCliente?.trim() || 'Sin nombre',
          visitas: 1,
          ultimaVisita: ot.fechaIngreso.toISOString(),
          ultimaPatente: ot.patente || null,
          tipo: ot.cliente?.tipo === 'CONCESIONARIA' ? 'CONCESIONARIA' : 'PARTICULAR',
        })
      }
    }

    const contactos = Array.from(mapa.values()).sort(
      (a, b) => new Date(b.ultimaVisita).getTime() - new Date(a.ultimaVisita).getTime()
    )

    return NextResponse.json({
      total: contactos.length,
      contactos,
    })
  } catch (error) {
    console.error('Error al obtener contactos:', error)
    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 })
  }
}
