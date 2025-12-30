# BACKLOG DE HISTORIAS DE USUARIO
## Sistema Lavadero de Autos - MVP

---

## PRIORIDAD ALTA (Must Have - MVP Core)

### US-001: Autenticación de Usuarios
**Como** usuario del sistema  
**Quiero** iniciar sesión con usuario y contraseña  
**Para** acceder al sistema de manera segura

**Criterios de aceptación:**
- Formulario de login con usuario y contraseña
- Validación de credenciales
- Redirección según rol (DUEÑO/ENCARGADO/LAVADOR)
- Sesión persistente mientras el usuario esté activo
- Botón de cerrar sesión

**Prioridad:** 🔴 ALTA  
**Estimación:** 3 puntos

---

### US-002: ABM de Servicios
**Como** encargado o dueño  
**Quiero** crear, editar y desactivar servicios  
**Para** mantener el catálogo actualizado

**Criterias de aceptación:**
- Lista de servicios con filtro activos/inactivos
- Formulario para crear servicio: nombre, precio, duración estimada (opcional), tipo de vehículo (opcional), descripción (opcional)
- Editar servicio existente
- Desactivar servicio (soft delete)
- Validar que el nombre sea único
- Validar que el precio sea numérico positivo

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

### US-003: ABM de Extras
**Como** encargado o dueño  
**Quiero** crear, editar y desactivar extras  
**Para** ofrecer servicios adicionales a los clientes

**Criterias de aceptación:**
- Similar a US-002 pero para extras
- Lista, creación, edición, desactivación

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

### US-004: Crear Orden de Trabajo (OT)
**Como** encargado o lavador  
**Quiero** crear una OT rápidamente (30-60 segundos)  
**Para** registrar el ingreso de un vehículo al lavadero

**Criterias de aceptación:**
- Formulario simplificado con campos esenciales
- Selección de servicio principal (obligatorio)
- Selección múltiple de extras (opcional)
- Patente o descripción del vehículo (patente opcional)
- Tipo de vehículo (obligatorio: chico/mediano/camioneta)
- Selección de empleado(s) asignado(s) (obligatorio)
- Observaciones (opcional)
- Cálculo automático del total
- La OT se crea en estado EN_COLA
- Fecha/hora de ingreso automática

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-005: Tablero Operativo (Vista Kanban)
**Como** encargado o lavador  
**Quiero** ver las OTs en un tablero tipo Kanban  
**Para** tener una visión clara del estado de trabajo

**Criterias de aceptación:**
- Columnas por estado: EN_COLA | EN_PROCESO | LISTO | ENTREGADO
- OTs ordenadas por hora de ingreso dentro de cada columna
- Cada tarjeta muestra: patente/descripción, hora ingreso, servicio+extras, empleado, total
- Filtros: por estado, por empleado, "hoy", "pendientes", "entregados"
- Búsqueda por patente o descripción
- Funciona bien en móvil (scroll horizontal)

**Prioridad:** 🔴 ALTA  
**Estimación:** 13 puntos

---

### US-006: Cambiar Estado de OT (Drag & Drop)
**Como** lavador o encargado  
**Quiero** cambiar el estado de una OT arrastrándola entre columnas  
**Para** actualizar rápidamente el progreso del trabajo

**Criterias de aceptación:**
- Arrastrar tarjeta entre columnas válidas
- Validar transiciones permitidas según reglas de negocio
- Registro automático de timestamp y usuario que cambió
- Confirmación visual del cambio
- En móvil: botones grandes para cambiar estado (alternativa a drag & drop)

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-007: Ver Detalle de OT
**Como** usuario del sistema  
**Quiero** ver el detalle completo de una OT  
**Para** conocer toda la información del trabajo

**Criterias de aceptación:**
- Modal o página con todos los datos de la OT
- Historial de cambios de estado (con timestamps)
- Ver si está pagada o no
- Ver comisiones generadas (si aplica)
- Botón para editar (si está en EN_COLA o EN_PROCESO)
- Botón para cancelar (con motivo)

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

### US-008: Cancelar OT
**Como** encargado o dueño  
**Quiero** cancelar una OT con motivo  
**Para** registrar cuando un trabajo no se realiza

**Criterias de aceptación:**
- Solo estados EN_COLA o EN_PROCESO pueden cancelarse directamente
- LISTO puede cancelarse solo con justificación especial
- Motivo obligatorio (campo de texto)
- Registro en log de auditoría
- Si hay pago asociado, debe manejarse (ajuste o devolución)

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

### US-009: Registrar Pago
**Como** encargado o dueño  
**Quiero** registrar el pago de una OT  
**Para** llevar el control de caja

