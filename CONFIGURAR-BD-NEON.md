# 🗄️ Configurar Base de Datos en Neon

## Problema: No puedes iniciar sesión

La base de datos en Neon está vacía. Necesitamos crear las tablas y los usuarios iniciales.

---

## 📋 Pasos para Configurar la BD

### 1. Actualizar .env local con la DATABASE_URL de Neon

Abre tu archivo `.env` local y actualiza la `DATABASE_URL` con la de Neon:

```env
DATABASE_URL="postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Aplicar el Schema (Crear Tablas)

Ejecuta en tu terminal local:

```bash
npx prisma db push
```

Esto creará todas las tablas en la base de datos de Neon.

### 3. Crear Usuarios y Datos Iniciales (Seed)

Ejecuta:

```bash
npm run db:seed
```

Esto creará:
- ✅ Usuario **admin** (contraseña: `admin123`) - Rol: DUEÑO
- ✅ Usuario **encargado** (contraseña: `encargado123`) - Rol: ENCARGADO
- ✅ Usuario **lavador** (contraseña: `lavador123`) - Rol: LAVADOR
- ✅ Servicios de ejemplo (Lavado Básico, Completo, Premium)
- ✅ Extras de ejemplo (Aspirado Motor, Limpieza de Tapizados, Encerado)

### 4. Probar el Login

Ve a tu aplicación en Vercel: `https://lavadero-rosy.vercel.app`

Ingresa con:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 🔑 Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | DUEÑO |
| `encargado` | `encargado123` | ENCARGADO |
| `lavador` | `lavador123` | LAVADOR |

⚠️ **IMPORTANTE:** Cambia estas contraseñas después del primer login en producción.

---

## ✅ Verificación

Después de ejecutar los comandos, deberías poder:
1. Acceder a `https://lavadero-rosy.vercel.app`
2. Iniciar sesión con `admin` / `admin123`
3. Ver el dashboard del sistema

---

## 🆘 Si hay Errores

- **Error de conexión:** Verifica que la `DATABASE_URL` esté correcta y tenga `?sslmode=require`
- **Error "relation does not exist":** Ejecuta `npx prisma db push` nuevamente
- **Error al hacer seed:** Verifica que las tablas se hayan creado correctamente




