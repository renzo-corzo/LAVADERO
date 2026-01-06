# Crear Iconos para PWA

Los iconos PWA faltan y causan errores en la consola. Para resolverlo:

## Opción 1: Crear Icono Simple (Rápido)

Puedes crear un icono simple usando herramientas online:
1. Ve a https://favicon.io/favicon-generator/
2. Crea un icono con texto "🚗" o "LAV"
3. Descarga y coloca el archivo `favicon.ico` en `/public/`
4. Descarga el PNG y colócalo como `/public/icon.png` (512x512)

## Opción 2: Usar Herramienta de Diseño

1. Crea un icono de 512x512px con tu herramienta favorita
2. Guarda como `/public/icon.png`
3. Genera favicon.ico desde el PNG (usando https://convertio.co/es/png-ico/ o similar)

## Opción 3: Temporal - Comentar Iconos

Por ahora, puedes comentar los iconos en `manifest.json` para eliminar los errores:

```json
"icons": []
```

Los errores no afectan la funcionalidad, solo son advertencias del navegador.




