image.png# 🔗 Cómo Conectar Vercel con GitHub

## Problema: Vercel no encuentra el repositorio

Si Vercel no encuentra tu repositorio, sigue estos pasos:

---

## 📋 Paso 1: Verificar que el Repositorio Existe en GitHub

1. Ve a: https://github.com/renzo-corzo/LAVADERO
2. Verifica que el repositorio existe y es accesible
3. Si es privado, asegúrate de tener permisos para conectarlo

---

## 📋 Paso 2: Conectar Vercel con GitHub

### Opción A: Desde Vercel (Recomendado)

1. Ve a https://vercel.com
2. Si no tienes cuenta, crea una con GitHub (click en "Sign Up with GitHub")
3. Si ya tienes cuenta:
   - Click en tu perfil (arriba derecha)
   - Ve a "Settings" → "Git Connections"
   - Click en "Connect GitHub" o "Configure GitHub App"
4. Autoriza a Vercel para acceder a tus repositorios
5. Puedes autorizar todos los repositorios o solo `renzo-corzo/LAVADERO`

### Opción B: Desde GitHub (Instalar Vercel App)

Si no encuentras "Integrations" → "Vercel" en GitHub, instala la GitHub App de Vercel:

1. Ve a: https://github.com/apps/vercel
2. Click en "Install" o "Configure"
3. Selecciona la cuenta u organización: `renzo-corzo`
4. Elige si quieres instalar en todos los repositorios o solo en `LAVADERO`
5. Click en "Install" o "Save"
6. Esto autorizará a Vercel para acceder a tu repositorio

**Nota:** Esta opción es opcional. Lo más común es conectarlo desde Vercel (Opción A).

---

## 📋 Paso 3: Importar el Proyecto en Vercel

1. En Vercel, click en "Add New" → "Project"
2. Si ya conectaste GitHub, deberías ver tus repositorios
3. Busca `renzo-corzo/LAVADERO` en la lista
4. Si no aparece:
   - Verifica que autorizaste el acceso al repositorio
   - Verifica que el repositorio existe en GitHub
   - Intenta desconectar y reconectar GitHub en Vercel
5. Click en "Import" junto al repositorio

---

## ⚠️ Soluciones Comunes

### El repositorio no aparece en la lista

**Solución 1:** Re-autorizar GitHub
1. Ve a Vercel → Settings → Git Connections
2. Click en "Disconnect" en GitHub
3. Vuelve a conectar y autoriza todos los repositorios

**Solución 2:** Verificar permisos
1. Ve a GitHub → Settings → Applications → Authorized OAuth Apps
2. Busca "Vercel"
3. Click en "Revoke access" y luego vuelve a autorizar desde Vercel

**Solución 3:** Usar el nombre completo
1. En Vercel, en el buscador de repositorios, escribe:
   ```
   renzo-corzo/LAVADERO
   ```
2. O busca solo "LAVADERO"

### Error: "Repository not found"

- Verifica que el repositorio existe: https://github.com/renzo-corzo/LAVADERO
- Verifica que tienes acceso al repositorio (si es privado)
- Verifica que el nombre es exacto: `renzo-corzo/LAVADERO`

### Error: "Permission denied"

- Vercel no tiene permisos para acceder al repositorio
- Ve a GitHub → Settings → Applications → Authorized OAuth Apps
- Busca Vercel y verifica los permisos
- O desconecta y vuelve a conectar desde Vercel

---

## ✅ Verificación

Una vez conectado correctamente:

1. El repositorio `renzo-corzo/LAVADERO` debería aparecer en la lista de Vercel
2. Al importarlo, Vercel debería detectar automáticamente:
   - Framework: Next.js
   - Build Command: automático
   - Output Directory: `.next`
3. Podrás agregar las variables de entorno y hacer deploy

---

## 🆘 Si Nada Funciona

**Opción alternativa:** Subir manualmente
1. En Vercel, click en "Add New" → "Project"
2. Click en "Deploy a project manually" (abajo)
3. Sube un ZIP del proyecto (sin `node_modules` ni `.next`)
4. Configura manualmente las variables de entorno

Pero es mejor usar Git para actualizaciones automáticas.

---

## 📞 URL del Repositorio

```
https://github.com/renzo-corzo/LAVADERO
```

Asegúrate de que Vercel tenga acceso a este repositorio.

