# REGLAS DE NEGOCIO
## Sistema Lavadero de Autos - MVP

---

## 1. REGLAS DE ÓRDENES DE TRABAJO (OT)

### 1.1 Creación de OT
- **RN-001**: Una OT se crea siempre en estado **EN_COLA** por defecto
- **RN-002**: La fecha/hora de ingreso se registra automáticamente al crear la OT (puede editarse solo por ENCARGADO/DUEÑO)
- **RN-003**: El servicio principal es **obligatorio** en toda OT
- **RN-004**: Los extras son **opcionales** y pueden ser múltiples
- **RN-005**: La patente es **opcional**, pero debe ingresarse una descripción del vehículo si no hay patente
- **RN-006**: El tipo de vehículo (chico/mediano/camioneta) es **obligatorio**
- **RN-007**: Al menos un empleado debe ser asignado a la OT
- **RN-008**: El total de la OT se calcula automáticamente: precio servicio + suma de precios de extras
- **RN-009**: El precio puede ajustarse manualmente solo por ENCARGADO/DUEÑO, requiriendo justificación obligatoria

### 1.2 Estados de OT y Transiciones

**Estados posibles:**
1. **EN_COLA**: Estado inicial al crear OT
2. **EN_PROCESO**: Trabajo en progreso
3. **LISTO**: Trabajo completado, listo para entregar
4. **ENTREGADO**: Vehículo entregado al cliente
5. **CANCELADO**: OT cancelada

**Transiciones válidas:**

- **RN-010**: EN_COLA → EN_PROCESO (permitido para: LAVADOR, ENCARGADO, DUEÑO)
- **RN-011**: EN_COLA → CANCELADO (permitido para: ENCARGADO, DUEÑO, requiere motivo obligatorio)
- **RN-012**: EN_PROCESO → LISTO (permitido para: LAVADOR, ENCARGADO, DUEÑO)
- **RN-013**: EN_PROCESO → CANCELADO (permitido para: ENCARGADO, DUEÑO, requiere motivo obligatorio)
- **RN-014**: LISTO → ENTREGADO (permitido para: ENCARGADO, DUEÑO, puede registrar cobro al mismo tiempo)
- **RN-015**: LISTO → CANCELADO (permitido solo para: DUEÑO, requiere motivo obligatorio y justificación especial)
- **RN-016**: No se permite volver a un estado anterior (ej: LISTO → EN_PROCESO)
- **RN-017**: ENTREGADO es estado final, no puede cambiarse (excepto por ajustes administrativos especiales)

### 1.3 Registro de Timestamps
- **RN-018**: Cada cambio de estado debe registrar:
  - Fecha y hora del cambio
  - Usuario que realizó el cambio
  - Estado anterior
  - Estado nuevo
- **RN-019**: Estos timestamps se utilizan para métricas de tiempo (tiempo promedio por estado)

### 1.4 Edición de OT
- **RN-020**: Una OT solo puede editarse si está en estado **EN_COLA** o **EN_PROCESO**
- **RN-021**: No se puede editar una OT en estado **LISTO**, **ENTREGADO** o **CANCELADO**
- **RN-022**: Cualquier modificación debe registrarse en el log de auditoría
- **RN-023**: Si se modifica servicio o extras, el total debe recalcularse automáticamente

### 1.5 Cancelación de OT
- **RN-024**: Toda cancelación requiere un **motivo obligatorio** (campo de texto)
- **RN-025**: Si la OT cancelada tiene pagos asociados, el sistema debe:
  - Mostrar alerta de que hay pagos registrados
  - Permitir registrar devolución o ajuste en caja
  - Registrar la cancelación con el motivo
- **RN-026**: Una OT cancelada **no genera comisiones**
- **RN-027**: Las OTs canceladas pueden mostrarse u ocultarse en el tablero según filtro

---

## 2. REGLAS DE COBROS Y PAGOS

### 2.1 Registro de Pago
- **RN-028**: Un pago debe estar asociado a una OT específica
- **RN-029**: Los medios de pago permitidos en MVP son: **EFECTIVO** y **TRANSFERENCIA**
- **RN-030**: El monto del pago es obligatorio y debe ser un número positivo
- **RN-031**: Si el medio de pago es TRANSFERENCIA, se recomienda (pero no es obligatorio) ingresar una referencia (CBU, alias, número de operación)
- **RN-032**: La fecha/hora del pago se registra automáticamente (puede editarse por ENCARGADO/DUEÑO)
- **RN-033**: Se registra automáticamente el usuario que realizó el pago

### 2.2 Pagos Parciales
- **RN-034**: Una OT puede tener **múltiples pagos parciales**
- **RN-035**: El sistema debe sumar todos los pagos de una OT y mostrar:
  - Total pagado
  - Saldo pendiente (total OT - total pagado)
