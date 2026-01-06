# Solución: Render No Ve el Repositorio

Si Render no muestra tu repositorio `renzo-corzo/LAVADERO`, sigue estos pasos:

## 🔍 Paso 1: Verificar Conexión GitHub

1. En Render Dashboard, ve a **"Account Settings"** (tu perfil arriba a la derecha)
2. Ve a la pestaña **"Connected Accounts"** o **"Integrations"**
3. Verifica que GitHub esté conectado
4. Si no está conectado:
   - Haz clic en **"Connect GitHub"**
   - Autoriza a Render para acceder a tus repositorios
   - **IMPORTANTE**: Selecciona **"All repositories"** o específicamente `renzo-corzo/LAVADERO`

## 🔄 Paso 2: Reconectar GitHub

1. En Render Dashboard, ve a **"Account Settings"**
2. Ve a **"Connected Accounts"**
3. Si GitHub está conectado:
   - Haz clic en **"Disconnect"** en GitHub
   - Espera unos segundos
   - Haz clic en **"Connect GitHub"** de nuevo
   - **Autoriza TODOS los repositorios** o específicamente `renzo-corzo/LAVADERO`

## 🔐 Paso 3: Verificar Permisos en GitHub

1. Ve a GitHub: https://github.com/settings/connections/applications
2. Busca **"Render"** en la lista
3. Haz clic en **"Configure"** o **"Edit"**
4. Verifica que tenga acceso a:
   - ✅ Repositorios (todos o específicamente `LAVADERO`)
   - ✅ Permisos de lectura de repositorio

## 🔍 Paso 4: Buscar el Repositorio Manualmente

Si después de reconectar aún no aparece:

1. En Render, cuando estás en "New Web Service"
2. En lugar de buscar en la lista, usa el campo de búsqueda
3. Escribe: `renzo-corzo/LAVADERO`
4. O busca solo: `LAVADERO`

## 🔄 Paso 5: Verificar que el Repositorio Existe

1. Ve a GitHub: https://github.com/renzo-corzo/LAVADERO
2. Verifica que el repositorio existe y es accesible
3. Si es privado, asegúrate de que tu cuenta de GitHub tenga acceso

## 🆘 Solución: Instalar GitHub App de Render

**Este es el método más confiable.** Si Render no aparece en "Installed GitHub Apps", instálalo:

1. Ve a: **https://github.com/apps/render**
2. Haz clic en **"Install"**
3. Selecciona la cuenta u organización: **`renzo-corzo`**
4. En **"Repository access"**, elige:
   - ✅ **All repositories** (recomendado, más simple) O
   - ✅ **Only select repositories** → Marca `LAVADERO`
5. Haz clic en **"Install"** o **"Save"**
6. **Verifica** que Render aparezca en Settings → Installed GitHub Apps
7. Vuelve a Render Dashboard
8. Haz clic en **"New +"** → **"Web Service"**
9. Ahora deberías ver el repositorio `renzo-corzo/LAVADERO` disponible

## ✅ Después de Reconectar

1. Ve a Render Dashboard
2. Haz clic en **"New +"** → **"Web Service"**
3. Deberías ver el repositorio `renzo-corzo/LAVADERO` en la lista
4. Si aún no aparece, usa el campo de búsqueda

## 🔍 Verificación Rápida

Verifica estos puntos:
- ✅ ¿Estás logueado en Render con la misma cuenta de GitHub?
- ✅ ¿El repositorio existe en GitHub?
- ✅ ¿Tienes acceso al repositorio en GitHub?
- ✅ ¿Render tiene permisos para acceder al repositorio?

---

**Si después de todos estos pasos aún no funciona**, puedes usar el método alternativo: **"Deploy with Render"** desde GitHub directamente (ver abajo).

## 🎯 Método Alternativo: Desde GitHub

1. Ve a tu repositorio en GitHub: https://github.com/renzo-corzo/LAVADERO
2. Haz clic en **"Settings"** (si tienes permisos)
3. Ve a **"Integrations"** → **"Webhooks"**
4. Busca una opción para conectar con Render
5. O simplemente vuelve a Render y busca el repositorio

