# 🔐 Variables de Entorno para Vercel

Cuando recrees el proyecto en Vercel, necesitas configurar estas variables:

## 📋 Variables Obligatorias

### 1. DATABASE_URL
**Descripción:** URL de conexión a tu base de datos PostgreSQL (Neon)

**Formato:**
```
postgresql://usuario:contraseña@host:puerto/database?sslmode=require
```

**Cómo obtenerla:**
1. Ve a tu proyecto en Neon: https://console.neon.tech/
2. Selecciona tu proyecto
3. Ve a **"Connection Details"** o **"Connection String"**
4. Copia la cadena de conexión completa

**Ejemplo (NO usar esta, usar la tuya):**
```
postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-nameless-frost-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**⚠️ IMPORTANTE:** 
- Debe empezar con `postgresql://` o `postgres://`
- Usa la versión con `pooler` para mejor rendimiento en producción
- La contraseña está incluida en la URL (es normal)

---

### 2. NEXTAUTH_SECRET
**Descripción:** Clave secreta para cifrar las sesiones de NextAuth

**Cómo generarla:**
Opción A - Desde terminal:
```bash
openssl rand -base64 32
```

Opción B - Desde Node.js (ejecuta esto localmente):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Opción C - Generador online:
- Ve a: https://generate-secret.vercel.app/32
- Copia el resultado

**Ejemplo (NO usar esta, generar una nueva):**
```
XyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX
```

**⚠️ IMPORTANTE:**
- Debe ser una cadena larga y aleatoria (al menos 32 caracteres)
- NO la compartas ni la subas a Git
- Úsala solo para este proyecto

---

### 3. NEXTAUTH_URL
**Descripción:** URL pública de tu aplicación en Vercel

**Formato:**
```
https://tu-proyecto.vercel.app
```

**Cómo obtenerla:**
1. Después de crear el proyecto en Vercel
2. Te dará una URL automática como: `https://lavadero-one.vercel.app`
3. O usa un dominio personalizado si lo configuraste

**Ejemplo actual:**
```
https://lavadero-nine.vercel.app
```

**Ejemplos anteriores (NO usar):**
```
https://lavadero-one.vercel.app
```

**⚠️ IMPORTANTE:**
- Debe ser HTTPS (no HTTP)
- No debe terminar con `/`
- Si cambias de dominio, actualiza esta variable

---

## 📝 Pasos para Configurar en Vercel

1. **Crea el proyecto en Vercel:**
   - Ve a: https://vercel.com/new
   - Conecta tu repositorio `renzo-corzo/LAVADERO`
   - Configura:
     - **Framework Preset:** Next.js
     - **Root Directory:** `./` (vacío)
     - **Build Command:** `npm run build`
     - **Output Directory:** `.next`

2. **Antes de hacer el primer Deploy, ve a Settings:**
   - Ve a tu proyecto → **Settings** → **Environment Variables**

3. **Agrega cada variable:**
   - Haz clic en **"Add New"**
   - Key: `DATABASE_URL`
   - Value: (tu string de conexión de Neon)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Haz clic en **"Save"**
   
   - Repite para `NEXTAUTH_SECRET` (genera una nueva)
   - Repite para `NEXTAUTH_URL` (será algo como `https://tu-proyecto.vercel.app`)

4. **Verifica:**
   - Deberías ver las 3 variables listadas
   - Todas deben estar habilitadas para Production

5. **Ahora sí, haz el Deploy:**
   - Ve a **Deployments**
   - Si ya se hizo un deploy automático, haz clic en los 3 puntos (⋯) → **"Redeploy"**
   - O crea un nuevo deployment manual

---

## 🔍 Verificar que Funcionó

Después del deploy:

1. **Ve a tu URL de Vercel** (ej: `https://lavadero-one.vercel.app`)
2. **Intenta hacer login:**
   - Usuario: `admin` (o el que creaste en el seed)
   - Contraseña: `admin123` (o la que configuraste)
3. Si funciona, las variables están correctas ✅
4. Si falla, revisa los logs:
   - Ve a Vercel → Tu Proyecto → **Deployments** → Haz clic en el deployment → **Runtime Logs**

---

## 🚨 Problemas Comunes

### Error: "DATABASE_URL no configurada"
- Verifica que la variable esté en Settings → Environment Variables
- Verifica que esté habilitada para Production
- Haz un Redeploy después de agregar la variable

### Error: "Invalid credentials"
- Verifica que la base de datos tenga los usuarios creados
- Ejecuta el seed: `npm run db:seed` localmente (con la misma DATABASE_URL)

### Error: "NEXTAUTH_URL no configurada"
- Verifica que la URL sea correcta (HTTPS, sin barra final)
- Debe apuntar a tu dominio de Vercel

---

## 📌 Resumen Rápido

```
DATABASE_URL = postgresql://... (de Neon)
NEXTAUTH_SECRET = [generar con openssl rand -base64 32]
NEXTAUTH_URL = https://tu-proyecto.vercel.app
```

¡Listo! Con estas 3 variables debería funcionar. 🚀

