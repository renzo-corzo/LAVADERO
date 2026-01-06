# 🚀 Configuración para Nuevo Proyecto Vercel

## Nueva URL del Proyecto
**URL:** https://lavadero-nine.vercel.app/

---

## 📋 Variables de Entorno a Configurar

Ve a Vercel → Tu Proyecto → **Settings** → **Environment Variables**

### 1. DATABASE_URL
**Key:** `DATABASE_URL`

**Value:** 
```
postgresql://usuario:password@host/database?sslmode=require
```
(Obtén la URL completa desde tu proyecto Neon)

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 2. NEXTAUTH_SECRET
**Key:** `NEXTAUTH_SECRET`

**Value:**
```
ISkel6k/Usacz80o4klUXNiUPbP5skTSqIVnjQeaWa8=
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 3. NEXTAUTH_URL
**Key:** `NEXTAUTH_URL`

**Value:**
```
https://lavadero-nine.vercel.app
```

**⚠️ IMPORTANTE:** Sin barra final `/`

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## ✅ Pasos para Configurar

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto

2. **Ve a Settings → Environment Variables**

3. **Agrega las 3 variables:**
   - Haz clic en **"Add New"**
   - Agrega cada una con sus valores
   - **IMPORTANTE:** Marca todas las casillas (Production, Preview, Development)

4. **Después de agregar todas, haz un Redeploy:**
   - Ve a **Deployments**
   - Haz clic en los 3 puntos (⋯) del último deployment
   - Selecciona **"Redeploy"**
   - O espera al próximo push a GitHub (se redeployará automáticamente)

---

## 🔍 Verificar que Funcionó

1. **Visita:** https://lavadero-nine.vercel.app/
2. **Deberías ver la página de login**
3. **Intenta hacer login:**
   - Usuario: `admin`
   - Contraseña: `admin123`

4. **Si funciona:** ✅ Todo está correcto
5. **Si no funciona:** Revisa los logs en Vercel → Deployments → Runtime Logs

---

## 🚨 Si Necesitas Poblar la Base de Datos

Si la base de datos está vacía, ejecuta localmente:

```bash
# Asegúrate de que tu .env local apunte a la misma BD de Neon
npx prisma db push
npm run db:seed
```

Esto creará los usuarios iniciales y datos de ejemplo.

---

## ✅ Checklist Final

- [ ] DATABASE_URL configurada (de Neon)
- [ ] NEXTAUTH_SECRET configurada
- [ ] NEXTAUTH_URL = `https://lavadero-nine.vercel.app`
- [ ] Todas las variables habilitadas para Production
- [ ] Redeploy realizado
- [ ] Login funciona correctamente

---

¡Listo! Con estas configuraciones debería funcionar. 🚀