**Criterias de aceptación:**
- Formulario de pago asociado a OT
- Campos: monto, medio de pago (EFECTIVO/TRANSFERENCIA), referencia (opcional)
- Permitir pagos parciales (múltiples pagos por OT)
- Mostrar saldo pendiente si hay pagos parciales
- Fecha/hora automática (editable)
- Validar que el monto sea positivo

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-010: Cierre de Caja
**Como** encargado o dueño  
**Quiero** realizar el cierre de caja diario  
**Para** tener el control de ingresos del período

**Criterias de aceptación:**
- Seleccionar período (desde/hasta fecha y hora)
- Mostrar resumen: total efectivo, total transferencia, total general
- Listado de OTs cobradas en el período
- Campo de observaciones (opcional)
- Botón para confirmar cierre (definitivo, no modificable)
- Registro de usuario que cerró
- Vista histórica de cierres anteriores

**Prioridad:** 🔴 ALTA  
**Estimación:** 10 puntos

---

### US-011: Configurar Comisiones
**Como** dueño o encargado  
**Quiero** configurar el porcentaje de comisión por servicio/extra  
**Para** calcular correctamente las comisiones de empleados

**Criterias de aceptación:**
- Configuración de modelo (por ítem o por OT)
- Asignar porcentaje de comisión a cada empleado (puede variar por servicio)
- Activar/desactivar comisiones por empleado
- Guardar configuración

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-012: Cálculo Automático de Comisiones
**Como** sistema  
**Quiero** calcular comisiones automáticamente al entregar OT  
**Para** tener registro preciso de comisiones generadas

**Criterias de aceptación:**
- Al marcar OT como ENTREGADO y PAGADA, calcular comisiones
- Aplicar porcentaje configurado por empleado
- Si múltiples empleados, dividir comisión equitativamente
- Registrar cada comisión con estado PENDIENTE
- OTs canceladas no generan comisión

**Prioridad:** 🔴 ALTA  
**Estimación:** 10 puntos

---

### US-013: Liquidación de Comisiones
**Como** dueño o encargado  
**Quiero** liquidar comisiones pendientes de un empleado  
**Para** realizar el pago correspondiente

**Criterias de aceptación:**
- Seleccionar empleado y período (semana/quincena/mes)
- Mostrar listado de OTs que generaron comisión
- Mostrar monto total de comisión
- Generar liquidación y marcar comisiones como LIQUIDADAS
- Registrar usuario que liquidó y fecha
- Vista histórica de liquidaciones

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-014: Reporte de Ventas
**Como** dueño o encargado  
**Quiero** ver reportes de ventas por período  
**Para** analizar el rendimiento del negocio

**Criterias de aceptación:**
- Seleccionar período (día/semana/mes)
- Mostrar totales de ventas
- Gráfico y tabla de ventas por medio de pago
- Ranking de servicios más vendidos
- Ranking de extras más vendidos
- Opción de exportar a PDF/Excel (opcional)

**Prioridad:** 🔴 ALTA  
**Estimación:** 8 puntos

---

### US-015: Reporte de Comisiones
**Como** dueño  
**Quiero** ver reportes de comisiones por empleado  
**Para** revisar las liquidaciones

**Criterias de aceptación:**
- Seleccionar empleado y período
- Mostrar comisiones generadas y liquidadas
- Mostrar comisiones pendientes
- Histórico de liquidaciones

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

### US-016: ABM de Usuarios
**Como** dueño  
**Quiero** gestionar usuarios del sistema  
**Para** controlar quién tiene acceso

**Criterias de aceptación:**
- Lista de usuarios
- Crear usuario: nombre, usuario (login), contraseña, rol, activo/inactivo
- Editar usuario existente
- Desactivar usuario (soft delete)
- Cambiar contraseña de usuario

**Prioridad:** 🔴 ALTA  
**Estimación:** 5 puntos

---

## PRIORIDAD MEDIA (Should Have - MVP Mejorado)

### US-017: Métricas Operativas
**Como** dueño o encargado  
**Quiero** ver métricas operativas básicas  
**Para** entender la eficiencia del lavadero

**Criterias de aceptación:**
- Cantidad de autos atendidos por día/semana/mes
- Tiempo promedio por estado
- Tiempo promedio total por OT
- Cantidad de OTs canceladas con motivos

**Prioridad:** 🟡 MEDIA  
**Estimación:** 8 puntos

---

### US-018: Dashboard Principal
**Como** usuario  
**Quiero** ver un dashboard al ingresar al sistema  
**Para** tener una vista general rápida del estado

**Criterias de aceptación:**
- Resumen de OTs del día por estado
- Ventas del día
- Comisiones pendientes
- Accesos rápidos a funciones principales

**Prioridad:** 🟡 MEDIA  
**Estimación:** 5 puntos

---

