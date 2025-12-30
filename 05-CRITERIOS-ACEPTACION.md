# CRITERIOS DE ACEPTACIÓN
## Sistema Lavadero de Autos - MVP

---

## 1. CRITERIOS DE ACEPTACIÓN PARA FUNCIONES CRÍTICAS

### CA-001: Crear Orden de Trabajo (OT)

**Historia de Usuario:** US-004

**Criterios de Aceptación:**

1. ✅ **Formulario completo y funcional**
   - El formulario muestra todos los campos necesarios: servicio, extras, patente, tipo de vehículo, empleado, observaciones
   - El servicio principal es obligatorio (validación)
   - El tipo de vehículo es obligatorio (validación)
   - Al menos un empleado debe ser seleccionado (validación)

2. ✅ **Cálculo automático de total**
   - El total se calcula automáticamente al seleccionar servicio y extras
   - El total se actualiza en tiempo real cuando se agregan o quitan extras
   - El total se muestra claramente antes de guardar

3. ✅ **Creación exitosa**
   - Al guardar, la OT se crea con estado EN_COLA
   - La fecha/hora de ingreso se registra automáticamente
   - El usuario que creó la OT se registra automáticamente
   - Se muestra mensaje de confirmación
   - Se redirige al tablero o se actualiza la vista

4. ✅ **Validaciones**
   - No se puede crear OT sin servicio
   - No se puede crear OT sin tipo de vehículo
   - No se puede crear OT sin empleado asignado
   - La patente puede estar vacía, pero si está vacía debe haber descripción

5. ✅ **Performance**
   - El formulario se carga en menos de 2 segundos
   - La creación de OT se completa en menos de 1 segundo

6. ✅ **Experiencia móvil**
   - El formulario es fácilmente usable en móvil (campos grandes, teclados apropiados)
   - Puede completarse en 30-60 segundos como máximo

---

### CA-002: Mover Estado de OT (Cambio de Estado)

**Historia de Usuario:** US-006

**Criterios de Aceptación:**

1. ✅ **Transiciones válidas**
   - Solo se permiten transiciones según reglas de negocio (RN-010 a RN-017)
   - Si se intenta una transición inválida, se muestra mensaje de error claro
   - El sistema valida permisos del usuario antes de permitir el cambio

2. ✅ **Drag & Drop funcional (Desktop)**
   - Las tarjetas pueden arrastrarse entre columnas válidas
   - Se muestra feedback visual durante el arrastre (sombra, borde)
   - Al soltar en columna válida, se confirma el cambio
   - Al soltar en columna inválida, la tarjeta vuelve a su posición original

3. ✅ **Botones de acción (Móvil)**
   - En móvil hay botones grandes y claros para cambiar estado
   - Los botones muestran el siguiente estado permitido
   - Al hacer click, se confirma el cambio

4. ✅ **Registro de cambios**
   - Cada cambio de estado registra: fecha/hora, usuario, estado anterior, estado nuevo
   - El timestamp es preciso (incluye hora, minutos, segundos)
   - El registro es inmediato y no se puede perder

5. ✅ **Actualización en tiempo real**
   - La tarjeta se mueve inmediatamente a la nueva columna
   - Si hay otros usuarios viendo el tablero, se actualiza para ellos (o muestra notificación)
   - El orden dentro de la columna se mantiene correcto (por hora de ingreso)

6. ✅ **Confirmación visual**
   - Se muestra mensaje de confirmación (toast/notificación)
   - La tarjeta tiene indicador visual del cambio reciente (ej: borde verde temporal)

---

### CA-003: Registrar Pago

**Historia de Usuario:** US-009

**Criterios de Aceptación:**

1. ✅ **Formulario de pago**
   - Campos: monto (obligatorio), medio de pago (obligatorio), referencia (opcional)
   - El monto por defecto es el total de la OT (editable)
   - Validación: monto debe ser numérico positivo
   - Selección de medio de pago: EFECTIVO o TRANSFERENCIA

2. ✅ **Asociación a OT**
   - El pago se asocia correctamente a la OT indicada
   - Se muestra información de la OT (patente, servicio, total) en el formulario
   - Se muestra saldo pendiente si hay pagos parciales previos

3. ✅ **Pagos parciales**
   - Permite registrar múltiples pagos para la misma OT
   - El sistema suma todos los pagos y muestra:
     - Total pagado
     - Saldo pendiente (total OT - total pagado)
   - Si el monto ingresado excede el saldo, muestra advertencia pero permite continuar

4. ✅ **Registro exitoso**
   - Al guardar, el pago se registra con fecha/hora actual (editable)
   - Se registra el usuario que realizó el pago
   - Se muestra mensaje de confirmación
   - La OT muestra indicador de "PAGADA" si el total está cubierto

