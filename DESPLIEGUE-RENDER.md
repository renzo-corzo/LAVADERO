# 🚀 Despliegue en Render - Guía Completa

Render ofrece plan **gratuito permanente** (no es trial) con despliegue automático.

## 📋 Prerrequisitos

- ✅ Repositorio en GitHub: `renzo-corzo/LAVADERO`
- ✅ Cuenta de Render (gratis)

---

## 🚀 Paso 1: Crear Cuenta en Render

1. Ve a: **https://render.com**
2. Haz clic en **"Get Started for Free"** o **"Sign Up"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Render para acceder a tus repositorios
5. Verifica tu email si es necesario

---

## 🔗 Paso 2: Crear Nuevo Web Service

1. En Render Dashboard, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Haz clic en **"Connect account"** o **"Connect GitHub"** si aún no lo has hecho
4. Selecciona el repositorio: **`renzo-corzo/LAVADERO`**
5. Haz clic en **"Connect"**

---

## ⚙️ Paso 3: Configuración del Web Service

Render debería detectar automáticamente Next.js. Configura:

### Configuración Básica:
- **Name**: `lavadero` (o el nombre que prefieras)
- **Region**: Selecciona la más cercana (ej: `Oregon (US West)` o `Frankfurt (EU)`)

### Build & Deploy:
- **Branch**: `main`
- **Root Directory**: `.` (dejar vacío)
- **Runtime**: `Node`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
  O si prefieres:
  ```
  npm install && prisma generate && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```

### Plan:
- Selecciona **"Free"** (plan gratuito permanente)

---

## 🗄️ Paso 4: Crear Base de Datos PostgreSQL (Opcional)

Puedes crear una base de datos PostgreSQL gratuita en Render:

1. En Render Dashboard, haz clic en **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `lavadero-db` (o el nombre que prefieras)
   - **Database**: `lavadero` (o el nombre que prefieras)
   - **User**: Se genera automáticamente
   - **Region**: Misma región que tu Web Service
   - **PostgreSQL Version**: `16` (recomendado)
   - **Plan**: **"Free"**
4. Haz clic en **"Create Database"**

**Después de crear:**
1. Ve a la base de datos creada
2. En la pestaña **"Connections"**, verás la **"Internal Database URL"**
3. Copia esta URL (es tu `DATABASE_URL`)

**O puedes usar Neon** (tu base de datos actual):
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🔐 Paso 5: Configurar Variables de Entorno

1. En tu Web Service, ve a la pestaña **"Environment"**
2. Haz clic en **"Add Environment Variable"**
3. Agrega estas variables:

### Variable 1: DATABASE_URL
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
*(O usa la Internal Database URL si creaste la BD en Render)*

### Variable 2: NEXTAUTH_SECRET
```
VVLK4UNmAOC3pJZ8BEIoK/zcPuLytaTWfXF8juxcGz4=
```

### Variable 3: NEXTAUTH_URL
```
https://lavadero.onrender.com
```
**⚠️ IMPORTANTE**: Render te dará una URL después del primer deploy (será algo como `lavadero.onrender.com` o `lavadero-xxxx.onrender.com`). Actualiza esta variable con la URL exacta que Render te proporcione.

### Variable 4: NODE_ENV
```
production
```

---

## 🚢 Paso 6: Primer Despliegue

1. Después de configurar todo, haz clic en **"Create Web Service"**
2. Render iniciará automáticamente el build y deploy
3. Ve a la pestaña **"Logs"** para ver el progreso
4. El primer deploy puede tardar 5-10 minutos

---

## 🌐 Paso 7: Configurar Dominio y Actualizar NEXTAUTH_URL

1. Después del deploy exitoso, Render te dará una URL automática
2. La URL será algo como: `lavadero.onrender.com` o `lavadero-xxxx.onrender.com`
3. Ve a **"Settings"** → **"Environment"**
4. Actualiza la variable `NEXTAUTH_URL` con la URL exacta:
   ```
   https://tu-url.onrender.com
   ```
