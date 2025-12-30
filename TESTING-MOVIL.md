# Guía de Testing en Dispositivos Móviles

## Requisitos Previos

1. **Misma Red WiFi**: Tu computadora y celular deben estar conectados a la misma red WiFi
2. **Firewall**: Permite conexiones entrantes en el puerto 3000 (Windows te pedirá permiso la primera vez)

## Pasos para Probar en el Celular

### Paso 1: Detener el servidor actual
Si tienes el servidor corriendo, deténlo con `Ctrl+C` en la terminal.

### Paso 2: Iniciar el servidor en modo red local

```bash
npm run dev:network
```

O si prefieres hacerlo manualmente:
```bash
npm run dev -- -H 0.0.0.0
```

Esto hará que el servidor esté accesible desde cualquier dispositivo en tu red local.

### Paso 3: Obtener tu IP local

Tu IP local actual es: **192.168.0.82**

Si necesitas verificar tu IP nuevamente:
- Windows: `ipconfig` (busca "IPv4")
- Linux/Mac: `ifconfig` o `ip addr`

### Paso 4: Acceder desde el celular

1. Abre el navegador en tu celular (Chrome, Safari, etc.)
2. Ve a: `http://192.168.0.82:3000`
3. Deberías ver la página de login

### Paso 5: Instalar como PWA (Progressive Web App)

La aplicación está configurada como PWA, por lo que puedes instalarla en tu celular:

**En Android (Chrome):**
1. Abre el menú (⋮)
2. Selecciona "Agregar a la pantalla de inicio" o "Instalar app"
3. La app aparecerá como una aplicación nativa

**En iPhone (Safari):**
1. Toca el botón de compartir (□↑)
2. Selecciona "Agregar a pantalla de inicio"
3. La app aparecerá en tu pantalla de inicio

## Ventajas de la PWA

- ✅ Funciona sin conexión (después de cargar la primera vez)
- ✅ Se ve como una app nativa
- ✅ Acceso rápido desde la pantalla de inicio
- ✅ Notificaciones push (cuando se implemente)

## Solución de Problemas

### No puedo acceder desde el celular
- Verifica que ambos dispositivos estén en la misma WiFi
- Verifica que el firewall permita conexiones en el puerto 3000
- Asegúrate de usar `http://` (no `https://`)
- Intenta reiniciar el servidor

### La IP cambió
Si tu IP local cambia (al reconectar el WiFi), vuelve a ejecutar `ipconfig` para obtener la nueva IP.

### Error de CORS o conexión
- Verifica que el servidor esté corriendo con `-H 0.0.0.0`
- Revisa que no haya un proxy o VPN interfiriendo

## Notas Importantes

1. **Solo funciona en desarrollo**: Esta configuración es solo para probar. En producción, la app se desplegará en un servidor real.
2. **Seguridad**: En desarrollo, solo accesible en tu red local. No compartas la IP públicamente.
3. **Base de datos**: La base de datos sigue siendo la de tu computadora, así que ambos dispositivos comparten los mismos datos.

