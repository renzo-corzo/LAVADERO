/**
 * GET: devuelve la clave pública VAPID para que el cliente se suscriba.
 * (La clave pública no es secreta; la privada nunca se expone.)
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY || null
  return NextResponse.json({ key })
}
