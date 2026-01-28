# 📱 Cómo Instalar la PWA en Móvil

## ✅ Configuración Completada

Los cambios de PWA han sido aplicados. Ahora solo necesitas generar los iconos reales (ver `generar-iconos-pwa.md`).

---

## 📲 Instalación en Android (Chrome)

1. Abre Chrome en tu Android
2. Ve a: `https://lavadero-nine.vercel.app/`
3. Espera a que cargue completamente
4. Verás un banner en la parte inferior que dice **"Instalar app"** o **"Agregar a pantalla de inicio"**
5. Toca el banner o ve al menú de Chrome (3 puntos) → **"Instalar app"** o **"Agregar a pantalla de inicio"**
6. Confirma la instalación
7. La app aparecerá en tu pantalla de inicio con el icono 🚗

**Alternativa:**
- Menú Chrome (⋮) → **"Instalar app"**
- O en el banner de instalación automática

---

## 🍎 Instalación en iOS (Safari)

1. Abre Safari en tu iPhone/iPad
2. Ve a: `https://lavadero-nine.vercel.app/`
3. Toca el botón **Compartir** (cuadrado con flecha arriba) en la barra inferior
4. Desplázate hacia abajo y toca **"Agregar a pantalla de inicio"**
5. Edita el nombre si quieres (por defecto será "Lavadero Sistema")
6. Toca **"Agregar"**
7. La app aparecerá en tu pantalla de inicio con el icono

---

## 🔍 Verificar que Funciona

Después de instalar:

### Android:
- La app se abre en modo standalone (sin barra del navegador)
- Aparece como app separada en el menú de apps
- Tiene su propio icono

### iOS:
- La app se abre en modo standalone
- Aparece en la pantalla de inicio
- Se comporta como app nativa

---

## ⚠️ Si No Aparece la Opción de Instalar

1. **Verifica HTTPS:** La PWA debe estar en HTTPS (Vercel ya lo tiene)
2. **Verifica el manifest:** Debe estar en `/manifest.json` y ser accesible
3. **Verifica los iconos:** Deben existir y ser accesibles (`/icon-192.png` y `/icon-512.png`)
4. **Limpia la caché:** Cierra y vuelve a abrir el navegador
5. **Espera unos minutos:** A veces tarda en aparecer el banner de instalación

---

## 🛠️ Troubleshooting

### Android Chrome no muestra "Instalar app":
- Verifica que estés en HTTPS
- Espera a que la página cargue completamente
- Ve a Chrome Settings → Site Settings → Install apps → Permitir
- Limpia caché del sitio

### iOS Safari no muestra "Agregar a pantalla de inicio":
- Verifica que uses Safari (no Chrome ni otros navegadores)
- El botón "Compartir" debe estar visible
- Verifica que el manifest sea accesible
- Intenta cerrar y abrir Safari

---

## ✅ Después de Instalar

La app funcionará como una app nativa:
- Abre en modo standalone (sin barra del navegador)
- Tiene su propio icono en la pantalla de inicio
- Se comporta como app separada del navegador
- Mantiene la sesión activa
- Funciona offline (básico, dependiendo del service worker)

¡Listo para usar! 🚀





