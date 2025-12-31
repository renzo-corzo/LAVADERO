# 🔄 Reconfigurar Proyecto en Vercel (Después de Eliminarlo)

## Problema: No puedes iniciar sesión después de recrear el proyecto

Cuando eliminas y recreas un proyecto en Vercel, **se pierden todas las variables de entorno**. Necesitas configurarlas nuevamente.

---

## 📋 Pasos para Reconfigurar

### 1. Configurar Variables de Entorno

1. Ve a tu proyecto en Vercel: `lavadero`
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas 3 variables:

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** 
  ```
  postgresql://neondb_owner:npg_sl9Ojm1GPdWy@ep-nameless-frost-ad20aun9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** 
  ```
  DHGKPNctpon0xWuwLEl3ivrCJgYU9TRj
  ```
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** 
  ```
  https://lavadero-rosy.vercel.app
  ```
  (O la nueva URL que te dio Vercel si cambió)
- **Environment:** ✅ Production, ✅ Preview

### 2. Verificar que la Base de Datos Tiene las Tablas

Las tablas ya están creadas en Neon (las creamos antes), pero verifica:

1. Ejecuta localmente (con DATABASE_URL de Neon en tu .env):
   ```bash
   node verificar-bd.js
   ```

2. Deberías ver que hay usuarios en la base de datos.

### 3. Hacer Deploy

1. Después de agregar las variables de entorno
2. Ve a **Deployments**
3. Haz click en **"Redeploy"** del deployment más reciente
4. O espera a que Vercel detecte automáticamente los cambios

### 4. Probar Login

1. Ve a tu URL de Vercel
2. Usuario: `admin`
3. Contraseña: `admin123`

---

## 🔍 Si Sigue Sin Funcionar

### Verificar Runtime Logs

1. Ve a **Deployments** → Selecciona el deployment más reciente
2. Ve a **"Runtime Logs"**
3. Intenta hacer login
4. Revisa los logs para ver el error específico

### Verificar Base de Datos

Ejecuta localmente:
```bash
node verificar-bd.js
```

Deberías ver que hay usuarios en la BD.

---

## 📋 Checklist

- [ ] Variables de entorno configuradas (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Variables aplicadas a Production, Preview, Development
- [ ] Base de datos tiene tablas (verificar con `node verificar-bd.js`)
- [ ] Base de datos tiene usuarios (verificar con `node verificar-bd.js`)
- [ ] Se hizo Redeploy después de configurar variables
- [ ] Probar login con `admin` / `admin123`

