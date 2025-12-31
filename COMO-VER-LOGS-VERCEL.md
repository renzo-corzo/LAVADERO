# 📋 Cómo Ver los Build Logs en Vercel

## Pasos para ver el error exacto

1. En la página de **Deployment Details** (donde está el error)
2. Desplázate hacia abajo
3. Busca la sección **"> Build Logs"** (con una flecha `>`)
4. Haz click en esa sección para expandirla
5. Verás el log completo del build con el error específico

---

## ¿Qué buscar en los logs?

Busca líneas que contengan:
- ❌ **Error:**
- ❌ **Failed:**
- ⚠️ **Warning:**
- 🔴 Líneas en rojo

El error normalmente aparece al final del log.

---

## Ejemplos de errores comunes:

### Error de Prisma:
```
Error: Can't reach database server
```
**Solución:** `DATABASE_URL` no está configurada o es incorrecta

### Error de TypeScript:
```
Error: Type 'X' is not assignable to type 'Y'
```
**Solución:** Hay un error de tipos que necesita corregirse

### Error de módulo:
```
Error: Cannot find module 'X'
```
**Solución:** Falta una dependencia en `package.json`

### Error de Next.js:
```
Error: Module not found: Can't resolve 'X'
```
**Solución:** Hay un import incorrecto en el código

---

## 📸 Ayuda

Si puedes, haz una captura de pantalla de los Build Logs completos o copia el error exacto que aparece al final del log.

