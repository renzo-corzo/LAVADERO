# ESTRUCTURA DE NAVEGACIÓN Y PERMISOS POR ROL
## Sistema Lavadero de Autos - MVP

---

## 1. ESTRUCTURA DE NAVEGACIÓN PRINCIPAL

### 1.1 Menú Principal (Desktop/Tablet)
```
┌─────────────────────────────────────────────────────┐
│  LAVADERO [Logo]              [Usuario] [Cerrar]    │
├─────────────────────────────────────────────────────┤
│  📊 Dashboard  │  📋 Tablero  │  💰 Caja  │  📈 Reportes │ ⚙️ Config │
└─────────────────────────────────────────────────────┘
```

### 1.2 Menú Móvil (PWA)
```
┌─────────────────┐
│  ☰ Menú         │
│                 │
│  📊 Inicio      │
│  📋 Cola Hoy    │
│  ➕ Nueva OT    │
│  💰 Cobros      │
│  📈 Reportes    │
│  ⚙️ Config      │
└─────────────────┘
```

---

## 2. ESTRUCTURA COMPLETA DE NAVEGACIÓN

### 2.1 Dashboard / Inicio
**Ruta:** `/` o `/dashboard`  
**Descripción:** Vista principal al ingresar al sistema  
**Contenido:**
- Resumen de OTs del día por estado (tarjetas)
- Ventas del día (total)
- Comisiones pendientes (si aplica)
- Accesos rápidos: Nueva OT, Tablero, Cierre de Caja

---

### 2.2 Tablero Operativo / Cola
**Ruta:** `/tablero` o `/cola`  
**Descripción:** Vista Kanban con OTs por estado  
**Contenido:**
- Columnas: EN_COLA | EN_PROCESO | LISTO | ENTREGADO
- Filtros: estado, empleado, período (hoy/pendientes/entregados)
- Búsqueda por patente/descripción
- Drag & drop para cambiar estados

**Sub-vista:**
- **Detalle de OT** (Modal o página): `/tablero/ot/:id`

---

### 2.3 Órdenes de Trabajo
**Ruta:** `/ots`  
**Descripción:** Gestión de OTs  
**Sub-rutas:**
- `/ots/nueva` - Crear nueva OT
- `/ots/:id` - Ver detalle de OT
- `/ots/:id/editar` - Editar OT (solo EN_COLA/EN_PROCESO)
- `/ots/:id/cancelar` - Cancelar OT (con motivo)

---

### 2.4 Caja y Cobros
**Ruta:** `/caja`  
**Descripción:** Gestión de cobros y cierre de caja  
**Sub-rutas:**
- `/caja/cobrar/:otId` - Registrar pago de OT específica
- `/caja/cierres` - Listado de cierres de caja
- `/caja/cerrar` - Realizar nuevo cierre de caja
- `/caja/cierre/:id` - Ver detalle de cierre

---

### 2.5 Comisiones
**Ruta:** `/comisiones`  
**Descripción:** Gestión de comisiones  
**Sub-rutas:**
- `/comisiones/configurar` - Configurar comisiones por empleado/servicio
- `/comisiones/pendientes` - Ver comisiones pendientes por empleado
- `/comisiones/liquidar` - Liquidar comisiones (por empleado y período)
- `/comisiones/historico` - Histórico de liquidaciones

---

### 2.6 Reportes
**Ruta:** `/reportes`  
**Descripción:** Reportes y métricas  
**Sub-rutas:**
- `/reportes/ventas` - Reporte de ventas (por período)
- `/reportes/comisiones` - Reporte de comisiones (por empleado/período)
- `/reportes/operativas` - Métricas operativas (tiempos, cantidades)

---

### 2.7 Catálogos
**Ruta:** `/catalogos`  
**Descripción:** Gestión de servicios y extras  
**Sub-rutas:**
- `/catalogos/servicios` - ABM de servicios
- `/catalogos/servicios/nuevo` - Crear servicio
- `/catalogos/servicios/:id` - Ver/editar servicio
- `/catalogos/extras` - ABM de extras
- `/catalogos/extras/nuevo` - Crear extra
- `/catalogos/extras/:id` - Ver/editar extra

---

