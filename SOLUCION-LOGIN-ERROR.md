# 🔐 Solución: "Usuario o contraseña incorrectos"

Este error generalmente significa que la base de datos está vacía o no tiene usuarios creados.

## 🚨 Problema

La base de datos en Neon está vacía. Necesitas ejecutar el seed para crear los usuarios iniciales.

## ✅ Solución: Poblar la Base de Datos

### Paso 1: Verificar tu archivo .env local

Asegúrate de que tu `.env` local apunte a la misma base de datos de Neon que usas en Vercel:

```env
DATABASE_URL="postgresql://usuario:password@host/database?sslmode=require"
```

**⚠️ IMPORTANTE:** Debe ser la MISMA DATABASE_URL que configuraste en Vercel.

---

### Paso 2: Ejecutar el seed

En tu terminal local (desde la carpeta del proyecto):

```bash
# 1. Asegúrate de estar en la carpeta del proyecto
cd C:\Users\renzo\Desktop\LAVADERO

# 2. Verifica que Prisma esté actualizado
npx prisma generate

# 3. Sincroniza el esquema (crea las tablas si no existen)
npx prisma db push

# 4. Ejecuta el seed para crear usuarios y datos iniciales
npm run db:seed
```

---

### Paso 3: Verificar usuarios creados

Después del seed, deberías tener estos usuarios:

**Usuario Administrador:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** `DUENO`

**Usuario Encargado (si se crea en el seed):**
- **Usuario:** `encargado`
- **Contraseña:** `encargado123`
- **Rol:** `ENCARGADO`

---

### Paso 4: Intentar login nuevamente

1. Ve a: https://lavadero-nine.vercel.app/
2. Usuario: `admin`
3. Contraseña: `admin123`
4. Debería funcionar ✅

---

## 🔍 Si Sigue Sin Funcionar

### Verificar que el seed se ejecutó correctamente:

```bash
# Opción 1: Ver usuarios en Prisma Studio
npx prisma studio
# Esto abre un navegador donde puedes ver las tablas
# Ve a la tabla "Usuario" y verifica que existan usuarios

# Opción 2: Verificar directamente en la base de datos
# Puedes usar una herramienta como pgAdmin o DBeaver
# para conectarte a Neon y ver la tabla "Usuario"
```

### Verificar conexión en Vercel:

1. Ve a Vercel → Tu Proyecto → **Deployments**
2. Haz clic en el último deployment
3. Ve a **Runtime Logs**
4. Intenta hacer login nuevamente
5. Revisa los logs para ver qué está pasando

Busca mensajes que empiecen con:
- `🔐 [AUTH] Intento de login`
- `👤 [AUTH] Usuario encontrado`
- `❌ [AUTH]` (errores)

---

## 📝 Usuarios por Defecto del Seed

Si revisas `prisma/seed.ts`, los usuarios creados son:

```typescript
// Usuario DUEÑO (Administrador)
{
  usuario: 'admin',
  password: 'admin123', // Hasheado con bcrypt
  nombre: 'Administrador',
  rol: 'DUENO',
  activo: true
}
```

---

## 🚨 Problemas Comunes

### Error: "Cannot find module '@prisma/client'"
```bash
npm install
npx prisma generate
```

### Error: "P1001: Can't reach database server"
- Verifica que la `DATABASE_URL` en tu `.env` local sea correcta
- Verifica que la base de datos de Neon esté activa
- Verifica que la conexión tenga `sslmode=require`

### Error: "Table does not exist"
```bash
npx prisma db push
```

### El seed se ejecuta pero no aparecen usuarios
- Verifica que no haya errores en la consola
- Revisa Prisma Studio para confirmar que se crearon
- Verifica que el archivo `prisma/seed.ts` esté correcto

---

## ✅ Checklist

- [ ] `.env` local tiene la misma `DATABASE_URL` que Vercel
- [ ] Ejecuté `npx prisma generate`
- [ ] Ejecuté `npx prisma db push`
- [ ] Ejecuté `npm run db:seed`
- [ ] Verifiqué que los usuarios se crearon (Prisma Studio)
- [ ] Intenté login con `admin` / `admin123`
- [ ] Si falla, revisé los logs en Vercel Runtime Logs

---

¡Ejecuta el seed y debería funcionar! 🚀




