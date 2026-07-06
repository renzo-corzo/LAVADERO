/**
 * Página: Catálogos
 * Página principal para gestionar Servicios y Extras
 */

'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CatalogosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Catálogos</h1>
        <p className="text-muted mt-1">Gestiona servicios y extras del lavadero</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Servicios">
          <p className="text-muted mb-4">
            Gestiona el catálogo de servicios principales del lavadero (Lavado Básico, Completo, Premium, etc.)
          </p>
          <Link href="/catalogos/servicios">
            <Button variant="primary" className="w-full md:w-auto">
              Gestionar Servicios
            </Button>
          </Link>
        </Card>

        <Card title="Extras">
          <p className="text-muted mb-4">
            Gestiona los servicios adicionales que se pueden agregar a una orden (Aspirado Motor, Encerado, etc.)
          </p>
          <Link href="/catalogos/extras">
            <Button variant="primary" className="w-full md:w-auto">
              Gestionar Extras
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}





