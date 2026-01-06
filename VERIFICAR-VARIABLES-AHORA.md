# 🔍 Verificar Variables de Entorno en Vercel (URGENTE)

## ❌ Error Actual

```
❌ [AUTH] Error en authorize: Error: DATABASE_URL no configurada correctamente en Vercel
```

Esto significa que la variable `DATABASE_URL` **NO está configurada** o está **mal configurada** en Vercel.

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Ve a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto (`lavadero-nine` o el nombre que tenga)

### Paso 2: Ve a Environment Variables

1. Haz clic en **"Settings"** (en el menú superior)
2. Haz clic en **"Environment Variables"** (en el menú lateral izquierdo)

### Paso 3: Verifica las Variables

Deberías ver **3 variables** listadas:

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** Debe ser tu string de conexión de Neon (algo como `postgresql://...`)
- **Environments:** Debe tener ✅ en **Production**

**⚠️ IMPORTANTE:**
- Si NO existe, haz clic en **"Add New"** y créala
- Si existe pero está vacía o es incorrecta, edítala
- Debe empezar con `postgresql://` o `postgres://`

#### Variable 2: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Debe ser una cadena aleatoria (ej: `ISkel6k/Usacz80o4klUXNiUPbP5skTSqIVnjQeaWa8=`)
- **Environments:** Debe tener ✅ en **Production**

#### Variable 3: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://lavadero-nine.vercel.app` (SIN barra final)
- **Environments:** Debe tener ✅ en **Production**

---

### Paso 4: Agregar/Editar DATABASE_URL

Si no existe o está incorrecta:

1. Haz clic en **"Add New"** (si no existe) o edita la existente
2. **Key:** `DATABASE_URL`
3. **Value:** Copia tu string de conexión de Neon:
   - Ve a: https://console.neon.tech/
   - Selecciona tu proyecto
   - Ve a **"Connection Details"** o **"Connection String"**
   - Copia la cadena completa (debe incluir `postgresql://`, usuario, contraseña, host, etc.)
4. **Environments:** Marca ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Haz clic en **"Save"**

**Ejemplo de formato correcto:**
```
postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-nameless-frost-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

### Paso 5: Verificar las Otras Variables

Asegúrate de que **TODAS** las 3 variables tengan:
- ✅ Marcadas para **Production**
- Valores correctos
- Sin espacios al inicio o final

---

### Paso 6: REDEPLOY (MUY IMPORTANTE)

**⚠️ CRÍTICO:** Después de agregar/editar variables, DEBES hacer un redeploy:

1. Ve a la pestaña **"Deployments"**
2. Haz clic en los **3 puntos (⋯)** del último deployment
3. Selecciona **"Redeploy"**
4. Confirma el redeploy

**O simplemente:**
- Haz un commit vacío y push (forzará un nuevo deploy con las variables)

---

### Paso 7: Verificar que Funcionó

1. Espera 2-3 minutos a que termine el redeploy
2. Ve a: https://lavadero-nine.vercel.app/
3. Intenta hacer login:
   - Usuario: `admin`
   - Contraseña: `admin123`
4. Si funciona: ✅ ¡Listo!
5. Si sigue fallando: Revisa los Runtime Logs nuevamente

---

## 🚨 Si Aún No Funciona

### Verificar en Runtime Logs:

1. Ve a **Deployments** → Haz clic en el último deployment
2. Ve a la pestaña **"Runtime Logs"**
3. Intenta hacer login nuevamente
4. Busca mensajes que empiecen con:
   - `🔐 [AUTH] DATABASE_URL existe:`
   - `🔐 [AUTH] DATABASE_URL primer carácter:`
   - `🔐 [AUTH] DATABASE_URL primeros 20 chars:`

Estos logs te dirán exactamente qué está pasando con la variable.

---

## 📋 Checklist Final

- [ ] DATABASE_URL configurada en Vercel → Settings → Environment Variables
- [ ] DATABASE_URL tiene ✅ en Production
- [ ] DATABASE_URL empieza con `postgresql://` o `postgres://`
- [ ] NEXTAUTH_SECRET configurada
- [ ] NEXTAUTH_URL = `https://lavadero-nine.vercel.app` (sin barra final)
- [ ] Todas las variables tienen ✅ en Production
- [ ] Redeploy realizado después de agregar/editar variables
- [ ] Login funciona correctamente

---

**¡Configura las variables y haz un redeploy!** 🚀




