/**
 * Almacenamiento de imágenes de OT.
 *
 * En producción usa Cloudflare R2 (S3-compatible) si están las variables de
 * entorno; en desarrollo (sin R2) cae a disco local en public/uploads/ots.
 *
 * Variables requeridas para R2:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */

import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

function r2Configurado(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL
  )
}

/** Guarda un JPEG ya procesado y devuelve la URL pública. */
export async function guardarImagenOT(buffer: Buffer): Promise<string> {
  const nombre = `${randomUUID()}.jpg`
  if (r2Configurado()) {
    return subirAR2(buffer, `ots/${nombre}`)
  }
  return guardarLocal(buffer, nombre)
}

async function guardarLocal(buffer: Buffer, nombre: string): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'ots')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, nombre), buffer)
  return `/uploads/ots/${nombre}`
}

async function subirAR2(buffer: Buffer, key: string): Promise<string> {
  // Import dinámico: el SDK solo se carga cuando R2 está configurado.
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  })

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET as string,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const base = (process.env.R2_PUBLIC_URL as string).replace(/\/$/, '')
  return `${base}/${key}`
}
