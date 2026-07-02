/**
 * Provider de TanStack Query (React Query).
 * Centraliza el fetching de datos con caché, revalidación y reintentos.
 */

'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Un QueryClient por montaje del árbol (evita compartir caché entre requests en SSR).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s: datos "frescos" antes de revalidar
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
