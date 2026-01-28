# 📱 Probar PWA en Localhost

## ⚠️ Limitaciones de PWA en Localhost

Las PWAs tienen algunas limitaciones cuando se ejecutan en `localhost` o `127.0.0.1`:

1. **Android Chrome:** Funciona bien en localhost
2. **iOS Safari:** Puede tener problemas con localhost
3. **Banner de instalación:** Puede no aparecer inmediatamente

---

## ✅ Pasos para Probar en Localhost

### 1. Reiniciar el Servidor

Asegúrate de que el servidor esté corriendo con los cambios nuevos:

```bash
npm run dev
```

### 2. Acceder desde el Móvil

**Opción A: Misma red WiFi**
1. Encuentra la IP local de tu PC:
   - Windows: `ipconfig` → busca "IPv4 Address"
   - Ejemplo: `192.168.1.100`
2. En tu móvil, abre: `http://192.168.1.100:3000`
3. Asegúrate de que el móvil esté en la misma red WiFi

**Opción B: Usar ngrok o similar**
1. Instala ngrok: https://ngrok.com/
2. Ejecuta: `ngrok http 3000`
3. Usa la URL HTTPS que te da (ej: `https://xxxxx.ngrok.io`)

### 3. Verificar que Funciona

**En Android Chrome:**
1. Abre la URL en Chrome
2. Espera a que cargue completamente
3. Ve al menú (3 puntos) → **"Instalar app"** o **"Agregar a pantalla de inicio"**
4. Si no aparece, espera unos segundos o recarga la página

**En iOS Safari:**
1. Abre la URL en Safari
2. Toca el botón **"Compartir"** (cuadrado con flecha)
3. Desplázate y toca **"Agregar a pantalla de inicio"**

---

## 🔍 Verificar que los Archivos se Cargan

Abre en el navegador (desde tu PC):
- `http://localhost:3000/manifest.json` → Debe mostrar el JSON
- `http://localhost:3000/icon-192.png` → Debe mostrar el icono
- `http://localhost:3000/icon-512.png` → Debe mostrar el icono

Si alguno da 404, hay un problema con los archivos.

---

## 🚨 Si No Funciona en Localhost

### Solución 1: Probar en Producción (Vercel)

La mejor forma de probar una PWA es en producción (HTTPS):

1. Haz commit y push de los cambios
2. Espera a que Vercel despliegue
3. Prueba en: `https://lavadero-nine.vercel.app/`

### Solución 2: Usar ngrok para HTTPS Local

```bash
# Instalar ngrok
# Luego:
ngrok http 3000

# Usa la URL HTTPS que te da
```

---

## ✅ Checklist de Verificación

- [ ] Servidor corriendo en `http://localhost:3000`
- [ ] Puedes acceder a `/manifest.json` desde el navegador
- [ ] Puedes acceder a `/icon-192.png` y `/icon-512.png`
- [ ] Accedes desde el móvil en la misma red WiFi
- [ ] O usas ngrok para HTTPS local
- [ ] O pruebas directamente en producción (Vercel)

---

## 💡 Recomendación

**Para probar PWA correctamente, usa la versión en producción:**
- `https://lavadero-nine.vercel.app/`

Las PWAs funcionan mejor con HTTPS, y Vercel ya lo tiene configurado.

---

## 🔧 Debugging

Si no ves cambios:

1. **Limpia la caché del navegador:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Safari: Settings → Safari → Clear History and Website Data

2. **Verifica en DevTools (PC):**
   - F12 → Application → Manifest
   - Debe mostrar el manifest correctamente
   - Application → Service Workers (si está configurado)

3. **Verifica los archivos:**
   - Asegúrate de que `icon-192.png` y `icon-512.png` existan en `public/`
   - Verifica que `manifest.json` tenga los iconos configurados

---

¡Prueba en producción para mejor experiencia! 🚀





