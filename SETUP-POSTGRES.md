# Setup de PostgreSQL

## Paso 1: Crear la Base de Datos

Conéctate a PostgreSQL y crea la base de datos:

```bash
# Opción 1: Desde línea de comandos (si psql está en PATH)
psql -U postgres
CREATE DATABASE lavadero;
\q

# Opción 2: Desde pgAdmin o cualquier cliente PostgreSQL
# Ejecuta: CREATE DATABASE lavadero;
```

## Paso 2: Configurar .env

El archivo `.env` ya está creado con:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lavadero?schema=public"
```

**IMPORTANTE:** Ajusta el usuario y contraseña según tu configuración de PostgreSQL:
- Usuario: `postgres` (o el que uses)
- Contraseña: `postgres` (o la tuya)
- Puerto: `5432` (puerto por defecto)

## Paso 3: Crear Tablas

```bash
npm run db:push
```

## Paso 4: Poblar Datos Iniciales

```bash
npm run db:seed
```

Esto creará:
- Usuario admin (usuario: `admin`, contraseña: `admin123`)
- Usuario encargado (usuario: `encargado`, contraseña: `encargado123`)
- Usuario lavador (usuario: `lavador`, contraseña: `lavador123`)
- Servicios de ejemplo
- Extras de ejemplo

## Paso 5: Iniciar Servidor

```bash
npm run dev
```

## Acceder al Sistema

1. Abre: http://localhost:3000
2. Serás redirigido a `/login`
3. Ingresa con: `admin` / `admin123`