5. Haz clic en **"Save Changes"**
6. Render hará un redeploy automáticamente

---

## 🔄 Paso 8: Despliegue Automático

Render por defecto despliega automáticamente:
- ✅ Cada push a `main` → nuevo deployment
- ✅ Funciona automáticamente, no necesitas configurar nada

---

## 📝 Paso 9: Ejecutar Migraciones de Base de Datos

Si usas la base de datos de Neon (actual), las migraciones ya están aplicadas.

Si creaste una nueva base de datos en Render:

### Opción A: Desde Render Shell (Terminal)
1. En Render Dashboard, ve a tu Web Service
2. Haz clic en **"Shell"** (parte superior)
3. Ejecuta:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

### Opción B: Desde tu máquina local
1. Actualiza temporalmente tu `.env` local con la nueva `DATABASE_URL` de Render
2. Ejecuta:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

---

## ⚠️ Notas Importantes sobre el Plan Gratuito

1. **Sleep después de inactividad**: El plan gratuito "duerme" después de 15 minutos de inactividad. El primer request después de dormir puede tardar 30-60 segundos en despertar.

2. **Límites**: 
   - 750 horas/mes gratis (suficiente para uso personal)
   - 512 MB RAM
   - 0.1 CPU

3. **Base de datos gratuita**: 
   - Se elimina después de 90 días de inactividad
   - Backup manual disponible

---

## ✅ Verificación

1. Espera a que el deployment termine (estado "Live")
2. Haz clic en la URL que Render te proporciona
3. Si es la primera vez después de dormir, espera 30-60 segundos
4. Deberías ver la aplicación funcionando
5. Intenta hacer login:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔧 Troubleshooting

### Error: "Build Failed"
- Revisa los logs en Render → Logs
- Verifica que todas las variables de entorno estén configuradas
- Verifica que el build command sea correcto
- Asegúrate de que `prisma generate` esté en el build command si usas Prisma

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Si usas Neon, verifica que la URL incluya `?sslmode=require`
- Si usas Render DB, usa la "Internal Database URL" (más rápido y seguro)

### Error: "NEXTAUTH_URL mismatch"
- Actualiza `NEXTAUTH_URL` con la URL exacta que te da Render
- Debe ser `https://tu-url.onrender.com` (sin barra final)
- Guarda los cambios y Render hará redeploy automático

### La app está "dormida"
- Si no usas la app por 15 minutos, Render la pone en "sleep"
- El primer request después puede tardar 30-60 segundos
- Esto es normal en el plan gratuito
- Para evitar esto, puedes usar un servicio de "ping" que haga requests periódicos

---

## 📊 Comparación: Render vs Railway vs Vercel

| Característica | Render | Railway | Vercel |
|---------------|--------|---------|--------|
| Plan Gratuito | ✅ Permanente | ❌ Trial solo | ✅ Limitado |
| Despliegue Auto | ✅ | ✅ | ✅ |
| Base de Datos | ✅ PostgreSQL gratis | ✅ Opcional | ❌ |
| Sleep Mode | ⚠️ 15 min inactivo | ❌ | ❌ |
| Facilidad | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Límites | 750h/mes | Créditos | 100GB bandwidth |

---

## 💡 Ventajas de Render

1. **Gratis permanente**: No es trial, es para siempre
2. **Base de datos incluida**: PostgreSQL gratis (90 días de retención)
3. **Despliegue automático**: Funciona perfectamente con GitHub
4. **Fácil de usar**: Interfaz simple y clara
5. **Logs buenos**: Fáciles de leer y debuggear

---

## 🔗 URLs Importantes

- **Render Dashboard**: https://dashboard.render.com
- **Documentación Render**: https://render.com/docs
- **Tu App**: Se generará después del primer deploy

---

¡Listo! Render es una excelente opción gratuita permanente. 🚀✨


