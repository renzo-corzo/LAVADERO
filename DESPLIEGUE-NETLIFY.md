# 🚀 Despliegue en Netlify - Guía Completa

Netlify ofrece plan **gratuito permanente** SIN sleep mode (siempre activo).

## 📋 Prerrequisitos

- ✅ Repositorio en GitHub: `renzo-corzo/LAVADERO`
- ✅ Cuenta de Netlify (gratis)

---

## 🚀 Paso 1: Crear Cuenta en Netlify

1. Ve a: **https://netlify.com**
2. Haz clic en **"Sign up"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Netlify para acceder a tus repositorios
5. Verifica tu email si es necesario

---

## 🔗 Paso 2: Importar Proyecto

1. En Netlify Dashboard, haz clic en **"Add new site"** → **"Import an existing project"**
2. Selecciona **"Deploy with GitHub"**
3. Si es la primera vez, autoriza a Netlify para acceder a tus repositorios
4. Busca y selecciona: **`renzo-corzo/LAVADERO`**
5. Haz clic en **"Install"** o **"Authorize"** si es necesario

---

## ⚙️ Paso 3: Configuración del Build

Netlify debería detectar automáticamente Next.js. Configura:

### Build Settings:
- **Branch to deploy**: `main`
- **Base directory**: `.` (dejar vacío)
- **Build command**: 
  ```
  npm run build
  ```
  O si prefieres:
  ```
  prisma generate && npm run build
  ```
- **Publish directory**: `.next`
  
**⚠️ IMPORTANTE para Next.js:**
Netlify necesita configuración especial para Next.js. Después de crear el site, necesitarás configurar funciones serverless.

---

## 🔧 Paso 4: Configurar Netlify para Next.js

Después de crear el site, necesitas configurar:

1. Ve a **"Site settings"** → **"Functions"**
2. Asegúrate de que **"Build command"** incluya:
   ```
   prisma generate && npm run build
   ```

3. En la raíz del proyecto, crea o actualiza `netlify.toml`:

```toml
[build]
  command = "prisma generate && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

---

## 🔐 Paso 5: Configurar Variables de Entorno

1. En Netlify Dashboard, ve a tu site
2. Ve a **"Site settings"** → **"Environment variables"**
3. Haz clic en **"Add a variable"**
4. Agrega estas variables:

### Variable 1: DATABASE_URL
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Variable 2: NEXTAUTH_SECRET
```
VVLK4UNmAOC3pJZ8BEIoK/zcPuLytaTWfXF8juxcGz4=
```

### Variable 3: NEXTAUTH_URL
```
https://lavadero.netlify.app
```
**⚠️ IMPORTANTE**: Netlify te dará una URL después del primer deploy (será algo como `lavadero-xxxxx.netlify.app`). Actualiza esta variable con la URL exacta.

### Variable 4: NODE_ENV
```
production
```

---

## 📝 Paso 6: Crear netlify.toml

Crea el archivo `netlify.toml` en la raíz del proyecto:

```toml
[build]
  command = "prisma generate && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

**Nota**: Con Next.js 14+ y App Router, Netlify usa funciones serverless automáticamente.

---

## 🚢 Paso 7: Primer Despliegue

1. Después de configurar todo, haz clic en **"Deploy site"**
2. Netlify iniciará automáticamente el build y deploy
3. Ve a la pestaña **"Deploys"** para ver el progreso
4. El primer deploy puede tardar 5-10 minutos

---

## 🌐 Paso 8: Configurar Dominio

1. Después del deploy exitoso, Netlify te dará una URL automática
2. La URL será algo como: `lavadero-xxxxx.netlify.app`
3. Ve a **"Site settings"** → **"Environment variables"**
4. Actualiza la variable `NEXTAUTH_URL` con la URL exacta:
   ```
   https://tu-url.netlify.app
   ```
5. Haz clic en **"Save"**
6. Ve a **"Deploys"** → Haz clic en los 3 puntos del último deploy → **"Trigger deploy"** → **"Deploy site"**

---

## 🔄 Paso 9: Despliegue Automático

Netlify por defecto despliega automáticamente:
- ✅ Cada push a `main` → nuevo deployment
- ✅ Funciona automáticamente, no necesitas configurar nada

---

## ⚠️ Limitaciones del Plan Gratuito

1. **Bandwidth**: 100 GB/mes (suficiente para uso personal)
2. **Build time**: 300 minutos/mes
3. **Function invocations**: 125,000/mes
4. **Storage**: 100 GB

**Ventajas:**
- ✅ **NO tiene sleep mode** - Siempre activo
- ✅ Plan gratuito permanente
- ✅ Despliegue automático perfecto

---

## ✅ Verificación

1. Espera a que el deployment termine (estado "Published")
2. Haz clic en la URL que Netlify te proporciona
3. Deberías ver la aplicación funcionando inmediatamente (sin esperar como Render)
4. Intenta hacer login:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔧 Troubleshooting

### Error: "Build Failed"
- Revisa los logs en Netlify → Deploys → [tu deploy] → Build log
- Verifica que todas las variables de entorno estén configuradas
- Verifica que el build command sea correcto
- Asegúrate de que `prisma generate` esté incluido

### Error: "Functions failed"
- Verifica que tengas el plugin `@netlify/plugin-nextjs` configurado
- Verifica el archivo `netlify.toml`
- Next.js necesita funciones serverless en Netlify

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Si usas Neon, verifica que la URL incluya `?sslmode=require`

---

## 📊 Comparación: Netlify vs Render

| Característica | Netlify | Render |
|---------------|---------|--------|
| Plan Gratuito | ✅ Permanente | ✅ Permanente |
| Sleep Mode | ❌ NO (siempre activo) | ⚠️ Sí (15 min) |
| Despliegue Auto | ✅ | ✅ |
| Base de Datos | ❌ (usar Neon) | ✅ PostgreSQL gratis |
| Velocidad | ⚡ Rápido | ⚡ Rápido (después de despertar) |

---

## 💡 Ventajas de Netlify

1. **NO se duerme**: Siempre activo, respuesta inmediata
2. **Gratis permanente**: No es trial
3. **Despliegue automático**: Perfecto con GitHub
4. **Fácil de usar**: Interfaz muy intuitiva
5. **CDN global**: Contenido estático servido rápido

---

## 🔗 URLs Importantes

- **Netlify Dashboard**: https://app.netlify.com
- **Documentación Netlify**: https://docs.netlify.com
- **Plugin Next.js**: https://github.com/netlify/netlify-plugin-nextjs

---

¡Netlify es perfecto si NO quieres sleep mode! 🚀✨


