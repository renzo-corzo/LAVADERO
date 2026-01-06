# 🎨 Generar Iconos PWA

Los archivos `icon-192.png` y `icon-512.png` son placeholders. Necesitas generar los iconos reales.

## Opción 1: Generar desde el SVG (Recomendado)

### Usando herramientas online:
1. Ve a: https://www.pwabuilder.com/imageGenerator
2. Sube el archivo `public/favicon.svg`
3. Genera los iconos en tamaños 192x192 y 512x512
4. Descarga y reemplaza los archivos en `public/`:
   - `icon-192.png`
   - `icon-512.png`

### Usando ImageMagick (si lo tienes instalado):
```bash
# Convertir SVG a PNG 192x192
magick convert -background "#0070f3" -resize 192x192 public/favicon.svg public/icon-192.png

# Convertir SVG a PNG 512x512
magick convert -background "#0070f3" -resize 512x512 public/favicon.svg public/icon-512.png
```

## Opción 2: Crear manualmente

1. Crea una imagen cuadrada de 512x512 px con fondo azul (#0070f3)
2. Agrega el emoji 🚗 o el logo que quieras
3. Exporta como PNG
4. Redimensiona a 192x192 para el icono pequeño
5. Guarda ambos en `public/`:
   - `icon-192.png`
   - `icon-512.png`

## Opción 3: Usar favicon.io

1. Ve a: https://favicon.io/
2. Crea un favicon con:
   - Text: 🚗
   - Background: #0070f3
   - Font Size: 70
3. Descarga el paquete
4. Usa los archivos `android-chrome-192x192.png` y `android-chrome-512x512.png`
5. Renómbralos a `icon-192.png` e `icon-512.png`
6. Colócalos en `public/`

## Verificar

Después de generar los iconos:
1. Verifica que los archivos existan en `public/`
2. Reinicia el servidor: `npm run dev`
3. Abre en el navegador móvil y verifica que aparezca la opción de instalar




