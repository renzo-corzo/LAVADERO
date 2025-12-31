# 🔍 Diagnóstico Completo - Login No Funciona en Vercel

## Checklist de Verificación

### ✅ Lo que ya sabemos que funciona:
- ✅ Usuarios están en la base de datos de Neon
- ✅ Login funciona localmente con la misma BD
- ✅ Las contraseñas están correctamente hasheadas

### ❌ Posibles causas del problema:

1. **Variables de entorno no aplicadas correctamente**
2. **NEXTAUTH_URL incorrecta** (muy común - causa problemas con cookies)
3. **Necesita redeploy después de cambiar variables**
4. **Problema con cookies/dominio en Vercel**

---

## 📋 Pasos de Diagnóstico

### 1. Verificar Runtime Logs en Vercel

1. Ve a Vercel → Tu proyecto → **Deployments**
2. Click en el deployment más reciente
3. Click en **"Runtime Logs"** (no Build Logs)
4. Intenta hacer login en la aplicación
5. Revisa los logs para ver errores

**Busca errores como:**
- "Can't reach database server"
- "Authentication failed"
- "Invalid credentials"
- "Environment variable not found"

### 2. Verificar Variables de Entorno (IMPORTANTE)

En Vercel → Settings → Environment Variables, verifica:

#### DATABASE_URL
```
postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
- ✅ Debe estar en **Production**
- ✅ Debe estar en **Preview**
- ✅ Debe estar en **Development**

#### NEXTAUTH_SECRET
```
DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj
```
- ✅ Debe estar en **Production**
- ✅ Debe estar en **Preview**
- ✅ Debe estar en **Development**

#### NEXTAUTH_URL (⚠️ MUY IMPORTANTE)
```
https://lavadero-rosy.vercel.app
```
- ✅ Debe estar en **Production**
- ✅ Debe estar en **Preview**
- ❌ NO debe tener barra final `/` al final

### 3. Forzar Redeploy Completo

1. Ve a **Deployments**
2. Click en los **3 puntos (...)** del último deployment
3. Selecciona **"Redeploy"**
4. Espera que termine completamente
5. Prueba el login nuevamente

### 4. Verificar que la URL sea Correcta

La URL de producción debe ser exactamente:
```
https://lavadero-rosy.vercel.app
```

**NO:**
- ❌ `https://lavadero-rosy.vercel.app/`
- ❌ `http://lavadero-rosy.vercel.app`
- ❌ Cualquier otra variación

---

## 🆘 Solución Alternativa: Verificar en Código

Si nada funciona, podemos agregar logging temporal para ver qué está pasando.

### Agregar Logging en auth/config.ts

Modifica temporalmente `src/lib/auth/config.ts` para ver qué está pasando:

```typescript
async authorize(credentials) {
  console.log('🔐 Intento de login:', credentials?.usuario)
  
  if (!credentials?.usuario || !credentials?.password) {
    console.log('❌ Credenciales faltantes')
    return null
  }

  const user = await prisma.usuario.findUnique({
    where: { usuario: credentials.usuario },
  })

  console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No')
  
  if (!user || !user.activo) {
    console.log('❌ Usuario no encontrado o inactivo')
    return null
  }

  const isValidPassword = await compare(credentials.password, user.password)
  console.log('🔑 Contraseña válida:', isValidPassword)

  if (!isValidPassword) {
    console.log('❌ Contraseña incorrecta')
    return null
  }

  console.log('✅ Login exitoso para:', user.usuario)
  return {
    id: user.id,
    name: user.nombre,
    email: null,
    role: user.rol,
  }
},
```

Luego:
1. Haz commit y push
2. Espera el deploy en Vercel
3. Intenta hacer login
4. Revisa los Runtime Logs en Vercel
5. Verás exactamente dónde falla

---

## 🔧 Solución Rápida: Verificar en Browser

Abre la consola del navegador (F12) cuando intentas hacer login y busca:
- Errores de red
- Errores de autenticación
- Errores de CORS
- Errores de cookies

---

## 📞 Próximos Pasos

1. **Verifica Runtime Logs** - ¿Qué error aparece cuando intentas login?
2. **Verifica NEXTAUTH_URL** - ¿Está exactamente como arriba, sin barra final?
3. **Haz Redeploy** - Después de verificar variables
4. **Comparte el error** - Si aparece algo en los logs o consola del navegador

