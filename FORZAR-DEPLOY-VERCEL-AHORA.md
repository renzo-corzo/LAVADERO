# Forzar Deployment en Vercel

El deployment actual está usando un commit antiguo. Para forzar un nuevo deployment con el último commit:

## Opción 1: Desde Vercel Dashboard (Recomendado)

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **lavadero**
3. Ve a la pestaña **"Deployments"**
4. Encuentra el deployment más reciente (A9E9JtXrg)
5. Haz clic en los **3 puntos (⋯)** a la derecha
6. Selecciona **"Redeploy"**
7. Confirma el redeploy

Esto creará un nuevo deployment con el último commit.

## Opción 2: Crear un commit vacío para forzar deploy

Si el redeploy no funciona, puedes crear un commit vacío:

```bash
git commit --allow-empty -m "chore: Forzar redeploy en Vercel"
git push origin main
```

Esto forzará a Vercel a crear un nuevo deployment.

## Opción 3: Desde Vercel CLI

Si tienes Vercel CLI instalado:

```bash
vercel --prod
```

## Verificar que funcionó

1. Ve a Deployments en Vercel
2. Verifica que el nuevo deployment tenga el commit más reciente:
   - Debe mostrar: `693d619` o `1950d91`
   - NO debe mostrar: `ddb25ac`


