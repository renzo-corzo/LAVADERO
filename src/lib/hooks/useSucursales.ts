/**
 * Hook para listar sucursales activas (React Query).
 *
 * Regla de UI: el selector de sucursal solo se muestra si el usuario NO tiene
 * sucursal propia (DUEÑO/ADMIN) y hay más de una activa. Con una sola sucursal
 * la app se ve igual que siempre (instancias de una sede no cambian).
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

export interface Sucursal {
  id: string
  nombre: string
  direccion?: string | null
  activo: boolean
}

export function useSucursales() {
  const { data: session } = useSession()

  const query = useQuery<Sucursal[]>({
    queryKey: ['sucursales'],
    // CLIENTE (portal) no necesita sucursales
    enabled: !!session && session.user.role !== 'CLIENTE',
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch('/api/sucursales')
      if (!res.ok) throw new Error('Error al cargar sucursales')
      return (await res.json()) as Sucursal[]
    },
  })

  const sucursales = query.data ?? []
  const sucursalPropia = session?.user.sucursalId ?? null
  // Puede elegir sucursal: no tiene una propia y hay más de una activa
  const puedeElegir = !sucursalPropia && sucursales.length > 1

  return { ...query, sucursales, sucursalPropia, puedeElegir }
}
