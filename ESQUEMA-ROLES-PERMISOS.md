# ESQUEMA DE ROLES Y PERMISOS DEL SISTEMA

## 📋 ÍNDICE
1. [Roles del Sistema](#roles-del-sistema)
2. [Matriz de Permisos](#matriz-de-permisos)
3. [Permisos Detallados por Funcionalidad](#permisos-detallados-por-funcionalidad)
4. [Transiciones de Estado de OT](#transiciones-de-estado-de-ot)
5. [Diagrama Visual](#diagrama-visual)

---

## 🔑 ROLES DEL SISTEMA

El sistema define **3 roles** de usuario:

| Rol | Descripción | Nivel de Acceso |
|-----|-------------|-----------------|
| **DUEÑO** | Propietario del negocio | 🔓 Acceso total (100%) |
| **ENCARGADO** | Supervisor/Manager | 🔒 Acceso operativo y administrativo limitado |
| **LAVADOR** | Empleado operativo | 🔐 Acceso mínimo operativo |

---

## 📊 MATRIZ DE PERMISOS

### Matriz General

| Funcionalidad | DUEÑO | ENCARGADO | LAVADOR |
|--------------|:-----:|:---------:|:-------:|
| **Dashboard** | ✅ Total | ✅ Total | ⚠️ Limitado |
| **Tablero Operativo** | ✅ Total | ✅ Total | ⚠️ Solo asignadas |
| **Crear OT** | ✅ | ✅ | ❌ |
| **Editar OT** | ✅ Total | ⚠️ Parcial | ❌ |
| **Cancelar OT** | ✅ Total | ⚠️ Parcial | ❌ |
| **Cambiar Estado OT** | ✅ Todos | ✅ Todos | ⚠️ Solo EN_PROCESO/LISTO |
| **Registrar Pago** | ✅ | ✅ | ❌ |
| **Cierre de Caja** | ✅ | ✅ | ❌ |
| **Liquidar Comisiones** | ✅ | ✅ | ❌ |
| **Configurar Comisiones** | ✅ | ❌ | ❌ |
| **Ver Reportes** | ✅ Total | ⚠️ Parcial | ⚠️ Solo propias |
| **ABM Servicios/Extras** | ✅ | ✅ | ❌ |
| **ABM Usuarios** | ✅ | ❌ | ❌ |
| **Configuración Sistema** | ✅ | ❌ | ❌ |
| **Auditoría/Logs** | ✅ Total | ⚠️ Parcial | ❌ |

**Leyenda:**
- ✅ = Acceso completo
- ⚠️ = Acceso limitado/parcial
- ❌ = Sin acceso

---

## 🔍 PERMISOS DETALLADOS POR FUNCIONALIDAD

### 1. DASHBOARD

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | Ver todo: resumen completo, métricas, gráficos, todas las OTs |
| **ENCARGADO** | Ver resumen del día, métricas operativas, todas las OTs |
| **LAVADOR** | Ver solo resumen de OTs asignadas a él |

---

### 2. TABLERO OPERATIVO

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | Ver todas las OTs, cambiar estados, crear, editar, cancelar, asignar empleados |
| **ENCARGADO** | Ver todas las OTs, cambiar estados, crear, editar, cancelar, asignar empleados |
| **LAVADOR** | Ver solo OTs asignadas a él, cambiar estado a EN_PROCESO o LISTO |

---

### 3. CREAR ORDEN DE TRABAJO (OT)

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Crear OT con todos los campos, incluyendo tipo de cliente (FIJO/WALK_IN) |
| **ENCARGADO** | ✅ Crear OT con todos los campos, incluyendo tipo de cliente (FIJO/WALK_IN) |
| **LAVADOR** | ❌ No puede crear OTs |

**Nota:** LAVADOR puede crear OTs según el código (`ot:create`), pero esto puede ser una inconsistencia. Verificar en producción.

---

### 4. EDITAR ORDEN DE TRABAJO

| Rol | Permisos | Estados Editables |
|-----|----------|-------------------|
| **DUEÑO** | ✅ Total | Todos (incluso LISTO/ENTREGADO con ajuste admin) |
| **ENCARGADO** | ⚠️ Parcial | Solo EN_COLA y EN_PROCESO |
| **LAVADOR** | ❌ | Ninguno (solo puede ver) |

**Regla de Negocio:** Solo se pueden editar OTs en estado `EN_COLA` o `EN_PROCESO` (excepto DUEÑO que puede editar cualquier estado).

---

### 5. CANCELAR ORDEN DE TRABAJO

| Rol | Permisos | Estados Cancelables |
|-----|----------|---------------------|
| **DUEÑO** | ✅ Total | Todos excepto ENTREGADO |
| **ENCARGADO** | ⚠️ Parcial | EN_COLA, EN_PROCESO, LISTO (con motivo) |
| **LAVADOR** | ❌ | Ninguno |

**Regla de Negocio:**
- `EN_COLA` → CANCELADO: ENCARGADO, DUEÑO (requiere motivo)
- `EN_PROCESO` → CANCELADO: ENCARGADO, DUEÑO (requiere motivo)
- `LISTO` → CANCELADO: Solo DUEÑO (requiere motivo especial)
- `ENTREGADO`: No se puede cancelar (estado final)

---

### 6. CAMBIAR ESTADO DE OT

#### Transiciones Válidas:

| Estado Actual | Estado Nuevo | DUEÑO | ENCARGADO | LAVADOR |
|--------------|--------------|:-----:|:---------:|:-------:|
| EN_COLA | EN_PROCESO | ✅ | ✅ | ✅ |
| EN_COLA | CANCELADO | ✅ | ✅ | ❌ |
| EN_PROCESO | LISTO | ✅ | ✅ | ✅ |
| EN_PROCESO | CANCELADO | ✅ | ✅ | ❌ |
| LISTO | ENTREGADO | ✅ | ✅ | ✅ |
| LISTO | CANCELADO | ✅ | ❌ | ❌ |
| ENTREGADO | (cualquier) | ❌ | ❌ | ❌ |

**Regla de Negocio:** `ENTREGADO` es un estado final y no puede cambiarse.

---

### 7. REGISTRAR PAGO

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Registrar pago de cualquier OT |
| **ENCARGADO** | ✅ Registrar pago de cualquier OT |
| **LAVADOR** | ❌ No puede registrar pagos |

**Nota:** Según código, LAVADOR tiene permiso `pago:create`, pero esto puede ser inconsistente con la documentación.

---

### 8. CIERRE DE CAJA

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Realizar cierre, ver historial completo |
| **ENCARGADO** | ✅ Realizar cierre, ver historial completo |
| **LAVADOR** | ❌ Sin acceso |

---

### 9. COMISIONES

#### 9.1 Configurar Comisiones

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Configurar modelos de comisión (POR_ITEM, POR_OT), porcentajes por empleado |
| **ENCARGADO** | ❌ Sin acceso |
| **LAVADOR** | ❌ Sin acceso |

#### 9.2 Liquidar Comisiones

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Liquidar comisiones de cualquier empleado |
| **ENCARGADO** | ✅ Liquidar comisiones (puede estar limitado por configuración) |
| **LAVADOR** | ❌ Sin acceso |

#### 9.3 Ver Comisiones

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Ver todas las comisiones |
| **ENCARGADO** | ✅ Ver todas las comisiones |
| **LAVADOR** | ⚠️ Ver solo sus propias comisiones pendientes |

---

### 10. REPORTES

| Rol | Permisos | Tipos de Reportes |
|-----|----------|-------------------|
| **DUEÑO** | ✅ Total | Todos: ventas, comisiones, operativos, administrativos, exportar |
| **ENCARGADO** | ⚠️ Parcial | Ventas, comisiones, operativos (no administrativos avanzados) |
| **LAVADOR** | ⚠️ Limitado | Solo reporte de sus propias comisiones pendientes |

---

### 11. CATÁLOGOS (SERVICIOS Y EXTRAS)

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Crear, editar, desactivar servicios y extras |
| **ENCARGADO** | ✅ Crear, editar, desactivar servicios y extras |
| **LAVADOR** | ❌ Sin acceso |

---

### 12. GESTIÓN DE USUARIOS

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Crear, editar, desactivar usuarios, cambiar roles, cambiar contraseñas |
| **ENCARGADO** | ❌ Sin acceso |
| **LAVADOR** | ❌ Sin acceso |

**Regla de Negocio:** Solo DUEÑO puede gestionar usuarios.

---

### 13. CONFIGURACIÓN DEL SISTEMA

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Acceso a todas las configuraciones del sistema |
| **ENCARGADO** | ❌ Sin acceso |
| **LAVADOR** | ❌ Sin acceso |

---

### 14. AUDITORÍA Y LOGS

| Rol | Permisos |
|-----|----------|
| **DUEÑO** | ✅ Ver historial completo de todas las acciones |
| **ENCARGADO** | ⚠️ Ver logs de sus propias acciones y de lavadores |
| **LAVADOR** | ❌ Sin acceso |

---

## 🔄 TRANSICIONES DE ESTADO DE OT

### Diagrama de Transiciones

```
┌──────────┐
│ EN_COLA  │
└────┬─────┘
     │
     ├───────────────┐
     │               │
     ▼               ▼
┌──────────┐   ┌──────────┐
│EN_PROCESO│   │CANCELADO │
└────┬─────┘   └──────────┘
     │
     ├───────────────┐
     │               │
     ▼               ▼
┌──────────┐   ┌──────────┐
│  LISTO   │   │CANCELADO │
└────┬─────┘   └──────────┘
     │
     ├───────────────┐
     │               │
     ▼               ▼
┌──────────┐   ┌──────────┐
│ENTREGADO │   │CANCELADO │ (solo DUEÑO)
└──────────┘   └──────────┘
```

### Detalle de Transiciones por Rol

#### EN_COLA → EN_PROCESO
- ✅ **DUEÑO**: Permitido
- ✅ **ENCARGADO**: Permitido
- ✅ **LAVADOR**: Permitido (si está asignado a la OT)

#### EN_COLA → CANCELADO
- ✅ **DUEÑO**: Permitido (requiere motivo)
- ✅ **ENCARGADO**: Permitido (requiere motivo)
- ❌ **LAVADOR**: No permitido

#### EN_PROCESO → LISTO
- ✅ **DUEÑO**: Permitido
- ✅ **ENCARGADO**: Permitido
- ✅ **LAVADOR**: Permitido (si está asignado a la OT)

#### EN_PROCESO → CANCELADO
- ✅ **DUEÑO**: Permitido (requiere motivo)
- ✅ **ENCARGADO**: Permitido (requiere motivo)
- ❌ **LAVADOR**: No permitido

#### LISTO → ENTREGADO
- ✅ **DUEÑO**: Permitido
- ✅ **ENCARGADO**: Permitido
- ✅ **LAVADOR**: Permitido (si está asignado a la OT)

#### LISTO → CANCELADO
- ✅ **DUEÑO**: Permitido (requiere motivo especial)
- ❌ **ENCARGADO**: No permitido
- ❌ **LAVADOR**: No permitido

#### ENTREGADO → (cualquier estado)
- ❌ **Todos los roles**: No permitido (estado final)

---

## 📈 DIAGRAMA VISUAL

### Jerarquía de Permisos

```
                    ┌─────────────────┐
                    │     DUEÑO       │
                    │  🔓 Acceso 100% │
                    └────────┬────────┘
                             │
                             │ Hereda todo
                             ▼
                    ┌─────────────────┐
                    │   ENCARGADO     │
                    │ 🔒 Acceso ~80%  │
                    └────────┬────────┘
                             │
                             │ Sin: usuarios, config
                             ▼
                    ┌─────────────────┐
                    │    LAVADOR      │
                    │ 🔐 Acceso ~20%  │
                    └─────────────────┘
                             │
                             │ Solo operaciones
                             │ básicas
```

### Matriz de Acceso Visual

```
Funcionalidad              │ DUEÑO │ ENCARGADO │ LAVADOR │
───────────────────────────┼───────┼───────────┼─────────┤
Dashboard                  │ █████ │ █████     │ ███     │
Tablero                    │ █████ │ █████     │ ███     │
Crear OT                   │ █████ │ █████     │         │
Editar OT                  │ █████ │ ███       │         │
Cancelar OT                │ █████ │ ███       │         │
Cambiar Estado             │ █████ │ █████     │ ███     │
Registrar Pago             │ █████ │ █████     │         │
Cierre Caja                │ █████ │ █████     │         │
Config Comisiones          │ █████ │           │         │
Liquidar Comisiones        │ █████ │ █████     │         │
Reportes                   │ █████ │ ███       │ █       │
ABM Servicios/Extras       │ █████ │ █████     │         │
ABM Usuarios               │ █████ │           │         │
Configuración              │ █████ │           │         │
Auditoría                  │ █████ │ ███       │         │
```

---

## ⚠️ NOTAS IMPORTANTES

### Inconsistencias Detectadas

1. **LAVADOR:** sin `ot:create`, `pago:create` ni `pago:view`; `getOtAccessScope` → **`assigned`** (solo OTs donde figura en `orden_trabajo_empleados`); puede `EN_COLA→EN_PROCESO` y `EN_PROCESO→LISTO` si está asignado; **no** entrega (`LISTO→ENTREGADO` solo ENCARGADO/DUEÑO). APIs de planificación solo con alcance `all`.

2. **Clientes (API):** permisos `cliente:view|create|edit|delete` para DUEÑO y ENCARGADO; ya no se reutiliza `usuario:*` en rutas de clientes (evita 403 con menú habilitado).

3. **ENCARGADO y configuración de comisiones:** retirado `comision:config` del rol ENCARGADO; coincide con `04-NAVEGACION-Y-PERMISOS.md` y con el middleware de `/comisiones/configurar` (solo DUEÑO).

### Permisos Especiales

- **DUEÑO** tiene un permiso especial `'*'` que otorga acceso a TODO
- **ENCARGADO** puede editar OTs solo en estados `EN_COLA` o `EN_PROCESO`
- **LAVADOR** ve solo OTs asignadas (`assigned`); debe estar en `orden_trabajo_empleados` para listar, ver detalle y cambiar estado permitido

---

## 📝 CÓDIGO DE PERMISOS

### Definición en `src/lib/auth.ts`

Ver la definición actual en `src/lib/auth.ts` (`hasPermission`, `hasEstadoTransitionPermission`, `getOtAccessScope`). Resumen:

- **DUENO:** `*`
- **ENCARGADO:** incluye `ot:change-state:process|ready|delivered`, `pago:*`, `ot:view`, etc.
- **LAVADOR:** solo `ot:change-state:process` y `ot:change-state:ready`
- **CLIENTE:** `portal:report:view`

`getOtAccessScope`: `ot:view` → `all`; rol `LAVADOR` → `assigned`; si no → `none`.

---

## 🔄 ACTUALIZACIÓN DE PERMISOS

Para modificar permisos:

1. Actualizar `src/lib/auth.ts` - función `hasPermission()`
2. Actualizar `src/lib/reglas-negocio.ts` - validaciones de transiciones
3. Actualizar este documento (`ESQUEMA-ROLES-PERMISOS.md`)
4. Actualizar `04-NAVEGACION-Y-PERMISOS.md` si existe
5. Actualizar middleware y protecciones de rutas

---

**Última actualización:** 2026-01-08  
**Versión del sistema:** v1.0-horarios-funcionando