### 2.8 Usuarios
**Ruta:** `/usuarios`  
**Descripción:** Gestión de usuarios (solo DUEÑO)  
**Sub-rutas:**
- `/usuarios` - Lista de usuarios
- `/usuarios/nuevo` - Crear usuario
- `/usuarios/:id` - Ver/editar usuario

---

### 2.9 Configuración
**Ruta:** `/config`  
**Descripción:** Configuraciones del sistema  
**Sub-rutas:**
- `/config/general` - Configuración general (modelo de comisiones, etc.)
- `/config/auditoria` - Historial de auditoría/logs

---

## 3. PERMISOS POR ROL

### 3.1 ROL: DUEÑO
**Acceso completo a todas las funcionalidades**

| Funcionalidad | Acceso | Acciones Permitidas |
|--------------|--------|---------------------|
| Dashboard | ✅ Total | Ver todo |
| Tablero Operativo | ✅ Total | Ver todas las OTs, cambiar estados, crear, editar, cancelar |
| Crear OT | ✅ Total | Crear, editar cualquier campo |
| Ver/Editar OT | ✅ Total | Ver y editar cualquier OT, incluso en estado LISTO/ENTREGADO (ajuste admin) |
| Cancelar OT | ✅ Total | Cancelar desde cualquier estado |
| Registrar Pago | ✅ Total | Registrar cualquier pago |
| Cierre de Caja | ✅ Total | Realizar cierre, ver historial |
| Configurar Comisiones | ✅ Total | Configurar modelos, porcentajes |
| Liquidar Comisiones | ✅ Total | Liquidar comisiones de cualquier empleado |
| Reportes | ✅ Total | Ver todos los reportes, exportar |
| ABM Servicios/Extras | ✅ Total | Crear, editar, desactivar |
| ABM Usuarios | ✅ Total | Crear, editar, desactivar usuarios |
| Configuración | ✅ Total | Acceso a todas las configuraciones |
| Auditoría/Logs | ✅ Total | Ver historial completo |

---

### 3.2 ROL: ENCARGADO
**Acceso operativo y de caja, sin gestión de usuarios ni configuraciones avanzadas**

| Funcionalidad | Acceso | Acciones Permitidas |
|--------------|--------|---------------------|
| Dashboard | ✅ Total | Ver resumen del día |
| Tablero Operativo | ✅ Total | Ver todas las OTs, cambiar estados, crear, editar, cancelar |
| Crear OT | ✅ Total | Crear nueva OT |
| Ver/Editar OT | ✅ Parcial | Ver cualquier OT, editar solo EN_COLA/EN_PROCESO |
| Cancelar OT | ✅ Parcial | Cancelar EN_COLA/EN_PROCESO/LISTO (con motivo) |
| Registrar Pago | ✅ Total | Registrar cualquier pago |
| Cierre de Caja | ✅ Total | Realizar cierre, ver historial |
| Configurar Comisiones | ❌ Sin acceso | - |
| Liquidar Comisiones | ✅ Total | Liquidar comisiones (puede estar limitado por configuración) |
| Reportes | ✅ Parcial | Ver reportes de ventas, comisiones, operativas (no reportes administrativos avanzados) |
| ABM Servicios/Extras | ✅ Total | Crear, editar, desactivar |
| ABM Usuarios | ❌ Sin acceso | - |
| Configuración | ❌ Sin acceso | - |
| Auditoría/Logs | ✅ Parcial | Ver logs de acciones propias y de lavadores |

---

### 3.3 ROL: LAVADOR
**Acceso limitado: solo ver OTs asignadas y cambiar estados operativos**

| Funcionalidad | Acceso | Acciones Permitidas |
|--------------|--------|---------------------|
| Dashboard | ✅ Limitado | Ver solo resumen de OTs asignadas |
| Tablero Operativo | ✅ Limitado | Ver solo OTs asignadas a él, cambiar estado a EN_PROCESO/LISTO |
| Crear OT | ❌ Sin acceso | - |
| Ver/Editar OT | ✅ Limitado | Ver solo OTs asignadas, NO puede editar |
| Cancelar OT | ❌ Sin acceso | - |
| Registrar Pago | ❌ Sin acceso | - |
| Cierre de Caja | ❌ Sin acceso | - |
| Configurar Comisiones | ❌ Sin acceso | - |
| Liquidar Comisiones | ❌ Sin acceso | - |
| Reportes | ✅ Limitado | Ver solo reporte de sus propias comisiones pendientes |
| ABM Servicios/Extras | ❌ Sin acceso | - |
| ABM Usuarios | ❌ Sin acceso | - |
| Configuración | ❌ Sin acceso | - |
| Auditoría/Logs | ❌ Sin acceso | - |

