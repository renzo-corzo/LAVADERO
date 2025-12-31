# ⚙️ Configurar Nuevo Proyecto en Vercel

## URL Nueva: https://lavadero-one.vercel.app

Al eliminar y recrear el proyecto, la URL cambió. Necesitas configurar las variables de entorno con la nueva URL.

---

## 📋 Variables de Entorno para el Nuevo Proyecto

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
✅ Aplicar a: Production, Preview, Development

### 2. NEXTAUTH_SECRET
```
DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj
```
✅ Aplicar a: Production, Preview, Development

### 3. NEXTAUTH_URL (⭐ IMPORTANTE: Nueva URL)
```
https://lavadero-one.vercel.app
```
✅ Aplicar a: Production, Preview

---

## 📋 Pasos en Vercel

1. Ve a tu proyecto: `lavadero`
2. Ve a **Settings** → **Environment Variables**
3. Agrega las 3 variables de arriba
4. **IMPORTANTE:** La `NEXTAUTH_URL` debe ser `https://lavadero-one.vercel.app` (no la anterior)
5. Asegúrate de aplicar cada variable a los ambientes correctos
6. Ve a **Deployments** → Haz **Redeploy** del deployment más reciente
7. Espera 1-2 minutos

---

## ✅ Probar Login

Después del redeploy:
- URL: `https://lavadero-one.vercel.app`
- Usuario: `admin`
- Contraseña: `admin123`

---

## 🔍 Si No Funciona

Verifica en **Runtime Logs**:
1. Ve a **Deployments** → Selecciona el deployment más reciente
2. Ve a **"Runtime Logs"**
3. Intenta hacer login
4. Revisa los errores en los logs

