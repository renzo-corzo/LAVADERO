/**
 * Route handler para servir favicon.ico
 * Redirige al favicon.svg existente
 */

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Leer el favicon.svg y servir como ico
    const svgPath = join(process.cwd(), 'public', 'favicon.svg')
    const svgContent = readFileSync(svgPath)
    
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // Si falla, devolver un SVG simple inline
    const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0070f3"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🚗</text></svg>`
    return new NextResponse(simpleSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}

