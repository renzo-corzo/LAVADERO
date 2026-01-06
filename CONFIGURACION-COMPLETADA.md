# ✅ Configuración de Base de Datos Completada

## Resumen

Se ha completado la configuración de la base de datos usando Prisma ORM. 

## Archivos Creados

### 1. `prisma/schema.prisma`
Schema completo de base de datos con:
- ✅ 11 modelos principales
- ✅ 4 tablas de relación many-to-many
- ✅ 6 enums (UserRole, OTEstado, TipoVehiculo, MedioPago, ComisionEstado, ComisionModelo)
- ✅ Índices para optimización
- ✅ Relaciones correctamente definidas

### 2. `src/lib/db/client.ts`
Cliente de Prisma configurado como singleton para evitar múltiples conexiones en producción.

### 3. `prisma/seed.ts`
Script de seed para poblar datos iniciales:
- Usuario admin
- Servicios de ejemplo
- Extras de ejemplo

### 4. `GUIA-BASE-DATOS.md`
Guía completa de cómo usar la base de datos.

### 5. `package.json` (actualizado)
- ✅ Dependencias agregadas: `@prisma/client`, `prisma`, `tsx`
- ✅ Scripts agregados: `db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`

### 6. `env.example`
Archivo de ejemplo con variables de entorno (crear `.env` basado en este).

## Próximos Pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos
Crear archivo `.env` con:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lavadero?schema=public"
```

O para SQLite (desarrollo rápido):
```env
DATABASE_URL="file:./prisma/dev.db"
```

Y cambiar en `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"  // cambiar de "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Generar cliente y crear base de datos
```bash
# Generar cliente de Prisma
npm run db:generate

# Crear base de datos (desarrollo)
npm run db:push

# O crear con migraciones (producción)
npm run db:migrate
```

### 4. Poblar datos iniciales (opcional)
```bash
# IMPORTANTE: Editar prisma/seed.ts para cambiar la contraseña del admin
npm run db:seed
```

### 5. Explorar base de datos (opcional)
```bash
npm run db:studio
```

## Modelos Disponibles

1. **Usuario** - Usuarios del sistema
2. **Servicio** - Catálogo de servicios
3. **Extra** - Catálogo de extras
4. **OrdenTrabajo** - Órdenes de trabajo
5. **OrdenTrabajoEmpleado** - Relación OT-Empleados
6. **OrdenTrabajoExtra** - Relación OT-Extras
7. **EstadoHistorial** - Historial de cambios de estado
8. **Pago** - Pagos registrados
9. **CierreCaja** - Cierres de caja
10. **CierreCajaOT** - Relación Cierre-OTs
11. **Comision** - Comisiones generadas
12. **ConfigComision** - Configuración de comisiones
13. **LiquidacionComision** - Liquidaciones de comisiones
14. **LiquidacionComisionComision** - Relación Liquidación-Comisiones
15. **AuditoriaLog** - Logs de auditoría

## Notas Importantes

⚠️ **Contraseñas**: El campo `password` debe hashearse antes de guardarse (usar bcrypt o similar).

⚠️ **Seed**: Cambiar el hash de contraseña en `prisma/seed.ts` antes de ejecutar.

✅ **Listo para usar**: El cliente está disponible en `src/lib/db/client.ts` para usar en cualquier parte de la aplicación.




