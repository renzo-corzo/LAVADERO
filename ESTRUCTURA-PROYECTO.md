# Estructura del Proyecto - Sistema Lavadero

## 📁 Estructura de Carpetas Completa

```
lavadero/
├── docs/                              # Documentación del proyecto
│   ├── 01-ESPECIFICACION-FUNCIONAL.md
│   ├── 02-BACKLOG-HISTORIAS-USUARIO.md
│   ├── 03-REGLAS-DE-NEGOCIO.md
│   ├── 04-NAVEGACION-Y-PERMISOS.md
│   └── 05-CRITERIOS-ACEPTACION.md
│
├── public/                            # Archivos estáticos
│   ├── icons/                         # Iconos para PWA (generar según tamaños requeridos)
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── manifest.json                  # Manifest PWA
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/               # Grupo de rutas principales (requieren auth)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Dashboard principal
│   │   │   │
│   │   │   ├── tablero/               # Tablero Kanban
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/              # Detalle de OT
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── ots/                   # Gestión de OTs
│   │   │   │   ├── page.tsx           # Lista de OTs
│   │   │   │   ├── nueva/
│   │   │   │   │   └── page.tsx       # Crear OT
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Ver detalle
│   │   │   │       └── editar/
│   │   │   │           └── page.tsx   # Editar OT
│   │   │   │
│   │   │   ├── caja/                  # Caja y cobros
│   │   │   │   ├── page.tsx
│   │   │   │   ├── cobrar/
│   │   │   │   │   └── [otId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── cierres/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── cerrar/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── comisiones/            # Comisiones
│   │   │   │   ├── page.tsx
│   │   │   │   ├── configurar/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pendientes/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── liquidar/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── historico/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── reportes/              # Reportes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ventas/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── comisiones/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── operativas/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── catalogos/             # Catálogos
│   │   │   │   ├── servicios/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── nuevo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── extras/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── nuevo/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── usuarios/              # Usuarios (solo DUEÑO)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nuevo/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── config/                # Configuración
│   │   │   │   ├── page.tsx
│   │   │   │   ├── general/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── auditoria/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx             # Layout del dashboard
│   │   │
│   │   ├── api/                       # API Routes (Next.js API)
│   │   │   ├── auth/
│   │   │   │   └── route.ts
│   │   │   ├── ots/
│   │   │   │   ├── route.ts           # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # GET, PUT, DELETE
│   │   │   ├── servicios/
│   │   │   │   └── route.ts
│   │   │   ├── extras/
│   │   │   │   └── route.ts
│   │   │   ├── pagos/
│   │   │   │   └── route.ts
│   │   │   ├── cierres/
│   │   │   │   └── route.ts
│   │   │   ├── comisiones/
│   │   │   │   └── route.ts
│   │   │   └── usuarios/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                 # Layout raíz
│   │   ├── page.tsx                   # Página principal (redirect a login/dashboard)
│   │   └── globals.css                # Estilos globales
│   │
│   ├── components/                    # Componentes React
│   │   ├── ui/                        # Componentes UI reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                    # Componentes de layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── features/                  # Componentes por feature
│   │       ├── ot/
│   │       │   ├── OTCard.tsx
│   │       │   ├── OTForm.tsx
│   │       │   ├── OTDetail.tsx
│   │       │   └── EstadoBadge.tsx
│   │       ├── tablero/
│   │       │   ├── TableroKanban.tsx
│   │       │   ├── ColumnaKanban.tsx
│   │       │   └── FiltrosTablero.tsx
│   │       ├── caja/
│   │       │   ├── PagoForm.tsx
│   │       │   ├── CierreForm.tsx
│   │       │   └── ResumenCierre.tsx
│   │       ├── comisiones/
│   │       │   ├── ComisionCard.tsx
│   │       │   ├── LiquidacionForm.tsx
│   │       │   └── ConfigComisionForm.tsx
│   │       └── reportes/
│   │           ├── VentasChart.tsx
│   │           ├── ComisionesTable.tsx
│   │           └── MetricasCard.tsx
│   │
│   ├── lib/                           # Utilidades y configuraciones
│   │   ├── db/                        # Configuración de base de datos
│   │   │   ├── client.ts              # Cliente de BD (Prisma, Drizzle, etc.)
│   │   │   └── schema.ts              # Schema de BD (si no usa ORM con schema separado)
│   │   │
│   │   ├── auth/                      # Autenticación
│   │   │   ├── config.ts
│   │   │   └── middleware.ts
│   │   │
│   │   ├── reglas-negocio.ts          # Implementación de reglas de negocio
│   │   ├── auth.ts                    # Utilidades de autenticación
│   │   └── utils.ts                   # Utilidades generales
│   │
│   ├── types/                         # TypeScript types
│   │   ├── index.ts                   # Tipos principales
│   │   └── api.ts                     # Tipos para API
│   │
│   └── hooks/                         # Custom React hooks
│       ├── useOT.ts
│       ├── useAuth.ts
│       ├── useTablero.ts
│       └── useCaja.ts
│
├── prisma/                            # Si usa Prisma ORM
│   ├── schema.prisma
│   └── migrations/
│
├── tests/                             # Tests
│   ├── __mocks__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                       # Ejemplo de variables de entorno
├── .env.local                         # Variables de entorno locales (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── README.md
└── ESTRUCTURA-PROYECTO.md            # Este archivo
```

## 📝 Notas sobre la Estructura

### App Router (Next.js 13+)
- Se usa el nuevo App Router de Next.js
- Rutas definidas por estructura de carpetas en `src/app/`
- Grupos de rutas con `(nombre)` para organización sin afectar URLs

### Componentes
- **ui/**: Componentes básicos reutilizables (botones, inputs, etc.)
- **layout/**: Componentes de estructura (header, sidebar)
- **features/**: Componentes específicos de funcionalidades (organizados por dominio)

### API Routes
- Endpoints REST en `src/app/api/`
- Cada ruta puede manejar múltiples métodos HTTP (GET, POST, PUT, DELETE)

### Tipos TypeScript
- Todos los tipos centralizados en `src/types/`
- Tipos compartidos entre frontend y backend

### Utilidades
- `reglas-negocio.ts`: Implementación de las reglas definidas en documentación
- `auth.ts`: Utilidades de autenticación y permisos
- `utils.ts`: Funciones helper generales

## 🔄 Próximos Pasos

1. **Configurar Base de Datos**
   - Elegir ORM (Prisma recomendado)
   - Crear schema según tipos definidos en `src/types/index.ts`
   - Ejecutar migraciones

2. **Implementar Autenticación**
   - Configurar NextAuth o JWT
   - Implementar middleware de protección de rutas
   - Crear página de login

3. **Desarrollar Componentes UI Base**
   - Completar componentes en `components/ui/`
   - Implementar sistema de diseño (colores, tipografía, espaciado)

4. **Implementar Features Core**
   - Empezar por US-004 (Crear OT)
   - Luego US-005 (Tablero)
   - Continuar según prioridades del backlog

5. **Configurar PWA**
   - Generar iconos en todos los tamaños
   - Configurar service worker
   - Probar instalación en dispositivos





