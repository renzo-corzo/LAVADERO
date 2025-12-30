# 🚀 Guía Paso a Paso: Deploy en Vercel

## 📋 Paso 1: Crear Base de Datos PostgreSQL (Neon - Gratis)

### 1.1. Ir a Neon.tech
1. Ve a https://neon.tech
2. Click en "Sign Up" (puedes usar tu cuenta de GitHub)

### 1.2. Crear Proyecto
1. Click en "Create a project"
2. Elige un nombre: `lavadero-sistema` (o el que prefieras)
3. Selecciona una región cercana (ej: `US East` o `US West`)
4. PostgreSQL version: deja la última (15 o 16)
5. Click en "Create project"

### 1.3. Obtener Connection String
1. Una vez creado, ve a la sección "Connection Details" o abre el modal "Connect to your database"
2. **Activa Connection Pooling** (toggle verde) - Recomendado para producción
3. En el dropdown, selecciona "psql" o "connection string"
4. Haz click en "Copy snippet" o copia manualmente la connection string
5. La connection string debería verse así:
   ```
   postgresql://usuario:password@ep-xxxxx-xxxxx.xxx.neon.tech/neondb?sslmode=require
   ```
6. **IMPORTANTE:** 
   - Si usas Connection Pooling, la URL incluirá `-pooler` en el host
   - Si no tiene `?sslmode=require`, agrégalo al final
   - Si el password está oculto (***), haz click en "Show password" antes de copiar
7. Guarda esta URL completa, la necesitarás en el Paso 3

---

## 📋 Paso 2: Migrar Base de Datos a Neon

### 2.1. Actualizar DATABASE_URL localmente
1. En tu proyecto local, actualiza el archivo `.env` (si lo tienes):
   ```env
   DATABASE_URL=tu-connection-string-de-neon-con-sslmode=require
   ```

### 2.2. Ejecutar Migraciones
```bash
# Generar Prisma Client
npx prisma generate

# Aplicar migraciones/schema a la base de datos de Neon
npx prisma db push
```

### 2.3. (Opcional) Cargar Datos Iniciales
```bash
# Si tienes un seed, ejecútalo
npm run db:seed
```

---

## 📋 Paso 3: Deploy en Vercel

### 3.1. Ir a Vercel
1. Ve a https://vercel.com
2. Click en "Sign Up" (puedes usar tu cuenta de GitHub)

### 3.2. Importar Proyecto
1. Click en "Add New" → "Project"
2. Conecta tu cuenta de GitHub si aún no lo has hecho
3. Busca y selecciona: `renzo-corzo/LAVADERO`
4. Click en "Import"

### 3.3. Configurar Proyecto
1. **Framework Preset:** Debería detectar automáticamente "Next.js"
2. **Root Directory:** Deja `.` (raíz)
3. **Build Command:** Ya está configurado (automático)
4. **Output Directory:** Deja por defecto (`.next`)

### 3.4. Configurar Variables de Entorno

En la sección "Environment Variables", agrega estas 3 variables:

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** Tu connection string de Neon (con `?sslmode=require`)
- **Environment:** Selecciona las 3 (Production, Preview, Development)

#### Variable 2: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Genera uno con este comando o usa https://generate-secret.vercel.app/32
  ```bash
  # PowerShell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
  ```
- **Environment:** Las 3

#### Variable 3: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** Por ahora usa `http://localhost:3000` (lo actualizaremos después)
- **Environment:** Por ahora solo Development

### 3.5. Deploy
1. Click en "Deploy"
2. Espera 2-3 minutos mientras Vercel:
   - Instala dependencias
   - Genera Prisma Client
   - Hace build de Next.js
   - Despliega la aplicación

### 3.6. Obtener URL de Producción
1. Una vez el deploy termine, Vercel te dará una URL como:
   ```
   https://lavadero-sistema.vercel.app
   ```
2. Copia esta URL

### 3.7. Actualizar NEXTAUTH_URL
1. Ve a Settings → Environment Variables
2. Encuentra `NEXTAUTH_URL`
3. Edítalo y cambia el valor a tu URL de producción:
   ```
   https://lavadero-sistema.vercel.app
   ```
4. Agrega también en Production y Preview
5. Guarda

### 3.8. Redeploy
1. Ve a la pestaña "Deployments"
2. Click en los 3 puntos (...) del último deploy
3. Click en "Redeploy"
4. Esto aplicará la nueva variable `NEXTAUTH_URL`

---

## 📋 Paso 4: Verificar que Todo Funciona

### 4.1. Abrir la App
1. Ve a tu URL de Vercel (ej: `https://lavadero-sistema.vercel.app`)
2. Deberías ver la página de login

### 4.2. Probar Login
1. Usa las credenciales de tu usuario (si cargaste datos con seed)
2. O crea un nuevo usuario si no tienes datos

### 4.3. Verificar Funcionalidades
- ✅ Login funciona
- ✅ Dashboard carga
- ✅ Tablero muestra OTs
- ✅ Puedes crear una OT
- ✅ Base de datos funciona

---

## 🔧 Solución de Problemas

### Error: "Prisma Client not generated"
**Solución:** Vercel debería ejecutar `prisma generate` automáticamente gracias al `postinstall` script.

### Error: "Database connection failed"
**Solución:**
1. Verifica que `DATABASE_URL` tenga `?sslmode=require` al final
2. Verifica que la base de datos de Neon esté activa
3. Revisa los logs en Vercel (Deployments → Ver logs)

### Error: "NEXTAUTH_URL mismatch"
**Solución:**
1. Asegúrate de que `NEXTAUTH_URL` en Vercel sea exactamente la URL de tu app
2. No incluyas `/` al final
3. Debe ser `https://` (no `http://`)

### Build falla
**Solución:**
1. Revisa los logs en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba hacer build local: `npm run build`

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu sistema estará en producción y accesible desde cualquier lugar.

**URL de tu app:** `https://tu-proyecto.vercel.app`

¿Necesitas ayuda con algún paso específico?

