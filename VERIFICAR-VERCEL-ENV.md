# 🔍 Verificar Variables de Entorno en Vercel

## Problema: Login no funciona en producción

Si los usuarios están en la base de datos pero no puedes iniciar sesión, probablemente es un problema de configuración en Vercel.

---

## 📋 Pasos para Verificar

### 1. Verificar DATABASE_URL en Vercel

1. Ve a tu proyecto en Vercel: `https://vercel.com`
2. Ve a **Settings** → **Environment Variables**
3. Busca `DATABASE_URL`
4. Verifica que sea **exactamente** esta:
   ```
   postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Verifica que esté aplicada a **Production, Preview y Development**

### 2. Verificar NEXTAUTH_URL en Vercel

1. En **Environment Variables**, busca `NEXTAUTH_URL`
2. Debe ser: `https://lavadero-rosy.vercel.app`
3. Asegúrate de que esté aplicada a **Production y Preview**
4. Para Development puedes dejarlo como `http://localhost:3000`

### 3. Verificar NEXTAUTH_SECRET

1. Busca `NEXTAUTH_SECRET`
2. Debe ser: `DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj`
3. Debe estar aplicado a **todas** las opciones

### 4. Si cambiaste alguna variable, HAZ REDEPLOY

1. Ve a **Deployments**
2. Haz click en los **3 puntos (...)** del último deployment
3. Selecciona **"Redeploy"**
4. Espera que termine

---

## 🐛 Verificar Logs de Error

Si aún no funciona, revisa los logs:

1. Ve a **Deployments** → Selecciona el último deployment
2. Ve a **"Runtime Logs"** (o **"Build Logs"** si es un error de build)
3. Busca errores relacionados con:
   - Base de datos
   - NextAuth
   - Autenticación

---

## ✅ Verificación Rápida

**Ejecuta esto localmente para verificar que el login funciona:**

```bash
node probar-login.js
```

Si funciona localmente pero no en Vercel, el problema es la configuración de variables de entorno.

---

## 🔧 Solución Alternativa: Re-hashear Contraseñas

Si sospechas que las contraseñas no se hashearon correctamente, puedes re-hashearlas:

1. Ejecuta `npm run db:seed` nuevamente (usará `upsert`, así que actualizará)

---

## 📞 Checklist

- [ ] `DATABASE_URL` está configurada correctamente en Vercel
- [ ] `NEXTAUTH_URL` está configurada con la URL de producción
- [ ] `NEXTAUTH_SECRET` está configurado
- [ ] Todas las variables están aplicadas a Production
- [ ] Se hizo Redeploy después de cambiar variables
- [ ] El login funciona localmente (con la misma DATABASE_URL de Neon)




