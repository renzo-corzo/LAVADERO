# Pasos Finales para Probar el Sistema

## ✅ Completado
- ✅ Dependencias instaladas
- ✅ Cliente de Prisma generado
- ✅ Archivo .env creado

## ⚠️ Pendiente: Configurar Credenciales de PostgreSQL

### 1. Editar `.env`

Abre el archivo `.env` y actualiza la línea `DATABASE_URL` con tus credenciales reales de PostgreSQL:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/lavadero?schema=public"
```

**Ejemplo:**
- Si tu usuario es `postgres` y tu contraseña es `mipassword123`:
```env
DATABASE_URL="postgresql://postgres:mipassword123@localhost:5432/lavadero?schema=public"
```

### 2. Crear la Base de Datos

Conéctate a PostgreSQL (desde pgAdmin, DBeaver, o línea de comandos) y ejecuta:

```sql
CREATE DATABASE lavadero;
```

### 3. Crear las Tablas

Una vez configurado el `.env` correctamente, ejecuta:

```bash
npm run db:push
```

Esto creará todas las tablas en la base de datos.

### 4. Poblar Datos Iniciales

```bash
npm run db:seed
```

Esto creará:
- Usuario **admin** (contraseña: `admin123`)
- Usuario **encargado** (contraseña: `encargado123`)
- Usuario **lavador** (contraseña: `lavador123`)
- Servicios de ejemplo
- Extras de ejemplo

### 5. Iniciar el Servidor

```bash
npm run dev
```

### 6. Acceder al Sistema

1. Abre tu navegador en: **http://localhost:3000**
2. Serás redirigido automáticamente a `/login`
3. Ingresa con:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`

## 🎯 Qué Probar

Una vez dentro del sistema:

1. **Catálogos** → Crear/editar servicios y extras
2. **+ Nueva OT** → Crear una orden de trabajo rápida
3. **Tablero** → Ver las OTs creadas (cuando implementemos el tablero)

## 📝 Notas

- El NEXTAUTH_SECRET en `.env` es solo para desarrollo. En producción, genera uno seguro con: `openssl rand -base64 32`
- Las contraseñas de ejemplo deben cambiarse en producción
- El sistema está configurado para desarrollo local en `http://localhost:3000`

