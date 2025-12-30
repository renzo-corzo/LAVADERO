# Sistema Lavadero de Autos - MVP

Sistema web + PWA para gestión operativa y control de caja de un lavadero de autos.

## 📋 Documentación

La especificación funcional completa está disponible en los siguientes documentos:

- [01-ESPECIFICACION-FUNCIONAL.md](./01-ESPECIFICACION-FUNCIONAL.md) - Especificación funcional completa
- [02-BACKLOG-HISTORIAS-USUARIO.md](./02-BACKLOG-HISTORIAS-USUARIO.md) - Backlog de historias de usuario
- [03-REGLAS-DE-NEGOCIO.md](./03-REGLAS-DE-NEGOCIO.md) - Reglas de negocio detalladas
- [04-NAVEGACION-Y-PERMISOS.md](./04-NAVEGACION-Y-PERMISOS.md) - Estructura de navegación y permisos
- [05-CRITERIOS-ACEPTACION.md](./05-CRITERIOS-ACEPTACION.md) - Criterios de aceptación

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm o yarn
- Base de datos (PostgreSQL recomendado, SQLite para desarrollo)

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env y configurar DATABASE_URL
# Ver env.example como referencia

# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build para Producción

```bash
npm run build
npm start
```

## 🏗️ Estructura del Proyecto

```
lavadero/
├── docs/                    # Documentación
├── public/                  # Archivos estáticos
│   ├── icons/              # Iconos PWA
│   └── manifest.json       # Manifest PWA
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # Rutas de autenticación
│   │   ├── (dashboard)/   # Rutas principales (requieren auth)
│   │   └── api/           # API Routes
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes UI reutilizables
│   │   ├── layout/        # Componentes de layout
│   │   └── features/      # Componentes por feature
│   ├── lib/               # Utilidades y configuraciones
│   │   ├── db/            # Configuración de BD
│   │   ├── auth/          # Autenticación
│   │   └── utils/         # Utilidades generales
│   ├── types/             # TypeScript types
│   └── hooks/             # Custom React hooks
├── prisma/                 # Schema y migraciones (si usa Prisma)
└── tests/                  # Tests
```

## 🔑 Roles y Permisos

- **DUEÑO**: Acceso total
- **ENCARGADO**: Gestión operativa y caja
- **LAVADOR**: Solo ver y cambiar estado de OTs asignadas

## 📱 PWA

La aplicación es instalable como Progressive Web App. Ver configuración en `public/manifest.json` y service worker.

## 🛠️ Tecnologías

- Next.js 14+ (App Router)
- TypeScript
- React
- Base de datos (PostgreSQL/SQLite)
- PWA (Service Worker, Manifest)

## 📝 Scripts Disponibles

### Desarrollo
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm run lint` - Ejecutar linter
- `npm run type-check` - Verificar tipos TypeScript

### Base de Datos (Prisma)
- `npm run db:generate` - Generar cliente de Prisma
- `npm run db:push` - Sincronizar schema sin migraciones (desarrollo)
- `npm run db:migrate` - Crear y aplicar migración
- `npm run db:migrate:deploy` - Aplicar migraciones pendientes (producción)
- `npm run db:studio` - Abrir Prisma Studio
- `npm run db:seed` - Ejecutar seed (datos iniciales)

## 📄 Licencia

Privado - Uso interno

