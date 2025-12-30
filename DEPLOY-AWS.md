# 🚀 Guía de Deployment - Opciones Gratuitas

## 🎯 Opción RECOMENDADA: Vercel + Neon PostgreSQL (Más Fácil)

**100% Gratis** - Optimizado para Next.js - Setup en 10 minutos

### Ventajas:
- ✅ Creado por los desarrolladores de Next.js
- ✅ Deploy automático desde GitHub
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Tier gratuito muy generoso (100GB/mes)
- ✅ Base de datos PostgreSQL gratis con Neon

### Pasos:

#### 1. Base de Datos PostgreSQL (Neon - Gratis)
1. Ve a https://neon.tech
2. Crea cuenta gratuita
3. Crea proyecto → Database
4. Copia la **connection string** (DATABASE_URL)

#### 2. Deploy en Vercel
1. Ve a https://vercel.com
2. "Add New" → "Project"
3. Importa desde GitHub: `renzo-corzo/LAVADERO`
4. Framework Preset: **Next.js** (auto-detectado)
5. En "Environment Variables", agrega:
   ```
   DATABASE_URL=tu-connection-string-de-neon
   NEXTAUTH_SECRET=genera-uno-con: openssl rand -base64 32
   NEXTAUTH_URL=https://tu-proyecto.vercel.app (lo verás después)
   ```
6. Click "Deploy"

**¡Listo!** Tu app estará en producción en 2-3 minutos.

---

## ☁️ Opción AWS: Amplify (Recomendada para AWS)

**Tier Gratuito:** Siempre gratuito para hosting

### Pasos:

#### 1. Preparar Base de Datos
Opciones gratis:
- **Neon.tech**: PostgreSQL serverless gratis
- **Supabase**: PostgreSQL gratis
- **AWS RDS**: Gratis 12 meses (t2.micro, 20GB)

#### 2. Deploy en AWS Amplify
1. Ve a https://console.aws.amazon.com/amplify
2. "Host web app" → "GitHub"
3. Autoriza y selecciona `renzo-corzo/LAVADERO`
4. Branch: `main`
5. Build settings (auto-detecta Next.js):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```
6. Environment variables:
   ```
   DATABASE_URL=tu-connection-string
   NEXTAUTH_SECRET=tu-secret-generado
   NEXTAUTH_URL=https://main.d1234567890.amplifyapp.com
   ```
7. Save and Deploy

---

## 💰 Otras Opciones AWS Gratis

### AWS Lightsail (3 meses gratis)
- Servidor completo + PostgreSQL
- 512 MB RAM, 1 vCPU
- Después: ~$5/mes

### AWS Elastic Beanstalk (12 meses gratis)
- Auto-scaling
- Integración con RDS PostgreSQL
- Tier gratuito por 12 meses

---

## 🔐 Variables de Entorno Necesarias

En cualquier plataforma, configura:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
O usa: https://generate-secret.vercel.app/32

---

## 📋 Checklist Pre-Deploy

- [x] Repositorio en GitHub ✅
- [ ] Base de datos PostgreSQL configurada
- [ ] Variables de entorno listas
- [ ] Prisma generate funcionando
- [ ] Build local funciona (`npm run build`)

---

## 🔧 Configuración Necesaria

### Variables de Entorno Requeridas:
```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database?sslmode=require
NEXTAUTH_SECRET=tu-secret-generado-aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

### Generar NEXTAUTH_SECRET:
```bash
# Windows PowerShell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})))

# O usa este generador online:
# https://generate-secret.vercel.app/32
```

### Build Command para Vercel/Amplify:
```bash
npm install && npx prisma generate && npm run build
```

---

## 🎯 Recomendación Final

**Para presentar al cliente RÁPIDO (RECOMENDADO):**
👉 **Vercel + Neon PostgreSQL**
- ✅ 100% gratis para siempre
- ✅ Setup en 10 minutos
- ✅ Optimizado para Next.js
- ✅ Deploy automático desde GitHub

**Si necesita estar específicamente en AWS:**
👉 **AWS Amplify + Neon/RDS PostgreSQL**
- ✅ Amplify gratis siempre (1000 horas/mes)
- ✅ RDS PostgreSQL gratis 12 meses (20GB)
- ✅ Configuración un poco más compleja

---

## 💡 ¿Necesitas ayuda?

Puedo guiarte paso a paso con cualquiera de estas opciones. Solo dime cuál prefieres y te ayudo con el setup completo.
