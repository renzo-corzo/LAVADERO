# Solución: Error de Build en Render - Module not found

## Error:
```
Module not found: Can't resolve '@/components/ui/Button'
```

## ✅ Solución: Actualizar Build Command en Render

El build command en Render debe ser exactamente:

```
npm install && npm run build
```

**NO uses** `npm install; npm run build` (con punto y coma)

### Pasos en Render:

1. Ve a Render Dashboard → Tu servicio `lavadero`
2. Ve a **"Settings"** (configuración del servicio)
3. Busca la sección **"Build & Deploy"**
4. En **"Build Command"**, verifica que sea exactamente:
   ```
   npm install && npm run build
   ```
5. Si tiene punto y coma (`;`), cámbialo a `&&`
6. Haz clic en **"Save Changes"**
7. Ve a **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🔍 Verificación

El comando `npm run build` en `package.json` ya incluye:
```
"build": "prisma generate && next build"
```

Y también hay un `postinstall`:
```
"postinstall": "prisma generate"
```

Entonces `npm install` ya ejecuta `prisma generate` automáticamente.

---

## 📝 Build Command Correcto:

```
npm install && npm run build
```

Este comando:
1. Instala dependencias
2. Ejecuta `postinstall` → `prisma generate`
3. Ejecuta `build` → `prisma generate && next build`

---

## ⚠️ Si Aún Falla

Si después de actualizar el build command sigue fallando:

1. Verifica que todos los archivos estén en Git:
   ```bash
   git ls-files src/components/ui/
   ```

2. Verifica que no estén en `.gitignore`

3. Asegúrate de que el commit más reciente incluya todos los componentes

