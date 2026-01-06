# 🔗 Crear Deploy Hook en Vercel

Un Deploy Hook te permite forzar un deployment manualmente mediante una URL única.

## Pasos para crear un Deploy Hook:

1. **En la página que estás viendo (Settings → Git → Deploy Hooks):**
   - **Name:** Ponle un nombre, por ejemplo: `Deploy Manual`
   - **Branch:** Deja `main` (o el branch que uses)
   - Haz clic en **"Create Hook"**

2. **Obtendrás una URL única**, algo como:
   ```
   https://api.vercel.com/v1/integrations/deploy/xxxxx/xxxxx
   ```

3. **Usar el Hook:**
   - Puedes hacer un `GET` o `POST` a esa URL para forzar un deploy
   - Desde el navegador: simplemente abre la URL
   - Desde la terminal: `curl https://api.vercel.com/v1/integrations/deploy/xxxxx/xxxxx`

## Alternativa: Verificar por qué no se actualiza automáticamente

Si el repositorio está conectado pero no se actualiza automáticamente:

1. **Verifica los Webhooks en GitHub:**
   - Ve a: https://github.com/renzo-corzo/LAVADERO/settings/hooks
   - Debería haber un webhook de Vercel
   - Verifica que esté activo y recibiendo eventos

2. **Verifica en Vercel:**
   - Ve a la pestaña **"Deployments"**
   - Busca si hay algún deployment fallido o en progreso
   - Revisa los logs del último deployment

3. **Forzar un nuevo deployment:**
   - En Deployments, busca el deployment más reciente
   - Haz clic en los 3 puntos (⋯) → **"Redeploy"**
   - Esto debería usar el código más reciente de GitHub




