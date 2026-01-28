# Solución: Vercel No Hace Deployment Automático

Si Vercel no está haciendo deployment automático después de hacer push a GitHub, sigue estos pasos:

## 🔍 Paso 1: Verificar Conexión GitHub-Vercel

1. Ve a: https://vercel.com
2. Selecciona tu proyecto: **lavadero**
3. Ve a: **Settings** → **Git**
4. Verifica que:
   - **Connected Git Repository** muestre: `renzo-corzo/LAVADERO`
   - Si no está conectado, haz clic en **"Connect Git Repository"**

## 🔄 Paso 2: Forzar Redeploy Manual

1. Ve a: **Deployments**
2. Busca el deployment más reciente (A9E9JtXrg)
3. Haz clic en los **3 puntos (⋯)** a la derecha
4. Selecciona **"Redeploy"**
5. En el modal:
   - **Create Deployment** aparece un campo "Commit or Branch Reference"
   - Deja el campo en blanco o escribe: `main`
   - Haz clic en **"Redeploy"**

Esto forzará a Vercel a tomar el último commit de la rama `main`.

## 🔧 Paso 3: Verificar Webhooks en GitHub

1. Ve a: https://github.com/renzo-corzo/LAVADERO
2. Ve a: **Settings** → **Webhooks**
3. Busca un webhook de Vercel
4. Si no existe, Vercel no está conectado correctamente
5. Si existe, haz clic y verifica:
   - **Active**: debe estar marcado ✅
   - **Events**: debe incluir "Pushes"

## ⚙️ Paso 4: Reconectar GitHub (si es necesario)

Si los pasos anteriores no funcionan:

1. En Vercel → **Settings** → **Git**
2. Haz clic en **"Disconnect"** junto al repositorio
3. Espera unos segundos
4. Haz clic en **"Connect Git Repository"**
5. Selecciona: `renzo-corzo/LAVADERO`
6. Confirma la conexión
7. Esto debería activar el deployment automático

## 🚀 Paso 5: Crear Deployment Manual desde Commit

Si nada funciona:

1. Ve a: **Deployments**
2. Haz clic en **"Create Deployment"** (botón azul arriba)
3. En el modal:
   - **Branch**: Selecciona `main`
   - **Commit**: Debería mostrar automáticamente el último commit
   - Haz clic en **"Create Deployment"**

## ✅ Verificación

Después de cualquiera de estos pasos:

1. Ve a **Deployments**
2. Deberías ver un nuevo deployment iniciándose
3. El commit debería ser: `123b7a8` o más reciente
4. Cuando termine (verde "Ready"), prueba la aplicación

## 🔍 Diagnóstico

Si aún no funciona, verifica:

1. **¿Estás haciendo push a la rama correcta?**
   ```bash
   git branch  # Debe mostrar * main
   git push origin main
   ```

2. **¿El repositorio está privado?**
   - Vercel necesita permisos para acceder a repositorios privados
   - Ve a GitHub → Settings → Applications → Vercel → Permisos

3. **¿Hay errores en los logs?**
   - Ve a Vercel → Deployments → [último deployment] → Logs
   - Revisa si hay errores de build


