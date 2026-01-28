# 🚂 Despliegue en Railway - Guía Completa

Railway es más simple que Vercel y tiene despliegue automático desde GitHub.

## 📋 Prerrequisitos

- ✅ Repositorio en GitHub: `renzo-corzo/LAVADERO`
- ✅ Base de datos: Puedes usar Neon (actual) o crear una nueva en Railway

---

## 🚀 Paso 1: Crear Cuenta en Railway

1. Ve a: **https://railway.app**
2. Haz clic en **"Start a New Project"** o **"Login"**
3. Selecciona **"Login with GitHub"**
4. Autoriza a Railway para acceder a tus repositorios
5. Acepta los términos y condiciones

---

## 🔗 Paso 2: Conectar Repositorio

1. En Railway Dashboard, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona: **`renzo-corzo/LAVADERO`**
4. Railway detectará automáticamente que es un proyecto Next.js

---

## ⚙️ Paso 3: Configuración Inicial

Railway debería detectar automáticamente:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `.` (raíz del proyecto)

Si no detecta automáticamente, ajusta manualmente en **Settings**.

---

## 🔐 Paso 4: Configurar Variables de Entorno

1. En tu proyecto en Railway, ve a la pestaña **"Variables"**
2. Agrega estas variables:

### Variable 1: DATABASE_URL
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
**Opcional**: Si quieres crear una base de datos nueva en Railway (más abajo)

### Variable 2: NEXTAUTH_SECRET
```
VVLK4UNmAOC3pJZ8BEIoK/zcPuLytaTWfXF8juxcGz4=
```
*(O genera una nueva si prefieres)*

### Variable 3: NEXTAUTH_URL
```
https://tu-proyecto.railway.app
```
**⚠️ IMPORTANTE**: Railway te dará una URL automática después del primer deploy. Actualiza esta variable con la URL que te proporcione Railway.

### Variable 4: NODE_ENV (Opcional)
```
production
```

---

## 🗄️ Paso 5: Base de Datos (Opcional - Crear Nueva en Railway)

Si quieres crear una base de datos PostgreSQL directamente en Railway:

1. En Railway Dashboard, haz clic en **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creará una base de datos PostgreSQL automáticamente
3. Ve a la pestaña **"Variables"** de la base de datos
4. Copia la variable **`DATABASE_URL`** (Railway la genera automáticamente)
5. Actualiza la variable `DATABASE_URL` en tu proyecto con esta nueva URL
6. **Ejecuta las migraciones**: Railway tiene un terminal integrado, o puedes ejecutarlas localmente con esta nueva URL

**Ventaja**: Todo en un solo lugar (app + BD en Railway)

**Desventaja**: Tendrás que ejecutar las migraciones y seed de nuevo

---

## 🚢 Paso 6: Primer Despliegue

1. Railway iniciará automáticamente el despliegue cuando conectes el repositorio
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. El primer deploy puede tardar 3-5 minutos

---

## 🌐 Paso 7: Configurar Dominio

1. Después del primer deploy exitoso, ve a la pestaña **"Settings"**
2. En la sección **"Networking"**, verás una URL generada automáticamente (ej: `lavadero-production.up.railway.app`)
3. Railway genera una URL única automáticamente
4. **Actualiza** la variable `NEXTAUTH_URL` con esta nueva URL
5. Haz un nuevo deploy (Railway puede hacerlo automáticamente, o haz clic en "Redeploy")

---

## 🔄 Paso 8: Despliegue Automático

Railway por defecto despliega automáticamente:
- ✅ Cada push a `main` → nuevo deployment
- ✅ No necesitas configurar nada adicional

---

## 📝 Paso 9: Ejecutar Migraciones de Base de Datos

Si usas la base de datos de Neon (actual), las migraciones ya están aplicadas.

Si creaste una nueva base de datos en Railway:

### Opción A: Desde Railway Terminal
1. En Railway Dashboard, ve a tu proyecto
2. Haz clic en **"View Logs"** o busca la opción **"Terminal"**
3. Ejecuta:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

### Opción B: Desde tu máquina local
1. Actualiza temporalmente tu `.env` local con la nueva `DATABASE_URL` de Railway
2. Ejecuta:
   ```bash
   npm run db:migrate:deploy
   npm run db:seed
   ```

---

## ✅ Verificación

1. Espera a que el deployment termine (estado "Success")
2. Haz clic en la URL generada por Railway
3. Deberías ver la aplicación funcionando
4. Intenta hacer login:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔧 Troubleshooting

### Error: "Build Failed"
- Revisa los logs en Railway → Deployments → [tu deployment] → Logs
- Verifica que todas las variables de entorno estén configuradas
- Verifica que el build command sea correcto: `npm run build`

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Si usas Neon, verifica que la URL incluya `?sslmode=require`
- Verifica que la base de datos esté accesible desde internet

### Error: "NEXTAUTH_URL mismatch"
- Actualiza `NEXTAUTH_URL` con la URL exacta que te da Railway
- Debe ser `https://tu-url.railway.app` (sin barra final)
- Haz un redeploy después de actualizar

---

## 📊 Comparación: Vercel vs Railway

| Característica | Vercel | Railway |
|---------------|--------|---------|
| Despliegue Automático | ✅ | ✅ |
| Base de Datos Incluida | ❌ | ✅ (opcional) |
| Facilidad de Uso | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Plan Gratuito | ✅ (limitado) | ✅ (créditos) |
| Variables de Entorno | ✅ | ✅ |
| Logs | ✅ | ✅ |
| Terminal Integrado | ❌ | ✅ |

---

## 💡 Ventajas de Railway

1. **Más simple**: Menos configuración necesaria
2. **Base de datos integrada**: Puedes crear PostgreSQL directamente
3. **Terminal integrado**: Para ejecutar comandos directamente
4. **Mejor logging**: Logs más claros y fáciles de leer
5. **Despliegue más rápido**: Generalmente más rápido que Vercel

---

## 🔗 URLs Importantes

- **Railway Dashboard**: https://railway.app/dashboard
- **Documentación Railway**: https://docs.railway.app
- **Tu Proyecto**: (se generará después del primer deploy)

---

¡Listo! Railway debería ser mucho más simple que Vercel. 🚂✨


