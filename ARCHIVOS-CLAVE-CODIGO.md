# 📄 Archivos Clave - Código Completo para Gemini

Este documento contiene el código completo de los archivos más importantes del sistema. Puedes copiar y pegar estos archivos directamente a Gemini.

---

## 1. package.json

```json
{
  "name": "lavadero-sistema",
  "version": "0.1.0",
  "private": true,
  "description": "Sistema de gestión para lavadero de autos - MVP",
  "scripts": {
    "dev": "next dev",
    "dev:network": "next dev -H 0.0.0.0",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "postinstall": "prisma generate",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.9.0",
    "bcryptjs": "^2.4.3",
    "next": "^14.2.0",
    "next-auth": "^4.24.5",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0",
    "autoprefixer": "^10.4.23",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.19",
    "sharp": "^0.34.5",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0"
  },
  "devDependencies": {
    "prisma": "^5.9.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 2. prisma/schema.prisma

```prisma
// Schema de Base de Datos - Sistema Lavadero de Autos
// Generado basado en src/types/index.ts

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  DUENO
  ENCARGADO
  LAVADOR
}

enum OTEstado {
  EN_COLA
  EN_PROCESO
  LISTO
  ENTREGADO
  CANCELADO
}

enum TipoVehiculo {
  chico
  mediano
  camioneta
}

enum MedioPago {
  EFECTIVO
  TRANSFERENCIA
}

enum ComisionEstado {
  PENDIENTE
  LIQUIDADA
}

enum ComisionModelo {
  POR_ITEM
  POR_OT
}

enum TipoCliente {
  CONCESIONARIA
  WALK_IN
}

// ============================================
// MODELOS
// ============================================

model Usuario {
  id        String   @id @default(cuid())
  nombre    String
  usuario   String   @unique
  password  String
  rol       UserRole
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  otsCreadas          OrdenTrabajo[]       @relation("OTCreador")
  otsAsignadas        OrdenTrabajoEmpleado[]
  pagosRegistrados    Pago[]
  cierresRealizados   CierreCaja[]
  comisiones          Comision[]
  comisionesLiquidadas LiquidacionComision[] @relation("LiquidacionEmpleado")
  liquidacionesRealizadas  LiquidacionComision[] @relation("LiquidacionUsuario")
  configComisiones    ConfigComision[]
  estadosCambiados    EstadoHistorial[]
  auditoriaLogs       AuditoriaLog[]

  @@map("usuarios")
}

model Servicio {
  id              String        @id @default(cuid())
  nombre          String        @unique
  precio          Float
  duracionEstimada Int?
  tipoVehiculo    TipoVehiculo?
  activo          Boolean       @default(true)
  descripcion     String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  ots             OrdenTrabajo[]

  @@map("servicios")
}

model Extra {
  id              String        @id @default(cuid())
  nombre          String        @unique
  precio          Float
  duracionEstimada Int?
  activo          Boolean       @default(true)
  descripcion     String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  ots             OrdenTrabajoExtra[]

  @@map("extras")
}

model Cliente {
  id                  String      @id @default(cuid())
  nombre              String      @unique
  tipo                TipoCliente @default(WALK_IN)
  telefono            String?
  email               String?
  descuentoPorcentaje Float?
  prioridad           Int         @default(0)
  activo              Boolean     @default(true)
  observaciones       String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  ordenesTrabajo      OrdenTrabajo[]

  @@index([tipo])
  @@index([activo])
  @@index([prioridad])
  @@map("clientes")
}

model OrdenTrabajo {
  id                  String      @id @default(cuid())
  fechaIngreso        DateTime    @default(now())
  patente             String
  tipoVehiculo        TipoVehiculo?
  descripcionVehiculo String?
  nombreCliente       String?
  telefonoCliente     String?
  horarioDeseado      DateTime?
  clienteId           String?
  servicioId          String
  observaciones       String?
  estado              OTEstado    @default(EN_COLA)
  total               Float
  precioAjustado      Float?
  justificacionPrecio String?
  usuarioCreadorId    String
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  cliente             Cliente?            @relation(fields: [clienteId], references: [id])
  servicio            Servicio            @relation(fields: [servicioId], references: [id])
  usuarioCreador      Usuario             @relation("OTCreador", fields: [usuarioCreadorId], references: [id])
  empleados           OrdenTrabajoEmpleado[]
  extras              OrdenTrabajoExtra[]
  estadosHistorial    EstadoHistorial[]
  pagos               Pago[]
  comisiones          Comision[]
  cierres             CierreCajaOT[]
  
  @@index([estado])
  @@index([fechaIngreso])
  @@index([usuarioCreadorId])
  @@index([clienteId])
  @@map("ordenes_trabajo")
}