---

## 4. FLUJOS DE NAVEGACIÓN POR CASO DE USO

### 4.1 Flujo: Crear OT y Seguirla hasta Entregar (ENCARGADO)
```
Dashboard → Tablero → [Botón "Nueva OT"] 
  → Formulario crear OT → [Guardar] 
  → Tablero (OT aparece en EN_COLA) 
  → [Arrastrar a EN_PROCESO] 
  → [Arrastrar a LISTO] 
  → [Arrastrar a ENTREGADO] 
  → Modal "Registrar Pago" → [Confirmar] 
  → Tablero (OT en ENTREGADO, pagada)
```

### 4.2 Flujo: Lavador marca OT como LISTA
```
Tablero (vista de OTs asignadas) 
  → [Click en OT] → Detalle 
  → [Botón "Marcar como LISTO"] 
  → Confirmación → Tablero actualizado
```

### 4.3 Flujo: Cierre de Caja (ENCARGADO/DUEÑO)
```
Caja → Cierres → [Botón "Nuevo Cierre"] 
  → Seleccionar período → [Ver resumen] 
  → [Agregar observaciones] 
  → [Confirmar Cierre] 
  → Vista de cierre confirmado
```

### 4.4 Flujo: Liquidar Comisiones (DUEÑO)
```
Comisiones → Pendientes → [Seleccionar empleado] 
  → [Seleccionar período] 
  → Ver listado de OTs → [Confirmar Liquidación] 
  → Comisiones marcadas como LIQUIDADAS
```

---

## 5. BREADCRUMBS Y NAVEGACIÓN CONTEXTUAL

### 5.1 Breadcrumbs Ejemplo
```
Inicio > Tablero > Detalle OT #123
Inicio > Caja > Cierres > Cierre 2024-01-15
Inicio > Catálogos > Servicios > Editar "Lavado Completo"
```

### 5.2 Acciones Rápidas (Botones flotantes en móvil)
- **FAB (Floating Action Button)** en Tablero: "Nueva OT"
- **FAB** en Dashboard: "Nueva OT"
- Botones rápidos en detalle de OT: "Marcar como LISTO", "Registrar Pago" (según contexto)

---

## 6. MENÚS DESPLEGABLES Y CONTEXTUALES

### 6.1 Menú de Usuario (Header)
- [Avatar/Nombre] → 
  - Ver Perfil (solo información, no editable)
  - Cambiar Contraseña
  - Cerrar Sesión

### 6.2 Menú Contextual en Tablero (por OT)
- Click derecho en tarjeta OT → 
  - Ver Detalle
  - Editar (si aplica)
  - Cancelar (si aplica)
  - Registrar Pago (si aplica)
  - Ver Historial

---

## 7. NAVEGACIÓN RESPONSIVA (Móvil vs Desktop)

### 7.1 Desktop/Tablet
- Menú superior horizontal
- Sidebar opcional para navegación secundaria
- Más espacio para tablero Kanban

### 7.2 Móvil (PWA)
- Menú hamburguesa (☰) para navegación principal
- Bottom navigation bar (opcional) con accesos rápidos:
  - 🏠 Inicio
  - 📋 Cola
  - ➕ Nueva OT
  - 💰 Caja
  - 👤 Perfil
- Tablero con scroll horizontal entre columnas
- Gestos táctiles para acciones rápidas

---

## 8. ESTADOS DE NAVEGACIÓN Y FEEDBACK VISUAL

### 8.1 Indicadores Visuales
- **Badge/Contador** en menú "Tablero": cantidad de OTs EN_COLA
- **Badge** en menú "Comisiones": cantidad de comisiones pendientes
- **Indicador de conexión** (online/offline) en header
- **Notificaciones** (toast/banner) para acciones importantes

### 8.2 Estados de Carga
- Skeleton loaders mientras carga datos
- Spinners en acciones asíncronas
- Mensajes de error claros y accionables

---

**Documento de Navegación y Permisos - Sistema Lavadero de Autos MVP**  
**Versión:** 1.0