- **RN-036**: Una OT se considera completamente pagada cuando: suma de pagos ≥ total de la OT
- **RN-037**: El sistema permite registrar pagos que excedan el total (vuelto o propina), pero muestra advertencia

### 2.3 Relación OT - Pago - Entrega
- **RN-038**: Una OT puede tener pagos registrados **antes** de estar en estado ENTREGADO
- **RN-039**: Una OT en estado ENTREGADO puede o no tener pago registrado (permite cobro posterior)
- **RN-040**: Al marcar una OT como ENTREGADO, el sistema puede ofrecer registrar el pago en el mismo flujo
- **RN-041**: Si una OT está ENTREGADA y PAGADA, se calculan las comisiones automáticamente

---

## 3. REGLAS DE CIERRE DE CAJA

### 3.1 Realización de Cierre
- **RN-042**: Solo **ENCARGADO** y **DUEÑO** pueden realizar cierre de caja
- **RN-043**: El cierre puede ser diario o por turno (configurable en sistema)
- **RN-044**: El período de cierre se define por fecha/hora desde y fecha/hora hasta
- **RN-045**: El sistema calcula automáticamente:
  - Total en EFECTIVO (suma de pagos con medio EFECTIVO en el período)
  - Total en TRANSFERENCIA (suma de pagos con medio TRANSFERENCIA en el período)
  - Total general (suma de ambos)
- **RN-046**: El sistema muestra listado de todas las OTs cobradas en el período

### 3.2 Validaciones de Cierre
- **RN-047**: El sistema puede (opcional, configurable) advertir si hay OTs ENTREGADAS pero sin pago registrado en el período
- **RN-048**: El encargado/dueño puede registrar observaciones del cierre (opcional)
- **RN-049**: El sistema registra automáticamente el usuario que realizó el cierre

### 3.3 Irreversibilidad del Cierre
- **RN-050**: Un cierre de caja es **definitivo y no modificable** una vez confirmado
- **RN-051**: Si hay error, se debe crear un nuevo cierre de ajuste con observaciones explicando la corrección
- **RN-052**: El historial de cierres debe mantenerse completo para auditoría

---

## 4. REGLAS DE COMISIONES

### 4.1 Configuración de Comisiones
- **RN-053**: El sistema permite dos modelos de comisión (configurable):
  - **Modelo A (Recomendado)**: Comisión por ítem (servicio y extra) con porcentaje individual configurable
  - **Modelo B (Alternativo)**: Comisión por OT sobre el total con porcentaje único por empleado
- **RN-054**: Cada empleado puede tener un porcentaje de comisión configurado
- **RN-055**: El porcentaje de comisión puede variar por servicio/extra si se configura (Modelo A avanzado)
- **RN-056**: Un empleado puede estar activo/inactivo para comisiones (independiente de estar activo como usuario)

### 4.2 Cálculo de Comisiones
- **RN-057**: Las comisiones se calculan automáticamente cuando una OT está en estado **ENTREGADO** y está **PAGADA** (totalmente)
- **RN-058**: Si una OT tiene múltiples empleados asignados:
  - La comisión se divide **equitativamente** entre todos los empleados (por defecto)
  - O según porcentaje de participación si se configura
- **RN-059**: Una OT **CANCELADA** no genera comisiones
- **RN-060**: Si una OT ENTREGADA y PAGADA se cancela posteriormente (ajuste administrativo), las comisiones ya generadas deben anularse o ajustarse
- **RN-061**: Cada comisión se registra con:
  - OT asociada
  - Empleado
  - Monto de la comisión calculado
  - Porcentaje aplicado
  - Fecha de generación
  - Estado: **PENDIENTE** o **LIQUIDADA**

### 4.3 Liquidación de Comisiones
- **RN-062**: La liquidación se realiza por empleado y por período (semana/quincena/mes)
- **RN-063**: Solo se pueden liquidar comisiones con estado **PENDIENTE**
- **RN-064**: Al liquidar, el sistema:
  - Muestra listado de todas las OTs que generaron comisión en el período
  - Calcula el total de comisión a liquidar
  - Marca todas las comisiones incluidas como **LIQUIDADAS**
  - Registra fecha de liquidación y usuario que liquidó
- **RN-065**: Una vez liquidada, una comisión no puede modificarse (solo anularse con ajuste administrativo)

---

## 5. REGLAS DE CATÁLOGOS (SERVICIOS Y EXTRAS)

### 5.1 Servicios
- **RN-066**: El nombre del servicio debe ser **único** en el sistema
- **RN-067**: El precio debe ser un número positivo mayor a cero
- **RN-068**: Un servicio inactivo no puede seleccionarse al crear nuevas OTs, pero sigue visible en OTs históricas
- **RN-069**: La duración estimada es opcional y se mide en minutos
- **RN-070**: Si se define tipo de vehículo (chico/mediano/camioneta), el precio puede variar (implementación futura)

