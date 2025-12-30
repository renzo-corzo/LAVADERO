/**
 * Layout para páginas de autenticación
 * No requiere autenticación
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

