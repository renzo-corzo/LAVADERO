# 🔍 Instrucciones para Diagnosticar el Problema de Login

## ✅ Lo que hice

Agregué logging temporal al código de autenticación para ver exactamente qué está pasando en producción.

## 📋 Pasos para Ver el Diagnóstico

### 1. Espera el nuevo deployment en Vercel

El código se está desplegando automáticamente. Espera 1-2 minutos.

### 2. Abre Runtime Logs en Vercel

1. Ve a Vercel → Tu proyecto → **Deployments**
2. Click en el deployment más reciente (el que acaba de crear)
3. Click en **"Runtime Logs"** (NO Build Logs)
4. Mantén esta ventana abierta

### 3. Intenta hacer Login

1. Ve a: `https://lavadero-rosy.vercel.app`
2. Intenta iniciar sesión con:
   - Usuario: `admin`
   - Contraseña: `admin123`

### 4. Revisa los Logs

En los Runtime Logs verás mensajes como:

```
🔐 [AUTH] Intento de login para usuario: admin
🔐 [AUTH] DATABASE_URL configurada: true/false
🔐 [AUTH] NEXTAUTH_SECRET configurado: true/false
🔐 [AUTH] NEXTAUTH_URL: https://lavadero-rosy.vercel.app
👤 [AUTH] Usuario encontrado: Sí/No
🔑 [AUTH] Contraseña válida: true/false
```

**Busca:**
- Si `DATABASE_URL configurada: false` → Las variables no están configuradas
- Si `Usuario encontrado: No` → Problema de conexión a BD
- Si `Contraseña válida: false` → Problema con hash de contraseñas
- Cualquier error rojo

### 5. Comparte los Logs

Copia los mensajes que aparecen en los Runtime Logs cuando intentas hacer login y compártelos.

---

## 🔧 Posibles Soluciones Según el Error

### Si ves: `DATABASE_URL configurada: false`
→ Ve a Vercel → Settings → Environment Variables y verifica que `DATABASE_URL` esté configurada para Production

### Si ves: `Usuario encontrado: No` pero funciona localmente
→ Problema de conexión a Neon. Verifica que la `DATABASE_URL` en Vercel sea exactamente la misma que usas localmente.

### Si ves: `Contraseña válida: false`
→ Problema con el hash. Ejecuta `npm run db:seed` nuevamente localmente para actualizar las contraseñas.

### Si ves errores de conexión
→ Verifica que Neon esté activo y que la connection string sea correcta.

---

## 📞 Después del Diagnóstico

Una vez que veas los logs, sabremos exactamente dónde está el problema y podremos solucionarlo.

**IMPORTANTE:** Después de solucionarlo, removeremos el logging para producción.