model OrdenTrabajoEmpleado {
  id            String        @id @default(cuid())
  ordenTrabajoId String
  empleadoId    String

  ordenTrabajo  OrdenTrabajo  @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)
  empleado      Usuario       @relation(fields: [empleadoId], references: [id], onDelete: Cascade)

  @@unique([ordenTrabajoId, empleadoId])
  @@map("orden_trabajo_empleados")
}

model OrdenTrabajoExtra {
  id            String        @id @default(cuid())
  ordenTrabajoId String
  extraId       String

  ordenTrabajo  OrdenTrabajo  @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)
  extra         Extra         @relation(fields: [extraId], references: [id], onDelete: Cascade)

  @@unique([ordenTrabajoId, extraId])
  @@map("orden_trabajo_extras")
}

model EstadoHistorial {
  id            String      @id @default(cuid())
  ordenTrabajoId String
  estadoAnterior OTEstado
  estadoNuevo    OTEstado
  usuarioId     String
  fechaHora     DateTime    @default(now())

  ordenTrabajo  OrdenTrabajo @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)
  usuario       Usuario      @relation(fields: [usuarioId], references: [id])

  @@index([ordenTrabajoId])
  @@index([fechaHora])
  @@map("estado_historial")
}

model Pago {
  id            String      @id @default(cuid())
  ordenTrabajoId String
  monto         Float
  medioPago     MedioPago
  referencia    String?
  fechaHora     DateTime    @default(now())
  usuarioId     String
  createdAt     DateTime    @default(now())

  ordenTrabajo  OrdenTrabajo @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)
  usuario       Usuario      @relation(fields: [usuarioId], references: [id])

  @@index([ordenTrabajoId])
  @@index([fechaHora])
  @@index([medioPago])
  @@map("pagos")
}

model CierreCaja {
  id                String      @id @default(cuid())
  fechaDesde        DateTime
  fechaHasta        DateTime
  fechaCierre       DateTime    @default(now())
  totalEfectivo     Float
  totalTransferencia Float
  totalGeneral      Float
  observaciones     String?
  usuarioId         String
  createdAt         DateTime    @default(now())

  usuario           Usuario     @relation(fields: [usuarioId], references: [id])
  ots               CierreCajaOT[]

  @@index([fechaCierre])
  @@index([usuarioId])
  @@map("cierres_caja")
}

model CierreCajaOT {
  id            String      @id @default(cuid())
  cierreCajaId  String
  ordenTrabajoId String

  cierreCaja    CierreCaja  @relation(fields: [cierreCajaId], references: [id], onDelete: Cascade)
  ordenTrabajo  OrdenTrabajo @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)

  @@unique([cierreCajaId, ordenTrabajoId])
  @@map("cierre_caja_ots")
}

model Comision {
  id                    String          @id @default(cuid())
  ordenTrabajoId        String
  empleadoId            String
  monto                 Float
  porcentaje            Float
  estado                ComisionEstado  @default(PENDIENTE)
  fechaGeneracion       DateTime        @default(now())
  fechaLiquidacion      DateTime?
  usuarioLiquidacionId  String?
  createdAt             DateTime        @default(now())

  ordenTrabajo          OrdenTrabajo    @relation(fields: [ordenTrabajoId], references: [id], onDelete: Cascade)
  empleado              Usuario         @relation(fields: [empleadoId], references: [id])
  liquidaciones         LiquidacionComisionComision[]

  @@index([empleadoId])
  @@index([estado])
  @@index([fechaGeneracion])
  @@map("comisiones")
}

model ConfigComision {
  id                    String          @id @default(cuid())
  empleadoId            String          @unique
  modelo                ComisionModelo  @default(POR_ITEM)
  porcentaje            Float
  porcentajePorServicio String?
  activo                Boolean         @default(true)
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  empleado              Usuario         @relation(fields: [empleadoId], references: [id], onDelete: Cascade)

  @@map("config_comisiones")
}

model LiquidacionComision {
  id            String      @id @default(cuid())
  empleadoId    String
  fechaDesde    DateTime
  fechaHasta    DateTime
  fechaLiquidacion DateTime @default(now())
  montoTotal    Float
  usuarioId     String
  createdAt     DateTime    @default(now())

  empleado      Usuario     @relation("LiquidacionEmpleado", fields: [empleadoId], references: [id])
  usuario       Usuario     @relation("LiquidacionUsuario", fields: [usuarioId], references: [id])
  comisiones    LiquidacionComisionComision[]

  @@index([empleadoId])
  @@index([fechaLiquidacion])
  @@map("liquidaciones_comision")
}