5. ✅ **Validaciones**
   - No se puede registrar pago con monto cero o negativo
   - No se puede registrar pago sin medio de pago
   - La referencia para transferencia es opcional pero recomendada (mostrar sugerencia)

6. ✅ **Actualización de estados**
   - Si la OT pasa a ENTREGADA y PAGADA, se calculan comisiones automáticamente (CA-005)

---

### CA-004: Cierre de Caja

**Historia de Usuario:** US-010

**Criterios de Aceptación:**

1. ✅ **Selección de período**
   - Permite seleccionar fecha/hora "desde" y "hasta"
   - Por defecto sugiere el día actual (00:00 a 23:59)
   - Validación: "hasta" debe ser posterior a "desde"

2. ✅ **Cálculo automático de totales**
   - Calcula automáticamente:
     - Total en EFECTIVO (suma de pagos EFECTIVO en período)
     - Total en TRANSFERENCIA (suma de pagos TRANSFERENCIA en período)
     - Total general (suma de ambos)
   - Los cálculos son precisos y correctos

3. ✅ **Listado de OTs cobradas**
   - Muestra listado de todas las OTs cobradas en el período
   - Para cada OT muestra: número, patente, servicio, monto, medio de pago, fecha/hora
   - El listado es ordenable y filtrable

4. ✅ **Observaciones**
   - Campo opcional para observaciones del cierre
   - Permite agregar notas o ajustes

5. ✅ **Confirmación y guardado**
   - Al confirmar, el cierre se guarda como definitivo (no modificable)
   - Se registra usuario que realizó el cierre
   - Se registra fecha/hora del cierre
   - Se muestra mensaje de confirmación con número de cierre
   - Se genera resumen imprimible/exportable (opcional en MVP)

6. ✅ **Validaciones y advertencias**
   - Si hay OTs ENTREGADAS sin pago en el período, mostrar advertencia (opcional, configurable)
   - No permite cerrar períodos futuros
   - No permite cerrar períodos ya cerrados (sin solapamiento)

7. ✅ **Historial**
   - Los cierres quedan registrados en historial
   - Se pueden ver cierres anteriores con todos sus detalles
   - Los cierres no se pueden modificar ni eliminar (solo ver)

---

### CA-005: Cálculo y Liquidación de Comisiones

**Historia de Usuario:** US-012 y US-013

**Criterios de Aceptación - Cálculo:**

1. ✅ **Disparador de cálculo**
   - Las comisiones se calculan automáticamente cuando:
     - OT está en estado ENTREGADO
     - OT está completamente PAGADA (total pagado ≥ total OT)

2. ✅ **Aplicación de porcentajes**
   - Se aplica el porcentaje de comisión configurado para cada empleado
   - Si hay múltiples empleados, se divide equitativamente (o según configuración)
   - El cálculo es preciso (redondeo a 2 decimales)

3. ✅ **Registro de comisiones**
   - Cada comisión se registra con:
     - OT asociada
     - Empleado
     - Monto calculado
     - Porcentaje aplicado
     - Fecha de generación
     - Estado: PENDIENTE
   - Las comisiones no se duplican (validación)

4. ✅ **Excepciones**
   - OTs CANCELADAS no generan comisiones
   - Si una OT ENTREGADA y PAGADA se cancela después, las comisiones deben anularse o ajustarse

**Criterios de Aceptación - Liquidación:**

1. ✅ **Selección de empleado y período**
   - Permite seleccionar empleado (dropdown)
   - Permite seleccionar período: semana/quincena/mes (o fechas personalizadas)
   - Validación: período válido

2. ✅ **Listado de comisiones**
   - Muestra todas las comisiones PENDIENTES del empleado en el período
   - Para cada comisión muestra: OT, monto, porcentaje, fecha de generación
   - Muestra total de comisión a liquidar
   - Solo muestra comisiones con estado PENDIENTE

3. ✅ **Confirmación y liquidación**
   - Al confirmar liquidación:
     - Marca todas las comisiones incluidas como LIQUIDADAS
     - Registra fecha de liquidación
     - Registra usuario que liquidó
     - Genera registro de liquidación (no modificable)

4. ✅ **Validaciones**
   - No se pueden liquidar comisiones ya liquidadas
   - No se puede liquidar sin seleccionar empleado
   - No se puede liquidar sin comisiones pendientes

5. ✅ **Historial de liquidaciones**
   - Las liquidaciones quedan registradas
   - Se puede ver historial con detalle de cada liquidación
   - Las liquidaciones no se pueden modificar ni eliminar

---

### CA-006: Tablero Operativo (Vista Kanban)

**Historia de Usuario:** US-005

**Criterios de Aceptación:**

1. ✅ **Columnas por estado**
   - Muestra 4 columnas: EN_COLA | EN_PROCESO | LISTO | ENTREGADO
   - Las columnas son claramente identificables
   - Puede ocultarse columna CANCELADAS (toggle)

