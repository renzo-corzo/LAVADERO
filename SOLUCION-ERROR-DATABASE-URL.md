# 🔧 Solución: Error DATABASE_URL en Vercel

## ❌ Error Detectado

```
the URL must start with the protocol `postgresql://` or `postgres://`
```

Esto significa que la variable `DATABASE_URL` en Vercel está:
- ❌ Vacía
- ❌ Con formato incorrecto
- ❌ Con espacios extra
- ❌ No aplicada a Production

---

## ✅ Solución Paso a Paso

### 1. Verificar/Corregir DATABASE_URL en Vercel

1. Ve a tu proyecto en Vercel: `lavadero`
2. Ve a **Settings** → **Environment Variables**
3. Busca `DATABASE_URL`
4. Si existe, **ELIMÍNALA** (para recrearla correctamente)
5. Agrega una nueva variable:

**Key:** `DATABASE_URL`

**Value:** (Copia exactamente esto, SIN espacios al inicio o final)
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**IMPORTANTE:** 
- ✅ Marca las 3 casillas: Production, Preview, Development
- ✅ NO agregues comillas
- ✅ NO agregues espacios antes o después
- ✅ Copia exactamente como está arriba

### 2. Verificar las otras 2 variables

#### NEXTAUTH_SECRET
**Key:** `NEXTAUTH_SECRET`  
**Value:** 
```
DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj
```
✅ Production, Preview, Development

#### NEXTAUTH_URL
**Key:** `NEXTAUTH_URL`  
**Value:** 
```
https://lavadero-one.vercel.app
```
✅ Production, Preview

### 3. Hacer Redeploy

**IMPORTANTE:** Después de cambiar variables, SIEMPRE hacer redeploy:

1. Ve a **Deployments**
2. Haz click en los 3 puntos (...) del deployment más reciente
3. Selecciona **"Redeploy"**
4. Marca **"Use existing Build Cache"** (opcional)
5. Espera 2-3 minutos

### 4. Verificar que las Variables Estén Activas

1. Ve a **Settings** → **Environment Variables**
2. Asegúrate de que las 3 variables estén listadas
3. Verifica que tengan el checkmark ✅ en "Production"

---

## 🔍 Verificar en Runtime Logs

Después del redeploy:

1. Ve a **Deployments** → Selecciona el deployment más reciente
2. Abre **"Runtime Logs"**
3. Intenta hacer login
4. Si ves el mismo error, la variable aún no está configurada correctamente

---

## ✅ Probar Login

- URL: `https://lavadero-one.vercel.app`
- Usuario: `admin`
- Contraseña: `admin123`

---

## 📋 Checklist

- [ ] DATABASE_URL eliminada y recreada (sin espacios, sin comillas)
- [ ] DATABASE_URL aplicada a Production ✅
- [ ] NEXTAUTH_SECRET configurada y aplicada a Production ✅
- [ ] NEXTAUTH_URL configurada con `https://lavadero-one.vercel.app` y aplicada a Production ✅
- [ ] Redeploy realizado después de configurar variables
- [ ] Esperado 2-3 minutos después del redeploy
- [ ] Probar login nuevamente





