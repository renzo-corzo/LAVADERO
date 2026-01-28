# 📋 Código del Sistema Lavadero - Para Gemini

## 🎯 Resumen Ejecutivo

**Proyecto:** Sistema de Gestión para Lavadero de Autos (MVP)
**Stack Tecnológico:**
- **Frontend/Backend:** Next.js 14 (App Router) con TypeScript
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Autenticación:** NextAuth.js
- **Estilos:** Tailwind CSS
- **PWA:** Progressive Web App habilitada

**Funcionalidades Principales:**
- Gestión de Órdenes de Trabajo (OTs)
- Catálogos (Servicios, Extras, Clientes, Usuarios)
- Sistema de Caja (Cobros, Cierres)
- Sistema de Comisiones para empleados
- Tablero Kanban para seguimiento de OTs
- Reportes y métricas
- Roles y permisos (DUEÑO, ENCARGADO, LAVADOR)

---

## 📁 Estructura del Proyecto

```
LAVADERO/
├── prisma/
│   ├── schema.prisma          # Modelo de datos (Prisma)
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Rutas de autenticación
│   │   │   └── login/
│   │   ├── (dashboard)/        # Rutas del dashboard (requieren auth)
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── tablero/       # Tablero Kanban de OTs
│   │   │   ├── ots/           # Gestión de OTs
│   │   │   ├── catalogos/     # ABM de Servicios, Extras
│   │   │   ├── clientes/      # ABM de Clientes
│   │   │   ├── usuarios/      # ABM de Usuarios
│   │   │   ├── caja/          # Cobros y Cierres de Caja
│   │   │   ├── comisiones/    # Configuración y Liquidación
│   │   │   └── reportes/       # Reportes y métricas
│   │   ├── api/               # API Routes (Next.js)
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── ots/           # CRUD de OTs
│   │   │   ├── servicios/     # CRUD de Servicios
│   │   │   ├── extras/        # CRUD de Extras
│   │   │   ├── clientes/      # CRUD de Clientes
│   │   │   ├── usuarios/      # CRUD de Usuarios
│   │   │   ├── pagos/         # Registro de Pagos
│   │   │   ├── cierres/       # Cierres de Caja
│   │   │   ├── comisiones/    # Comisiones
│   │   │   └── reportes/      # Reportes
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página de inicio
│   ├── components/
│   │   ├── ui/                # Componentes UI reutilizables
│   │   ├── layout/            # Componentes de layout
│   │   ├── tablero/           # Componentes del tablero
│   │   └── providers/         # Providers de React
│   ├── lib/
│   │   ├── db/                # Cliente de Prisma
│   │   ├── auth/              # Configuración de NextAuth
│   │   ├── comisiones.ts      # Lógica de cálculo de comisiones
│   │   ├── reglas-negocio.ts  # Reglas de negocio
│   │   └── utils.ts           # Utilidades
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── middleware.ts          # Middleware de Next.js (auth)
├── public/                     # Archivos estáticos
│   ├── manifest.json          # PWA manifest
│   └── icon-*.png             # Iconos PWA
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

---

## 🔑 Archivos Clave para Compartir

### 1. **Modelo de Datos (Prisma Schema)**
**Archivo:** `prisma/schema.prisma`
- Define todas las tablas y relaciones
- Enums: UserRole, OTEstado, TipoVehiculo, MedioPago, etc.
- Modelos principales: Usuario, OrdenTrabajo, Servicio, Extra, Cliente, Pago, CierreCaja, Comision

### 2. **Tipos TypeScript**
**Archivo:** `src/types/index.ts`
- Interfaces de todas las entidades
- Tipos de enums
- Estructura de datos usada en toda la aplicación

### 3. **Configuración de Autenticación**
**Archivo:** `src/lib/auth/config.ts`
- Configuración de NextAuth
- Provider de credenciales
- Callbacks JWT y Session
- Validación de usuarios

### 4. **Cliente de Base de Datos**
**Archivo:** `src/lib/db/client.ts`
- Instancia singleton de Prisma Client
- Manejo de conexión a PostgreSQL

### 5. **Lógica de Comisiones**
**Archivo:** `src/lib/comisiones.ts`
- Cálculo de comisiones por empleado
- Modelos: POR_ITEM y POR_OT
- Lógica de liquidación

### 6. **Reglas de Negocio**
**Archivo:** `src/lib/reglas-negocio.ts`
- Validaciones y reglas del dominio
- Cálculos de precios
- Validaciones de estados

### 7. **Componentes UI Base**
**Carpeta:** `src/components/ui/`
- Button.tsx
- Input.tsx
- Select.tsx
- Card.tsx
- Textarea.tsx

### 8. **API Routes Principales**
**Carpetas:**
- `src/app/api/ots/` - CRUD de Órdenes de Trabajo
- `src/app/api/pagos/` - Registro de pagos
- `src/app/api/cierres/` - Cierres de caja
- `src/app/api/comisiones/` - Sistema de comisiones

### 9. **Páginas Principales**
**Archivos:**
- `src/app/(dashboard)/tablero/page.tsx` - Tablero Kanban
- `src/app/(dashboard)/ots/nueva/page.tsx` - Crear OT
- `src/app/(dashboard)/caja/cobrar/[otId]/page.tsx` - Cobrar OT
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard principal

### 10. **Configuración**
**Archivos:**
- `package.json` - Dependencias y scripts
- `next.config.js` - Configuración de Next.js
- `tsconfig.json` - Configuración de TypeScript
- `tailwind.config.js` - Configuración de Tailwind

---

## 📝 Cómo Compartir con Gemini

### Opción A: Archivos Clave (Recomendado)

Copia y pega estos archivos en orden:

1. **Primero:** `package.json` y `prisma/schema.prisma`
2. **Segundo:** `src/types/index.ts`
3. **Tercero:** `src/lib/auth/config.ts` y `src/lib/db/client.ts`
4. **Cuarto:** `src/lib/comisiones.ts` y `src/lib/reglas-negocio.ts`
5. **Quinto:** Componentes UI (`src/components/ui/*.tsx`)
6. **Sexto:** API Routes principales (empezar con `src/app/api/ots/route.ts`)
7. **Séptimo:** Páginas principales (empezar con `src/app/(dashboard)/tablero/page.tsx`)

### Opción B: Estructura + Archivos Específicos

1. Comparte primero esta estructura del proyecto
2. Luego pregunta a Gemini qué archivos específicos necesita ver
3. Comparte los archivos que te solicite

### Opción C: Repositorio GitHub

Si el proyecto está en GitHub, puedes compartir el enlace:
```
https://github.com/renzo-corzo/LAVADERO
```

---

## 🎯 Contexto Adicional para Gemini

**Reglas de Negocio Importantes:**
- Los usuarios tienen roles: DUEÑO, ENCARGADO, LAVADOR
- Las OTs tienen estados: EN_COLA → EN_PROCESO → LISTO → ENTREGADO
- Los clientes pueden ser CONCESIONARIA (con descuentos) o WALK_IN
- El sistema calcula comisiones automáticamente al crear OTs
- Los pagos pueden ser EFECTIVO o TRANSFERENCIA
- Se pueden hacer cierres de caja que agrupan múltiples OTs

**Características Técnicas:**
- Next.js 14 con App Router
- Server Components y Client Components
- API Routes para backend
- Prisma como ORM
- NextAuth para autenticación
- Tailwind CSS para estilos
- PWA habilitada

---

## 📌 Notas para Gemini

1. El proyecto usa TypeScript estricto
2. Los alias de importación usan `@/` para referenciar `src/`
3. La autenticación es por credenciales (usuario/contraseña)
4. Las contraseñas se hashean con bcryptjs
5. El sistema está diseñado para ser PWA (Progressive Web App)
6. Hay un sistema de auditoría con logs de acciones
7. Los precios pueden ajustarse manualmente con justificación

---

## 🚀 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Iniciar en producción
npm run db:generate  # Generar Prisma Client
npm run db:push      # Sincronizar schema con BD
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Ejecutar seed de datos
```

---

**Fecha de creación:** 2026-01-27
**Versión del sistema:** 0.1.0 (MVP)