2. ✅ **Ordenamiento**
   - Dentro de cada columna, las OTs se ordenan por fecha/hora de ingreso (más antiguo primero)
   - El orden se mantiene al cambiar estados

3. ✅ **Información en tarjetas**
   - Cada tarjeta muestra:
     - Patente o descripción del vehículo (destacado)
     - Hora de ingreso
     - Servicio principal + extras (resumidos)
     - Empleado(s) asignado(s)
     - Total
     - Indicador visual de pagado/no pagado (opcional)
   - La información es legible en móvil y desktop

4. ✅ **Filtros**
   - Filtro por estado (toggle de columnas)
   - Filtro por empleado (dropdown múltiple)
   - Filtro por período: "Hoy", "Pendientes", "Entregados"
   - Búsqueda por patente o descripción (búsqueda en tiempo real)
   - Los filtros se combinan correctamente (AND lógico)

5. ✅ **Interacción**
   - Click en tarjeta abre detalle completo
   - Drag & drop funcional en desktop (ver CA-002)
   - Botones de acción rápida en móvil
   - Feedback visual al interactuar

6. ✅ **Performance**
   - El tablero carga en menos de 3 segundos con hasta 100 OTs
   - Los cambios de estado son inmediatos (menos de 500ms)
   - La búsqueda es instantánea (sin delay notable)

7. ✅ **Responsive**
   - En desktop: columnas lado a lado
   - En móvil: scroll horizontal entre columnas
   - Tarjetas adaptadas al tamaño de pantalla

---

### CA-007: Cancelar OT

**Historia de Usuario:** US-008

**Criterios de Aceptación:**

1. ✅ **Permisos**
   - Solo ENCARGADO y DUEÑO pueden cancelar
   - LAVADOR no puede cancelar (botón no visible o deshabilitado)

2. ✅ **Estados cancelables**
   - EN_COLA puede cancelarse directamente
   - EN_PROCESO puede cancelarse directamente
   - LISTO puede cancelarse solo por DUEÑO (o con justificación especial)
   - ENTREGADO no puede cancelarse (solo ajustes administrativos especiales)

3. ✅ **Motivo obligatorio**
   - Al cancelar, se requiere ingresar motivo (campo de texto obligatorio)
   - El motivo tiene longitud mínima (ej: 10 caracteres)
   - El motivo se guarda en el registro de la OT

4. ✅ **Manejo de pagos**
   - Si la OT tiene pagos asociados, se muestra alerta
   - Se requiere confirmación adicional si hay pagos
   - Se permite registrar devolución o ajuste en caja
   - El sistema registra el manejo del pago

5. ✅ **Efectos de cancelación**
   - La OT pasa a estado CANCELADO
   - Se registra en log de auditoría (usuario, fecha/hora, motivo)
   - No se generan comisiones (o se anulan si ya se generaron)
   - La OT desaparece del tablero principal (salvo que se active filtro de canceladas)

6. ✅ **Confirmación**
   - Se muestra modal de confirmación antes de cancelar
   - El usuario debe confirmar explícitamente
   - Se muestra mensaje de éxito después de cancelar

---

## 2. CRITERIOS DE ACEPTACIÓN GENERALES

### CA-GEN-001: Autenticación
- Usuario y contraseña son requeridos
- Contraseña incorrecta muestra mensaje de error (sin revelar si el usuario existe)
- Sesión expira después de período de inactividad (configurable)
- Botón de cerrar sesión funciona correctamente

### CA-GEN-002: Permisos por Rol
- Cada usuario solo ve y puede realizar acciones según su rol
- Los botones/acciones no permitidas no se muestran o están deshabilitadas
- Si se intenta acceder a ruta no permitida, se redirige a dashboard con mensaje

### CA-GEN-003: Validaciones de Formularios
- Todos los campos obligatorios tienen validación
- Los mensajes de error son claros y específicos
- Los formularios no se pueden enviar con errores
- Se muestra feedback visual inmediato al validar

### CA-GEN-004: Performance
- Las páginas cargan en menos de 3 segundos
- Las acciones (crear, editar, eliminar) se completan en menos de 1 segundo
- No hay bloqueos de interfaz durante operaciones

### CA-GEN-005: Experiencia Móvil (PWA)
- La aplicación es instalable como PWA
- Funciona bien en pantallas pequeñas (320px mínimo)
- Los botones son fáciles de tocar (mínimo 44x44px)
- La navegación es intuitiva en móvil

### CA-GEN-006: Auditoría
- Todas las acciones importantes se registran en log
- El log incluye: fecha/hora, usuario, acción, entidad afectada
- Solo DUEÑO puede ver logs completos
- Los logs no se pueden modificar ni eliminar

---

**Documento de Criterios de Aceptación - Sistema Lavadero de Autos MVP**  
**Versión:** 1.0  
**Total de criterios definidos:** 7 principales + 6 generales