model LiquidacionComisionComision {
  id                  String              @id @default(cuid())
  liquidacionId       String
  comisionId          String

  liquidacion         LiquidacionComision @relation(fields: [liquidacionId], references: [id], onDelete: Cascade)
  comision            Comision            @relation(fields: [comisionId], references: [id], onDelete: Cascade)

  @@unique([liquidacionId, comisionId])
  @@map("liquidacion_comision_comisiones")
}

model AuditoriaLog {
  id            String   @id @default(cuid())
  fechaHora     DateTime @default(now())
  usuarioId     String
  accion        String
  entidad       String
  entidadId     String?
  datos         String

  usuario       Usuario  @relation(fields: [usuarioId], references: [id])

  @@index([fechaHora])
  @@index([usuarioId])
  @@index([entidad, entidadId])
  @@map("auditoria_logs")
}
```

---

## 3. src/types/index.ts

```typescript
/**
 * Tipos principales del sistema
 * Definir aquí todos los tipos TypeScript usados en la aplicación
 */

// Roles de usuario
export type UserRole = 'DUENO' | 'ENCARGADO' | 'LAVADOR'

// Estados de Orden de Trabajo
export type OTEstado = 'EN_COLA' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO'

// Tipo de vehículo
export type TipoVehiculo = 'chico' | 'mediano' | 'camioneta'

// Medio de pago
export type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA'

// Estado de comisión
export type ComisionEstado = 'PENDIENTE' | 'LIQUIDADA'

// Tipo de cliente
export type TipoCliente = 'CONCESIONARIA' | 'WALK_IN'

// Cliente
export interface Cliente {
  id: string
  nombre: string
  tipo: TipoCliente
  telefono?: string
  email?: string
  descuentoPorcentaje?: number
  prioridad: number
  activo: boolean
  observaciones?: string
  createdAt: Date
  updatedAt: Date
}