### 5.2 Extras
- **RN-071**: Las reglas de extras son idénticas a las de servicios (RN-066 a RN-070)
- **RN-072**: Un extra puede aplicarse a múltiples servicios

---

## 6. REGLAS DE USUARIOS Y PERMISOS

### 6.1 Roles
- **RN-073**: Existen tres roles en el sistema: **DUEÑO**, **ENCARGADO**, **LAVADOR**
- **RN-074**: **DUEÑO**: Tiene acceso total a todas las funcionalidades (configuraciones, reportes, caja, OTs, usuarios)
- **RN-075**: **ENCARGADO**: Puede gestionar OTs (crear, editar, cambiar estado, cancelar), registrar cobros, realizar cierre de caja, ver reportes básicos, pero NO puede gestionar usuarios ni configuraciones avanzadas
- **RN-076**: **LAVADOR**: Puede ver OTs asignadas a él, cambiar estado de OT a EN_PROCESO o LISTO, ver su detalle, pero NO puede crear OTs, cobrar, ni acceder a reportes o caja

### 6.2 Usuarios
- **RN-077**: El usuario (login) debe ser único en el sistema
- **RN-078**: La contraseña debe cumplir con políticas mínimas de seguridad (mínimo 6 caracteres recomendado)
- **RN-079**: Un usuario inactivo no puede iniciar sesión
- **RN-080**: Solo el **DUEÑO** puede gestionar usuarios (crear, editar, desactivar)

### 6.3 Autenticación
- **RN-081**: Toda acción importante debe registrar el usuario que la realizó (creación de OT, cambio de estado, pago, cierre, etc.)
- **RN-082**: La sesión expira después de un período de inactividad (configurable, recomendado: 8 horas)

---

## 7. REGLAS DE ORDEN Y PRIORIDAD

### 7.1 Orden de Llegada
- **RN-083**: El lavadero opera por **orden de llegada** (sin turnos)
- **RN-084**: El orden de las OTs dentro de cada estado (especialmente EN_COLA) se determina por la **fecha/hora de ingreso** (más antiguo primero)
- **RN-085**: No existe sistema de prioridades o urgencias en MVP

---

## 8. REGLAS DE REPORTES Y MÉTRICAS

### 8.1 Ventas
- **RN-086**: Las ventas se contabilizan por OTs en estado **ENTREGADO** y **PAGADAS**
- **RN-087**: Las OTs canceladas no se incluyen en reportes de ventas
- **RN-088**: Los períodos de reporte son: día, semana, mes (configurables)

### 8.2 Comisiones
- **RN-089**: Los reportes de comisiones muestran solo comisiones generadas por OTs entregadas y pagadas
- **RN-090**: Se diferencia entre comisiones PENDIENTES y LIQUIDADAS

### 8.3 Métricas Operativas
- **RN-091**: Los tiempos se calculan a partir de los timestamps registrados en cambios de estado
- **RN-092**: Solo se consideran OTs completadas (ENTREGADAS o CANCELADAS) para métricas de tiempo

---

## 9. REGLAS DE AUDITORÍA

### 9.1 Registro de Acciones
- **RN-093**: Deben registrarse en log de auditoría:
  - Creación de OT
  - Cambios de estado de OT
  - Registro de pagos
  - Cierres de caja
  - Cancelaciones de OT (con motivo)
  - Liquidaciones de comisión
  - Cambios en catálogos (servicios/extras) - creación, modificación, desactivación
  - Modificaciones de usuarios
- **RN-094**: Cada entrada de log debe incluir: fecha/hora, usuario, acción, entidad afectada, datos relevantes

---

## 10. REGLAS ESPECIALES Y EXCEPCIONES

### 10.1 Ajustes Manuales
- **RN-095**: Los ajustes manuales de precio requieren justificación obligatoria
- **RN-096**: Los ajustes manuales deben ser visibles en el detalle de la OT y en reportes

### 10.2 Datos Opcionales vs Obligatorios
- **RN-097**: La patente es opcional, pero si no se ingresa, debe haber una descripción del vehículo
- **RN-098**: Las observaciones son siempre opcionales
- **RN-099**: La referencia de transferencia es opcional pero recomendada

---

## 11. PREPARACIÓN PARA FUTURAS VERSIONES

### 11.1 Campos Reservados
- **RN-100**: Se debe dejar preparado campo para teléfono de contacto (sin usar en MVP, para notificaciones futuras)
- **RN-101**: Se debe dejar preparado campo para foto de patente/vehículo (sin usar en MVP, para OCR futuro)
- **RN-102**: La estructura de datos debe permitir asociar un cliente a una OT (sin implementar en MVP)

---

**Documento de Reglas de Negocio - Sistema Lavadero de Autos MVP**  
**Versión:** 1.0  
**Total de reglas definidas:** 102





