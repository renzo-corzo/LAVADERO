# Guía de Autenticación - Sistema Lavadero

## ✅ Configuración Completada

Se ha implementado un sistema completo de autenticación usando NextAuth.js con las siguientes características:

### Características Implementadas

1. ✅ **NextAuth.js configurado** con provider de credenciales
2. ✅ **Integración con Prisma** para validar usuarios
3. ✅ **Middleware de protección de rutas** con verificación de permisos
4. ✅ **Página de login** funcional
5. ✅ **Sistema de sesiones JWT** (8 horas de duración)
6. ✅ **Utilidades de permisos** basadas en roles
7. ✅ **Header con navegación** y cierre de sesión
8. ✅ **Seed actualizado** con usuarios de ejemplo y contraseñas hasheadas

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/lib/auth/config.ts`** - Configuración de NextAuth
2. **`src/app/api/auth/[...nextauth]/route.ts`** - API route de NextAuth
3. **`src/types/next-auth.d.ts`** - Extensiones de tipos para NextAuth
4. **`src/middleware.ts`** - Middleware de protección de rutas
5. **`src/app/(auth)/login/page.tsx`** - Página de login
6. **`src/app/(auth)/layout.tsx`** - Layout para páginas de auth
7. **`src/components/layout/Header.tsx`** - Header con navegación
8. **`src/components/providers/SessionProvider.tsx`** - Provider de sesión

### Archivos Modificados

1. **`package.json`** - Agregadas dependencias: `next-auth`, `bcryptjs`, `@types/bcryptjs`
2. **`src/lib/auth.ts`** - Implementadas funciones reales de autenticación
3. **`src/app/(dashboard)/layout.tsx`** - Integrado Header y protección
4. **`src/app/layout.tsx`** - Agregado SessionProvider
5. **`src/app/page.tsx`** - Redirección automática según sesión
6. **`prisma/seed.ts`** - Contraseñas hasheadas y usuarios de ejemplo

## 🔐 Usuarios de Ejemplo

Después de ejecutar `npm run db:seed`, tendrás estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | DUEÑO |
| `encargado` | `encargado123` | ENCARGADO |
| `lavador` | `lavador123` | LAVADOR |

⚠️ **IMPORTANTE**: Cambiar estas contraseñas después del primer login en producción.

## 🚀 Instalación y Uso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Agregar a `.env`:

```env
NEXTAUTH_SECRET="tu-secret-key-muy-segura-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

Para generar un `NEXTAUTH_SECRET` seguro:
```bash
openssl rand -base64 32
```

### 3. Generar cliente de Prisma y crear BD

```bash
npm run db:generate
npm run db:push  # o db:migrate
```

### 4. Poblar datos iniciales

```bash
npm run db:seed
```

### 5. Iniciar servidor

```bash
npm run dev
```

### 6. Acceder al sistema

Ir a `http://localhost:3000` - será redirigido a `/login`

## 🔒 Protección de Rutas

El middleware (`src/middleware.ts`) protege automáticamente estas rutas:

- `/dashboard/*`
- `/tablero/*`
- `/ots/*`
- `/caja/*`
- `/comisiones/*`
- `/reportes/*`
- `/catalogos/*`
- `/usuarios/*` (solo DUEÑO)
- `/config/*` (solo DUEÑO)

### Permisos por Ruta

- **DUEÑO**: Acceso a todas las rutas
- **ENCARGADO**: Acceso a todas excepto `/usuarios` y `/config`
- **LAVADOR**: Solo `/tablero` (y `/dashboard` básico)

## 💻 Uso en Componentes

### Obtener sesión en Server Components

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function MyPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <div>Hola {session.user.name}</div>
}
```

### Obtener sesión en Client Components

```typescript
'use client'
import { useSession } from 'next-auth/react'

export function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Cargando...</div>
  if (!session) return <div>No autenticado</div>
  
  return <div>Hola {session.user.name}</div>
}
```

### Verificar permisos

```typescript
import { hasPermission } from '@/lib/auth'

const canCreateOT = hasPermission(session.user.role, 'ot:create')
```

### Cerrar sesión

```typescript
'use client'
import { signOut } from 'next-auth/react'

function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })}>
      Cerrar Sesión
    </button>
  )
}
```

## 🔧 Configuración Avanzada

### Cambiar duración de sesión

En `src/lib/auth/config.ts`:

```typescript
session: {
  strategy: 'jwt',
  maxAge: 8 * 60 * 60, // Cambiar aquí (en segundos)
}
```

### Agregar más providers

En `src/lib/auth/config.ts`, agregar más providers a la array `providers`:

```typescript
providers: [
  CredentialsProvider({ ... }),
  // Agregar Google, GitHub, etc.
]
```

## 📝 Próximos Pasos

1. ✅ Autenticación completada
2. ⏭️ Implementar cambio de contraseña
3. ⏭️ Agregar "Recordarme" (opcional)
4. ⏭️ Implementar recuperación de contraseña (futuro)
5. ⏭️ Agregar 2FA (futuro, opcional)

## 🐛 Troubleshooting

### Error: "NEXTAUTH_SECRET is not set"
- Agregar `NEXTAUTH_SECRET` al archivo `.env`

### Error: "Invalid credentials"
- Verificar que el usuario existe en la BD
- Verificar que la contraseña está hasheada correctamente
- Verificar que el usuario está activo (`activo: true`)

### Error: "Cannot find module 'next-auth'"
- Ejecutar `npm install`

### Sesión no persiste
- Verificar que `NEXTAUTH_URL` está configurado correctamente
- Verificar que las cookies no están bloqueadas en el navegador