// Usuario
export interface Usuario {
  id: string
  nombre: string
  usuario: string
  rol: UserRole
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// Servicio
export interface Servicio {
  id: string
  nombre: string
  precio: number
  duracionEstimada?: number
  tipoVehiculo?: TipoVehiculo
  activo: boolean
  descripcion?: string
  createdAt: Date
  updatedAt: Date
}

// Extra
export interface Extra {
  id: string
  nombre: string
  precio: number
  duracionEstimada?: number
  activo: boolean
  descripcion?: string
  createdAt: Date
  updatedAt: Date
}

// Orden de Trabajo (OT)
export interface OrdenTrabajo {
  id: string
  fechaIngreso: Date
  patente: string
  tipoVehiculo?: TipoVehiculo
  descripcionVehiculo?: string
  nombreCliente?: string
  telefonoCliente?: string
  horarioDeseado?: Date
  clienteId?: string
  cliente?: Cliente
  servicioId: string
  servicio: Servicio
  extrasIds: string[]
  extras: Extra[]
  empleadosIds: string[]
  empleados: Usuario[]
  observaciones?: string
  estado: OTEstado
  total: number
  precio: number
  precioAjustado?: number
  justificacionPrecio?: string
  usuarioCreadorId: string
  usuarioCreador: Usuario
  createdAt: Date
  updatedAt: Date
  totalPagado?: number
  pendiente?: number
  estaPagada?: boolean
}

// Historial de cambios de estado
export interface EstadoHistorial {
  id: string
  otId: string
  estadoAnterior: OTEstado
  estadoNuevo: OTEstado
  usuarioId: string
  usuario: Usuario
  fechaHora: Date
}

// Pago
export interface Pago {
  id: string
  otId: string
  ot: OrdenTrabajo
  monto: number
  medioPago: MedioPago
  referencia?: string
  fechaHora: Date
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Cierre de Caja
export interface CierreCaja {
  id: string
  fechaDesde: Date
  fechaHasta: Date
  fechaCierre: Date
  totalEfectivo: number
  totalTransferencia: number
  totalGeneral: number
  otsIds: string[]
  ots: OrdenTrabajo[]
  observaciones?: string
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Comisión
export interface Comision {
  id: string
  otId: string
  ot: OrdenTrabajo
  empleadoId: string
  empleado: Usuario
  monto: number
  porcentaje: number
  estado: ComisionEstado
  fechaGeneracion: Date
  fechaLiquidacion?: Date
  usuarioLiquidacionId?: string
  createdAt: Date
}

// Liquidación de Comisiones
export interface LiquidacionComision {
  id: string
  empleadoId: string
  empleado: Usuario
  fechaDesde: Date
  fechaHasta: Date
  fechaLiquidacion: Date
  comisionesIds: string[]
  comisiones: Comision[]
  montoTotal: number
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Configuración de Comisiones
export interface ConfigComision {
  id: string
  empleadoId: string
  empleado: Usuario
  modelo: 'POR_ITEM' | 'POR_OT'
  porcentaje: number
  porcentajePorServicio?: Record<string, number>
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// Log de Auditoría
export interface AuditoriaLog {
  id: string
  fechaHora: Date
  usuarioId: string
  usuario: Usuario
  accion: string
  entidad: string
  entidadId?: string
  datos: Record<string, unknown>
}
```

---

## 4. src/lib/db/client.ts

```typescript
/**
 * Cliente de Prisma
 * Singleton para reutilizar la conexión en producción
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 5. src/lib/auth/config.ts

```typescript
/**
 * Configuración de NextAuth
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@/types'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        usuario: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
            throw new Error('DATABASE_URL no configurada correctamente')
          }

          if (!credentials?.usuario || !credentials?.password) {
            return null
          }

          const user = await prisma.usuario.findUnique({
            where: {
              usuario: credentials.usuario,
            },
          })

          if (!user || !user.activo) {
            return null
          }

          const isValidPassword = await compare(credentials.password, user.password)

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            name: user.nombre,
            email: null,
            role: user.rol,
          }
        } catch (error) {
          console.error('Error en authorize:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

---

## 6. src/lib/comisiones.ts

```typescript
/**
 * Utilidades para cálculo de comisiones
 */

import { prisma } from '@/lib/db/client'

/**
 * Calcula las comisiones para una OT cuando está ENTREGADA y PAGADA
 */
export async function calcularComisiones(otId: string): Promise<void> {
  const comisionesExistentes = await prisma.comision.findMany({
    where: { ordenTrabajoId: otId },
  })

  if (comisionesExistentes.length > 0) {
    return
  }

  const ot = await prisma.ordenTrabajo.findUnique({
    where: { id: otId },
    include: {
      servicio: true,
      extras: { include: { extra: true } },
      empleados: true,
      pagos: true,
    },
  })

  if (!ot) {
    throw new Error(`OT ${otId} no encontrada`)
  }

  if (ot.estado !== 'ENTREGADO') {
    return
  }

  const totalPagado = ot.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
  if (totalPagado < Number(ot.total)) {
    return
  }

  const empleadosIds = ot.empleados.map((e) => e.empleadoId)
  if (empleadosIds.length === 0) {
    return
  }

  const configs = await prisma.configComision.findMany({
    where: {
      empleadoId: { in: empleadosIds },
      activo: true,
    },
  })

  if (configs.length === 0) {
    return
  }

  const comisionesACrear: Array<{
    ordenTrabajoId: string
    empleadoId: string
    monto: number
    porcentaje: number
  }> = []

  for (const config of configs) {
    const porcentajePorServicio = config.porcentajePorServicio
      ? JSON.parse(config.porcentajePorServicio)
      : null

    let montoComision = 0

    if (config.modelo === 'POR_OT') {
      montoComision = (Number(ot.total) * config.porcentaje) / 100
    } else {
      const porcentajeServicio =
        porcentajePorServicio?.[ot.servicio.id] || config.porcentaje
      montoComision += (Number(ot.servicio.precio) * porcentajeServicio) / 100

      for (const extraOt of ot.extras) {
        const porcentajeExtra =
          porcentajePorServicio?.[extraOt.extra.id] || config.porcentaje
        montoComision += (Number(extraOt.extra.precio) * porcentajeExtra) / 100
      }
    }

    const montoPorEmpleado = montoComision / empleadosIds.length

    comisionesACrear.push({
      ordenTrabajoId: otId,
      empleadoId: config.empleadoId,
      monto: Math.round(montoPorEmpleado * 100) / 100,
      porcentaje: config.porcentaje,
    })
  }

  if (comisionesACrear.length > 0) {
    await prisma.$transaction(
      comisionesACrear.map((comision) =>
        prisma.comision.create({
          data: comision,
        })
      )
    )
  }
}

/**
 * Verifica y calcula comisiones si corresponde
 */
export async function verificarYCalcularComisiones(otId: string): Promise<void> {
  try {
    await calcularComisiones(otId)
  } catch (error) {
    console.error(`Error al calcular comisiones para OT ${otId}:`, error)
  }
}
```

---

## 7. src/lib/reglas-negocio.ts

```typescript
/**
 * Reglas de negocio
 */

import { OTEstado, UserRole } from '@/types'

/**
 * Verificar si una transición de estado es válida
 */
export function isValidEstadoTransition(
  estadoActual: OTEstado,
  estadoNuevo: OTEstado,
  userRole: UserRole
): { valid: boolean; reason?: string } {
  if (estadoActual === estadoNuevo) {
    return { valid: false, reason: 'El estado no ha cambiado' }
  }

  if (estadoActual === 'EN_COLA' && estadoNuevo === 'EN_PROCESO') {
    return { valid: true }
  }

  if (estadoActual === 'EN_COLA' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'ENCARGADO' || userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo ENCARGADO o DUEÑO pueden cancelar' }
  }

  if (estadoActual === 'EN_PROCESO' && estadoNuevo === 'LISTO') {
    return { valid: true }
  }

  if (estadoActual === 'EN_PROCESO' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'ENCARGADO' || userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo ENCARGADO o DUEÑO pueden cancelar' }
  }

  if (estadoActual === 'LISTO' && estadoNuevo === 'ENTREGADO') {
    return { valid: true }
  }

  if (estadoActual === 'LISTO' && estadoNuevo === 'CANCELADO') {
    if (userRole === 'DUENO') {
      return { valid: true }
    }
    return { valid: false, reason: 'Solo DUENO puede cancelar una OT LISTA' }
  }

  if (estadoActual === 'ENTREGADO') {
    return { valid: false, reason: 'ENTREGADO es un estado final' }
  }

  return { valid: false, reason: 'Transición no permitida' }
}

/**
 * Verificar si una OT puede editarse
 */
export function canEditOT(estado: OTEstado): boolean {
  return estado === 'EN_COLA' || estado === 'EN_PROCESO'
}

/**
 * Verificar si una OT puede cancelarse
 */
export function canCancelOT(estado: OTEstado, userRole: UserRole): boolean {
  if (estado === 'ENTREGADO') {
    return false
  }
  if (estado === 'LISTO') {
    return userRole === 'DUENO'
  }
  return userRole === 'ENCARGADO' || userRole === 'DUENO'
}

/**
 * Calcular total de una OT
 */
export function calcularTotalOT(
  precioServicio: number,
  preciosExtras: number[],
  precioAjustado?: number
): number {
  if (precioAjustado !== undefined) {
    return precioAjustado
  }
  return precioServicio + preciosExtras.reduce((sum, precio) => sum + precio, 0)
}
```

---

## 8. src/middleware.ts

```typescript
/**
 * Middleware de Next.js para proteger rutas
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = token.role

    if (path.startsWith('/usuarios') || path.startsWith('/config')) {
      if (role !== 'DUENO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    if (
      path.startsWith('/caja') ||
      path.startsWith('/comisiones') ||
      path.startsWith('/reportes') ||
      path.startsWith('/catalogos')
    ) {
      if (role === 'LAVADOR') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }
    
    if (path.startsWith('/ots/nueva') || (path.startsWith('/ots/') && path.match(/\/ots\/[^/]+\/editar/))) {
      if (role === 'LAVADOR') {
        return NextResponse.redirect(new URL('/tablero', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tablero/:path*',
    '/ots/:path*',
    '/caja/:path*',
    '/comisiones/:path*',
    '/reportes/:path*',
    '/catalogos/:path*',
    '/usuarios/:path*',
    '/config/:path*',
  ],
}
```

---

## 9. src/components/ui/Button.tsx

```typescript
/**
 * Componente Button reutilizable
 */

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-colors'
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={props.disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## 10. next.config.js

```javascript
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
```

---

## 11. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 📌 Notas Finales

- El código de las API Routes y páginas principales es más extenso. Si Gemini necesita ver algún archivo específico, puedes compartirlo después.
- El archivo `src/app/api/ots/route.ts` contiene la lógica completa de creación y listado de OTs (374 líneas).
- Hay más componentes UI en `src/components/ui/` (Input, Select, Card, Textarea).
- Las páginas principales están en `src/app/(dashboard)/`.

**Siguiente paso:** Comparte primero este documento con Gemini, y luego comparte archivos específicos que te solicite.