### US-019: Editar OT (antes de entregar)
**Como** encargado  
**Quiero** editar una OT en estados EN_COLA o EN_PROCESO  
**Para** corregir información o agregar servicios

**Criterias de aceptación:**
- Solo permitir edición en EN_COLA o EN_PROCESO
- Permitir modificar: servicio, extras, patente, descripción, empleado
- Recalcular total automáticamente
- Registrar en log la modificación

**Prioridad:** 🟡 MEDIA  
**Estimación:** 5 puntos

---

### US-020: Ajuste Manual de Precio
**Como** encargado  
**Quiero** ajustar manualmente el precio de una OT  
**Para** aplicar descuentos o ajustes especiales

**Criterias de aceptación:**
- Campo para precio manual en creación/edición de OT
- Campo de justificación obligatorio si se modifica precio
- Mostrar precio original y precio ajustado
- Registrar en log el ajuste

**Prioridad:** 🟡 MEDIA  
**Estimación:** 3 puntos

---

### US-021: Vista de Lista de OTs (alternativa a Kanban)
**Como** usuario  
**Quiero** ver las OTs en formato de lista  
**Para** tener una vista alternativa más compacta

**Criterias de aceptación:**
- Vista de tabla/listado con todas las OTs
- Mismos filtros que Kanban
- Ordenamiento por columnas
- Botón para cambiar a vista Kanban

**Prioridad:** 🟡 MEDIA  
**Estimación:** 5 puntos

---

### US-022: Historial de Auditoría
**Como** dueño  
**Quiero** ver un historial de acciones importantes  
**Para** tener trazabilidad de cambios

**Criterias de aceptación:**
- Log de cambios de estado de OT
- Log de pagos registrados
- Log de cierres de caja
- Log de cancelaciones
- Log de liquidaciones
- Filtros por usuario, fecha, acción

**Prioridad:** 🟡 MEDIA  
**Estimación:** 8 puntos

---

## PRIORIDAD BAJA (Nice to Have - Post MVP)

### US-023: Subir Foto a OT
**Como** lavador  
**Quiero** subir fotos antes/después a una OT  
**Para** tener registro visual del trabajo

**Criterias de aceptación:**
- Subir una o múltiples fotos desde móvil
- Asociar foto a OT
- Ver galería de fotos en detalle de OT
- Opcional: marcar como "antes" o "después"

**Prioridad:** 🟢 BAJA  
**Estimación:** 8 puntos

---

### US-024: Notificaciones Push
**Como** usuario  
**Quiero** recibir notificaciones cuando una OT cambia de estado  
**Para** estar informado en tiempo real

**Criterias de aceptación:**
- Notificación cuando OT asignada pasa a LISTO
- Configuración de preferencias de notificaciones
- Funciona en móvil (PWA)

**Prioridad:** 🟢 BAJA  
**Estimación:** 8 puntos

---

### US-025: Exportar Reportes
**Como** dueño  
**Quiero** exportar reportes a PDF o Excel  
**Para** compartirlos o archivarlos

**Criterias de aceptación:**
- Exportar reportes de ventas a PDF/Excel
- Exportar reportes de comisiones a PDF/Excel
- Exportar cierre de caja a PDF
- Formato profesional y legible

**Prioridad:** 🟢 BAJA  
**Estimación:** 5 puntos

---

### US-026: Modo Offline Básico
**Como** usuario  
**Quiero** seguir trabajando sin conexión  
**Para** no perder funcionalidad cuando no hay internet

**Criterias de aceptación:**
- Crear OTs sin conexión (guardar localmente)
- Ver cola guardada localmente
- Sincronizar automáticamente al reconectar
- Indicador visual de estado de conexión

**Prioridad:** 🟢 BAJA  
**Estimación:** 13 puntos

---

## RESUMEN DE PRIORIDADES

### MVP Core (Prioridad Alta - 16 historias)
- Autenticación
- ABM Servicios y Extras
- Crear/Ver/Editar/Cancelar OT
- Tablero Kanban y cambio de estado
- Registro de pagos
- Cierre de caja
- Configuración y cálculo de comisiones
- Liquidación de comisiones
- Reportes básicos
- ABM Usuarios

**Total estimado MVP Core:** ~120 puntos

### MVP Mejorado (Prioridad Media - 6 historias)
- Métricas operativas
- Dashboard
- Edición de OT
- Ajuste manual de precio
- Vista lista
- Historial auditoría

**Total estimado MVP Mejorado:** ~34 puntos

### Post MVP (Prioridad Baja - 4 historias)
- Fotos
- Notificaciones push
- Exportar reportes
- Modo offline

**Total estimado Post MVP:** ~34 puntos

---

**Nota:** Las estimaciones están en puntos de historia (Story Points) usando escala de Fibonacci modificada (3, 5, 8, 13). Pueden ajustarse según la metodología del equipo.

