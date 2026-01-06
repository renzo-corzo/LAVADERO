# 🚀 Forzar Deploy en Vercel

Si Vercel no detecta automáticamente los cambios de GitHub, sigue estos pasos:

## Opción 1: Crear un Commit Vacío (Recomendado)

Crea un commit vacío para forzar que Vercel detecte el cambio:

```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

## Opción 2: Redeploy Manual desde Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Haz clic en tu proyecto `lavadero-one` (o el nombre que tenga)
3. Ve a la pestaña **"Deployments"**
4. Encuentra el deployment más reciente (aunque sea el anterior)
5. Haz clic en los **tres puntos (⋯)** al lado del deployment
6. Selecciona **"Redeploy"**
7. Confirma el redeploy

## Opción 3: Verificar Integración de GitHub

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Git**
3. Verifica que esté conectado a `renzo-corzo/LAVADERO`
4. Verifica que el branch sea `main`
5. Si está desconectado, reconecta:
   - Haz clic en **"Disconnect"**
   - Luego **"Connect Git Repository"**
   - Selecciona `renzo-corzo/LAVADERO`
   - Configura el branch `main`
   - Haz clic en **"Deploy"**

## Opción 4: Verificar Webhooks de GitHub

1. Ve a tu repositorio en GitHub: https://github.com/renzo-corzo/LAVADERO
2. Ve a **Settings** → **Webhooks**
3. Verifica que haya un webhook de Vercel activo
4. Si no está, Vercel debería crearlo automáticamente al reconectar

## Opción 5: Forzar desde Vercel CLI (Si lo tienes instalado)

```bash
vercel --prod
```

## Verificar que el Deploy Funcionó

1. Ve a la pestaña **Deployments** en Vercel
2. Deberías ver un nuevo deployment con el commit `2787b75`
3. Espera a que termine el build (puede tardar 2-5 minutos)
4. Verifica que el status sea **"Ready"** (verde)
5. Haz clic en el deployment para ver los logs si hay errores

## Troubleshooting

Si el deploy sigue fallando:
- Revisa los logs del build en Vercel
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que `DATABASE_URL` y `NEXTAUTH_SECRET` estén correctos
- Verifica que `NEXTAUTH_URL` apunte a tu dominio de Vercel
