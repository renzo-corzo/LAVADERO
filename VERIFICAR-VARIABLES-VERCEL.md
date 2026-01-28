# 🔍 Verificar Variables de Entorno en Vercel

## ❌ Error Actual

```
the URL must start with the protocol `postgresql://` or `postgres://`
```

Esto significa que `DATABASE_URL` está **vacía** o **mal configurada** en Production.

---

## ✅ Solución: Verificar y Corregir

### Paso 1: Verificar Variables en Vercel

1. Ve a: https://vercel.com
2. Selecciona tu proyecto: `lavadero`
3. Ve a **Settings** → **Environment Variables**
4. Deberías ver estas 3 variables:

| Key | Value | Production | Preview | Development |
|-----|-------|------------|---------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:...` | ✅ | ✅ | ✅ |
| `NEXTAUTH_SECRET` | `DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj` | ✅ | ✅ | ✅ |
| `NEXTAUTH_URL` | `https://lavadero-one.vercel.app` | ✅ | ✅ | ❌ |

### Paso 2: Si Falta `DATABASE_URL` o no tiene ✅ en Production

1. **Si existe pero NO tiene ✅ en Production:**
   - Haz click en la variable `DATABASE_URL`
   - Marca la casilla **Production** ✅
   - Guarda

2. **Si NO existe:**
   - Haz click en **"Add New"**
   - Key: `DATABASE_URL`
   - Value: (Copia EXACTAMENTE esto, sin espacios):
   ```
   postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   - Marca las 3 casillas: ✅ Production, ✅ Preview, ✅ Development
   - Guarda

3. **Si existe pero está vacía o incorrecta:**
   - Haz click en la variable
   - **Elimínala** (botón "Delete")
   - Crea una nueva siguiendo el paso 2

### Paso 3: Verificar Formato de DATABASE_URL

La URL debe ser EXACTAMENTE así (sin espacios, sin comillas):

```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

✅ Debe empezar con `postgresql://`  
✅ No debe tener espacios antes o después  
✅ No debe tener comillas alrededor

### Paso 4: Hacer Redeploy

**IMPORTANTE:** Después de cambiar variables, SIEMPRE hacer redeploy:

1. Ve a **Deployments**
2. Haz click en los **3 puntos (...)** del deployment más reciente
3. Selecciona **"Redeploy"**
4. Espera 2-3 minutos

### Paso 5: Verificar en Runtime Logs

Después del redeploy:

1. Ve a **Deployments** → Selecciona el deployment más reciente
2. Abre **"Runtime Logs"** (o haz click en el deployment para ver los logs)
3. Intenta hacer login: `admin` / `admin123`
4. Revisa los logs, deberías ver:
   ```
   🔐 [AUTH] DATABASE_URL existe: true
   🔐 [AUTH] DATABASE_URL primer carácter: p
   🔐 [AUTH] DATABASE_URL primeros 20 chars: postgresql://neondb_
   ```

Si ves `DATABASE_URL existe: false` o `primer carácter: VACÍA`, la variable aún no está configurada.

---

## 🔧 Solución Rápida: Eliminar y Recrear

Si no funciona, elimina todas las variables y créalas de nuevo:

1. **Settings** → **Environment Variables**
2. Elimina las 3 variables (si existen)
3. Crea cada una de nuevo, una por una:

#### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ Production, ✅ Preview, ✅ Development
```

#### Variable 2: NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj
✅ Production, ✅ Preview, ✅ Development
```

#### Variable 3: NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://lavadero-one.vercel.app
✅ Production, ✅ Preview
```

4. **Redeploy** el deployment más reciente

---

## ✅ Probar Login

- URL: `https://lavadero-one.vercel.app`
- Usuario: `admin`
- Contraseña: `admin123`

---

## 📋 Checklist Final

- [ ] Las 3 variables existen en Vercel
- [ ] `DATABASE_URL` tiene ✅ en **Production**
- [ ] `DATABASE_URL` empieza con `postgresql://` (verificar en logs)
- [ ] `NEXTAUTH_SECRET` tiene ✅ en **Production**
- [ ] `NEXTAUTH_URL` tiene ✅ en **Production**
- [ ] Se hizo **Redeploy** después de configurar
- [ ] Se esperó 2-3 minutos después del redeploy
- [ ] Se probó login y se verificaron los logs





