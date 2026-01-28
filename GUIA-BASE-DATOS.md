# Guía de Configuración de Base de Datos

## 📋 Resumen

Se ha configurado Prisma ORM como sistema de gestión de base de datos. El schema completo está en `prisma/schema.prisma` y está basado en los tipos TypeScript definidos en `src/types/index.ts`.

## 🗄️ Modelos de Base de Datos

### Modelos Principales

1. **Usuario** - Usuarios del sistema (DUEÑO, ENCARGADO, LAVADOR)
2. **Servicio** - Catálogo de servicios
3. **Extra** - Catálogo de extras
4. **OrdenTrabajo** - Órdenes de trabajo (OT)
5. **EstadoHistorial** - Historial de cambios de estado de OTs
6. **Pago** - Pagos registrados
7. **CierreCaja** - Cierres de caja realizados
8. **Comision** - Comisiones generadas
9. **ConfigComision** - Configuración de comisiones por empleado
10. **LiquidacionComision** - Liquidaciones de comisiones
11. **AuditoriaLog** - Logs de auditoría

### Relaciones Many-to-Many

- **OrdenTrabajo ↔ Empleados** (OrdenTrabajoEmpleado)
- **OrdenTrabajo ↔ Extras** (OrdenTrabajoExtra)
- **CierreCaja ↔ OTs** (CierreCajaOT)
- **LiquidacionComision ↔ Comisiones** (LiquidacionComisionComision)

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

Esto instalará `@prisma/client` y `prisma` (dev dependency).

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura `DATABASE_URL`:

```bash
cp .env.example .env
```

**Para PostgreSQL (recomendado):**
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/lavadero?schema=public"
```

**Para SQLite (desarrollo rápido):**
```env
DATABASE_URL="file:./prisma/dev.db"
```

Y cambiar en `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"  // cambiar de "postgresql" a "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Generar cliente de Prisma

```bash
npm run db:generate
```

Esto genera el cliente de Prisma basado en el schema.

### 4. Crear/migrar base de datos

**Opción A: Para desarrollo (SQLite o desarrollo rápido)**
```bash
npm run db:push
```
Crea o actualiza el schema sin crear migraciones.

**Opción B: Para producción (con migraciones)**
```bash
npm run db:migrate
```
Crea una migración y la aplica. Te pedirá un nombre para la migración.

### 5. (Opcional) Poblar con datos iniciales

```bash
npm run db:seed
```

Esto creará:
- Usuario admin (usuario: `admin`, contraseña: cambiar en seed.ts)
- Servicios de ejemplo
- Extras de ejemplo

⚠️ **IMPORTANTE**: Cambiar el hash de contraseña en `prisma/seed.ts` antes de ejecutar.

### 6. (Opcional) Abrir Prisma Studio

```bash
npm run db:studio
```

Abre una interfaz visual para explorar y editar la base de datos en `http://localhost:5555`.

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:push` | Sincroniza el schema sin migraciones (desarrollo) |
| `npm run db:migrate` | Crea y aplica una migración |
| `npm run db:migrate:deploy` | Aplica migraciones pendientes (producción) |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Ejecuta el script de seed |

## 🔧 Uso del Cliente de Prisma

El cliente está disponible en `src/lib/db/client.ts`:

```typescript
import { prisma } from '@/lib/db/client'

// Ejemplo: Obtener todas las OTs
const ots = await prisma.ordenTrabajo.findMany({
  include: {
    servicio: true,
    empleados: {
      include: {
        empleado: true
      }
    }
  }
})

// Ejemplo: Crear una OT
const nuevaOT = await prisma.ordenTrabajo.create({
  data: {
    tipoVehiculo: 'chico',
    servicioId: 'servicio-id',
    usuarioCreadorId: 'usuario-id',
    total: 1500,
    estado: 'EN_COLA',
    empleados: {
      create: {
        empleadoId: 'empleado-id'
      }
    }
  }
})
```

## 📊 Estructura de Datos

### Enums

- `UserRole`: DUEÑO | ENCARGADO | LAVADOR
- `OTEstado`: EN_COLA | EN_PROCESO | LISTO | ENTREGADO | CANCELADO
- `TipoVehiculo`: chico | mediano | camioneta
- `MedioPago`: EFECTIVO | TRANSFERENCIA
- `ComisionEstado`: PENDIENTE | LIQUIDADA
- `ComisionModelo`: POR_ITEM | POR_OT

### Índices Creados

Se han creado índices para optimizar consultas frecuentes:

- `OrdenTrabajo`: estado, fechaIngreso, usuarioCreadorId
- `EstadoHistorial`: ordenTrabajoId, fechaHora
- `Pago`: ordenTrabajoId, fechaHora, medioPago
- `Comision`: empleadoId, estado, fechaGeneracion
- `AuditoriaLog`: fechaHora, usuarioId, entidad+entidadId

## ⚠️ Notas Importantes

1. **Contraseñas**: El campo `password` en `Usuario` debe almacenarse hasheado (usar bcrypt o similar).

2. **Decimales**: Los campos de precio/usuario usan `Decimal` de Prisma, que se mapea a `DECIMAL(10,2)` en PostgreSQL.

3. **JSON**: `porcentajePorServicio` en `ConfigComision` usa tipo JSON para almacenar un objeto dinámico.

4. **Soft Delete**: Los modelos no tienen soft delete por defecto. Si se necesita, se puede agregar campo `deletedAt` y filtrar en queries.

5. **Relaciones Many-to-Many**: Prisma requiere tablas intermedias explícitas para relaciones many-to-many.

## 🔄 Próximos Pasos

1. Ejecutar migraciones para crear las tablas
2. Ejecutar seed para datos iniciales
3. Implementar funciones de hash de contraseñas
4. Crear funciones helper para queries comunes
5. Implementar validaciones a nivel de schema si es necesario

## 📚 Recursos

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Prisma con Next.js](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)





