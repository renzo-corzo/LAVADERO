# 🔄 Configurar Despliegue Automático en Vercel

## Problema: "A commit author is required"

Este error ocurre cuando el email del commit no está asociado con tu cuenta de GitHub.

## ✅ Solución Rápida: Despliegue Automático

En lugar de crear deployments manuales, configura el despliegue automático:

### Paso 1: Verificar Conexión GitHub-Vercel

1. Ve a Vercel → **Settings** → **Git Connections**
2. Verifica que `renzo-corzo/LAVADERO` esté conectado
3. Si no está, haz clic en **"Connect GitHub"** y autoriza el acceso

### Paso 2: Configurar el Proyecto para Despliegue Automático

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Git**
3. Verifica que:
   - **Production Branch**: `main` (o la rama que uses)
   - **Auto-deploy**: ✅ **Activado** (debería estar por defecto)

### Paso 3: Verificar Configuración del Proyecto

1. En Vercel, ve a tu proyecto `LAVADERO`
2. Ve a **Settings** → **General**
3. Verifica:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (o `prisma generate && next build`)
   - **Output Directory**: `.next` (dejar vacío para Next.js)
   - **Install Command**: `npm install`

### Paso 4: Activar Despliegue Automático

Si el despliegue automático NO está activado:

1. Ve a **Settings** → **Git**
2. Busca la sección **"Auto-deploy"**
3. Activa el toggle si está desactivado
4. Guarda los cambios

## 🚀 Cómo Funciona el Despliegue Automático

Una vez configurado:

- ✅ **Cada push a `main`** → Vercel despliega automáticamente
- ✅ **Pull Requests** → Vercel crea un preview deployment
- ✅ **No necesitas crear deployments manuales**

## 🔧 Si el Despliegue Automático No Funciona

### Verificar Webhook de GitHub

1. Ve a GitHub → `renzo-corzo/LAVADERO` → **Settings** → **Webhooks**
2. Verifica que hay un webhook de Vercel
3. Si no hay, Vercel lo crea automáticamente cuando conectas el repositorio

### Verificar Variables de Entorno

1. En Vercel → **Settings** → **Environment Variables**
2. Verifica que tengas configuradas:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

## 📝 Nota sobre el Error "Commit Author"

El error "A commit author is required" al crear un deployment manual puede ignorarse si:

- ✅ El despliegue automático está activado
- ✅ Los commits tienen autor válido (verificar en GitHub)

**Solución al error de autor:**

Si quieres corregir el autor de commits futuros:

```bash
# Configurar Git con tu email de GitHub
git config user.email "tu-email-de-github@ejemplo.com"
git config user.name "renzo-corzo"
```

Luego, para corregir el último commit:

```bash
git commit --amend --reset-author --no-edit
git push --force-with-lease origin main
```

⚠️ **Nota:** Solo haz `--force` si no hay otros trabajando en el mismo repositorio.

## ✅ Verificación

Para verificar que el despliegue automático funciona:

1. Haz un pequeño cambio (por ejemplo, actualiza el README)
2. Haz commit y push:
   ```bash
   git add .
   git commit -m "test: Verificar despliegue automático"
   git push origin main
   ```
3. Ve a Vercel → **Deployments**
4. Deberías ver un nuevo deployment creándose automáticamente

## 🎯 Recomendación

**Mejor práctica:** Usa siempre el despliegue automático en lugar de deployments manuales. Es más confiable y no requiere SHA de commits.

---

**URL del Proyecto Vercel:**
- Verifica la URL en: https://vercel.com/dashboard


