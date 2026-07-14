/**
 * API Route: Subida de foto de vehículo para una OT
 * POST: recibe una imagen (multipart), la comprime con sharp y la guarda.
 *
 * El destino lo decide src/lib/storage.ts: Cloudflare R2 en producción (si están
 * las variables R2_*), o disco local en desarrollo.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { hasPermission } from '@/lib/auth'
import { guardarImagenOT } from '@/lib/storage'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_BYTES = 12 * 1024 * 1024 // 12 MB de entrada
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(session.user.role, 'ot:create')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const formData = await request.formData()
    const foto = formData.get('foto')

    if (!(foto instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen' }, { status: 400 })
    }
    if (foto.type && !TIPOS_PERMITIDOS.includes(foto.type)) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }
    if (foto.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La imagen supera el tamaño máximo (12 MB)' }, { status: 400 })
    }

    const entrada = Buffer.from(await foto.arrayBuffer())

    // Normalizar: redimensionar a máx. 1600px y comprimir a JPEG (estandariza HEIC/PNG/etc.)
    const procesada = await sharp(entrada)
      .rotate() // respeta la orientación EXIF
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()

    const url = await guardarImagenOT(procesada)

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('[API OTs foto] Error al subir foto:', error)
    return NextResponse.json({ error: 'No se pudo procesar la imagen' }, { status: 500 })
  }
}
