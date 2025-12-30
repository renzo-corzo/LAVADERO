# ESPECIFICACIÓN FUNCIONAL - SISTEMA LAVADERO DE AUTOS
## Versión MVP (Mínimo Producto Viable)

---

## 1. VISIÓN GENERAL

### 1.1 Objetivo del Sistema
Sistema web + PWA para gestión operativa y control de caja de un lavadero de autos que opera por orden de llegada (sin turnos), con control de cola, estados de trabajo, cobros y liquidación de comisiones para empleados.

### 1.2 Alcance MVP
Versión inicial que permite:
- Gestión de catálogo de servicios y extras
- Creación y seguimiento de órdenes de trabajo (OT)
- Control visual de la cola operativa
- Registro de cobros y cierre de caja
- Cálculo y liquidación de comisiones
- Reportes básicos de operación

### 1.3 Usuarios Objetivo
- **DUEÑO**: Control total del negocio, acceso a reportes y configuraciones
- **ENCARGADO**: Gestión operativa diaria, cobros y cierre de caja
- **LAVADOR**: Visualización y actualización de estado de OTs asignadas

---

## 2. MÓDULOS DEL SISTEMA

### 2.1 Catálogo de Servicios y Extras

#### 2.1.1 ABM de Servicios
**Funcionalidad:**
- Crear, editar, eliminar (soft delete) y listar servicios
- Campos del servicio:
  - Nombre (obligatorio, único)
  - Precio base (obligatorio, numérico positivo)
  - Duración estimada (opcional, en minutos)
  - Tipo de vehículo aplicable (opcional: chico/mediano/camioneta)
  - Activo/Inactivo (checkbox)
  - Descripción (opcional, texto largo)

**Pantallas:**
- Lista de servicios (tabla con filtros: activos/inactivos)
- Formulario de creación/edición de servicio
- Vista detalle de servicio

#### 2.1.2 ABM de Extras
**Funcionalidad:**
- Similar a servicios, pero aplicable como complemento
- Campos: nombre, precio, duración estimada, activo/inactivo, descripción

**Pantallas:**
- Lista de extras
- Formulario de creación/edición de extra
- Vista detalle de extra

---

### 2.2 Órdenes de Trabajo (OT)

#### 2.2.1 Creación de OT
**Funcionalidad:**
- Creación rápida en 30-60 segundos
- Flujo: seleccionar servicio → agregar extras → datos del vehículo → asignar empleado → crear

**Campos mínimos:**
- Fecha/hora de ingreso (automática, editable solo por encargado/dueño)
- Patente (opcional, texto libre o "sin patente")
- Tipo de vehículo (chico/mediano/camioneta, obligatorio)
- Descripción del vehículo (opcional, texto libre)
- Servicio principal (obligatorio, selección del catálogo)
- Extras (opcional, múltiple selección del catálogo)
- Empleado asignado (obligatorio, selección múltiple permitida)
- Observaciones (opcional, texto largo)
- Total calculado automáticamente (servicio + extras)

**Reglas:**
- El precio puede ajustarse manualmente si hay variación especial (con justificación)
- La OT se crea en estado EN_COLA por defecto

#### 2.2.2 Estados de OT
Estados posibles (transiciones válidas):
1. **EN_COLA** → Estado inicial al crear OT
2. **EN_PROCESO** → Cuando se comienza a trabajar en el vehículo
3. **LISTO** → Cuando el trabajo está completado y listo para entregar
4. **ENTREGADO** → Cuando el cliente retira su vehículo
5. **CANCELADO** → OT cancelada (requiere motivo obligatorio)

**Transiciones permitidas:**
- EN_COLA → EN_PROCESO (lavador/encargado)
- EN_COLA → CANCELADO (encargado/dueño, con motivo)
- EN_PROCESO → LISTO (lavador/encargado)
- EN_PROCESO → CANCELADO (encargado/dueño, con motivo)
- LISTO → ENTREGADO (encargado/dueño, permite registrar cobro)
- LISTO → CANCELADO (encargado/dueño, con motivo)

**Registro de timestamps:**
- Cada cambio de estado registra: fecha/hora, usuario que cambió, estado anterior, estado nuevo

#### 2.2.3 Edición y Cancelación
- Edición permitida solo en estados EN_COLA o EN_PROCESO
- Cancelación requiere motivo obligatorio (texto)
- Al cancelar, si hay pago registrado, debe manejarse (devolución o ajuste en caja)

---

### 2.3 Tablero Operativo (Cola Visual)

#### 2.3.1 Vista Principal
**Funcionalidad:**
- Vista tipo Kanban con columnas por estado: EN_COLA | EN_PROCESO | LISTO | ENTREGADO
- Las OTs se muestran en orden de llegada dentro de cada columna
- Cada tarjeta muestra:
  - Patente o descripción del vehículo
  - Hora de ingreso
  - Servicio principal + extras resumidos
  - Empleado asignado
  - Tiempo transcurrido (si está en proceso)
  - Total

**Interacciones:**
- Arrastrar tarjeta entre columnas para cambiar estado (drag & drop)
- Click en tarjeta abre detalle completo
- Botón rápido "Marcar como [siguiente estado]" visible en móvil

#### 2.3.2 Filtros y Búsqueda
- Filtro por estado
- Filtro por empleado
- Filtro por período: "Hoy", "Pendientes" (no entregados), "Entregados"
- Búsqueda por patente o descripción
- Toggle para mostrar/ocultar canceladas

**Pantallas:**
- Tablero principal (vista Kanban)
- Vista de lista (alternativa para móvil si es más cómodo)

---

### 2.4 Caja y Cobros

#### 2.4.1 Registro de Pago
**Funcionalidad:**
- Asociar pago a una OT (preferiblemente cuando pasa a ENTREGADO, pero puede ser antes)
- Campos del pago:
  - OT asociada (obligatorio)
  - Monto (obligatorio, numérico positivo, por defecto el total de la OT)
  - Medio de pago (EFECTIVO o TRANSFERENCIA, obligatorio)
  - Referencia (opcional, para transferencias: CBU, alias, número de operación)
  - Fecha/hora (automática, editable)
  - Usuario que registra (automático)

**Reglas:**
- Una OT puede tener múltiples pagos parciales (pago dividido)
- El sistema suma pagos parciales y muestra el saldo pendiente
- Al marcar OT como pagada completamente, se puede cerrar

#### 2.4.2 Cierre de Caja
**Funcionalidad:**
- Cierre diario o por turno (configurable)
- Al realizar cierre se registra:
  - Fecha/hora de cierre
  - Período cerrado (desde fecha/hora hasta fecha/hora)
  - Totales por medio de pago:
    - Total en EFECTIVO
    - Total en TRANSFERENCIA
    - Total general
  - Listado de OTs cobradas en ese período (con detalle)
  - Usuario que realizó el cierre
  - Observaciones (opcional)
  - Diferencia (si hubo ajustes manuales)

**Reglas:**
- Solo ENCARGADO o DUEÑO puede cerrar caja
- No se puede cerrar un período si hay OTs pendientes de cobro (opcional, configurable)
- El cierre es definitivo (no se puede modificar, solo anular con observaciones)

**Pantallas:**
- Formulario de cierre de caja
- Listado histórico de cierres
- Vista detalle de cierre

---

### 2.5 Comisiones

#### 2.5.1 Configuración de Comisiones
**Funcionalidad:**
- Definir comisión por servicio o extra (porcentaje configurable)
- Dos modelos disponibles (configurable en sistema):
  - **Modelo A (Recomendado)**: Comisión por ítem (servicio y extra) con porcentaje individual
  - **Modelo B (Alternativo)**: Comisión por OT sobre el total con porcentaje único

**Configuración por empleado:**
- Asignar porcentaje de comisión a cada empleado (puede variar por servicio si se implementa)
- Activo/Inactivo para comisiones

#### 2.5.2 Cálculo de Comisiones
**Reglas de cálculo:**
- Se calcula al momento de marcar OT como ENTREGADO y PAGADA
- Si la OT tiene múltiples empleados, se divide la comisión entre ellos (equitativo o según configuración)
- Si la OT es cancelada, no genera comisión (o se puede configurar excepción)

**Registro:**
- Cada comisión se registra con:
  - OT asociada
  - Empleado
  - Monto de la comisión
  - Porcentaje aplicado
  - Fecha de generación
  - Estado: PENDIENTE / LIQUIDADA

#### 2.5.3 Liquidación de Comisiones
**Funcionalidad:**
- Generar liquidación por empleado para un período (semana/quincena/mes)
- La liquidación muestra:
  - Período
  - Empleado
  - Listado de OTs que generaron comisión
  - Monto total de comisión
  - Estado (PENDIENTE / LIQUIDADA)
  - Fecha de liquidación
  - Usuario que liquidó

**Pantallas:**
- Vista de comisiones pendientes por empleado
- Formulario de liquidación
- Histórico de liquidaciones

---

### 2.6 Reportes

#### 2.6.1 Reportes de Ventas
- Ventas por día/semana/mes (gráfico y tabla)
- Totales por medio de pago (gráfico)
- Servicios más vendidos (ranking)
- Extras más vendidos (ranking)
- Comparativa período a período

#### 2.6.2 Reportes de Comisiones
- Comisiones generadas por empleado (por período)
- Comisiones pendientes de liquidar
- Histórico de liquidaciones

#### 2.6.3 Métricas Operativas
- Cantidad de autos atendidos por día/semana/mes
- Tiempos promedio por estado (si hay timestamps)
- Tiempo promedio total por OT
- OTs canceladas (cantidad y motivos)

**Pantallas:**
- Dashboard con métricas principales
- Selección de período para reportes
- Exportación a PDF/Excel (opcional en MVP)

---

### 2.7 Gestión de Usuarios y Permisos

#### 2.7.1 Roles
- **DUEÑO**: Acceso total (configuraciones, reportes, caja, OTs, usuarios)
- **ENCARGADO**: Gestión de OTs, cobros, cierre de caja, ver reportes básicos
- **LAVADOR**: Ver OTs asignadas, cambiar estado a EN_PROCESO/LISTO

#### 2.7.2 Usuarios
- ABM de usuarios
- Campos: nombre, usuario (login), contraseña, rol, activo/inactivo
- Autenticación simple (usuario/contraseña)

---

### 2.8 Auditoría y Logs
- Registro de acciones relevantes:
  - Cambios de estado de OT
  - Registro de pagos
  - Cierres de caja
  - Cancelaciones de OT
  - Liquidaciones de comisión
  - Cambios en catálogos (servicios/extras)

---

## 3. FLUJO OPERATIVO COMPLETO

### 3.1 Flujo Normal de una OT
1. **Ingreso**: Vehículo llega al lavadero
2. **Creación de OT**: Encargado/lavador crea OT rápida (30-60 seg)
   - Selecciona servicio y extras
   - Ingresa patente o descripción
   - Asigna empleado(s)
   - Sistema calcula total
3. **EN_COLA**: OT aparece en tablero en columna "EN_COLA"
4. **EN_PROCESO**: Cuando se comienza a trabajar, se mueve a "EN_PROCESO"
5. **LISTO**: Cuando el trabajo está terminado, se mueve a "LISTO"
6. **ENTREGADO**: Cuando el cliente retira, se mueve a "ENTREGADO"
7. **Cobro**: Se registra pago (puede ser antes o al entregar)
8. **Cierre**: Se calcula comisión para empleado(s)

### 3.2 Flujo de Cierre de Caja
1. Al final del día/turno, encargado/dueño accede a "Cierre de Caja"
2. Sistema muestra resumen de cobros del período
3. Encargado verifica totales y registra observaciones si aplica
4. Realiza cierre definitivo
5. Sistema genera registro de cierre (no modificable)

### 3.3 Flujo de Liquidación de Comisiones
1. Período establecido (semanal/quincenal/mensual)
2. Dueño/encargado accede a "Liquidación de Comisiones"
3. Selecciona empleado y período
4. Sistema muestra OTs que generaron comisión
5. Se genera liquidación y marca comisiones como "LIQUIDADAS"

---

## 4. DATOS MÍNIMOS A CAPTURAR

### 4.1 Orden de Trabajo (OT)
- ID único
- Fecha/hora de ingreso
- Patente (opcional)
- Tipo de vehículo
- Descripción del vehículo (opcional)
- Servicio principal (ID servicio)
- Extras (array de IDs extras)
- Empleados asignados (array de IDs usuarios)
- Observaciones (texto)
- Estado actual
- Total calculado
- Timestamps de cambios de estado
- Usuario que creó
- Fecha/hora de creación

### 4.2 Pago
- ID único
- OT asociada (ID OT)
- Monto
- Medio de pago
- Referencia (opcional)
- Fecha/hora
- Usuario que registró

### 4.3 Cierre de Caja
- ID único
- Fecha/hora de cierre
- Período desde/hasta
- Total efectivo
- Total transferencia
- Total general
- Listado de OTs (array de IDs)
- Observaciones
- Usuario que cerró

### 4.4 Comisión
- ID único
- OT asociada (ID OT)
- Empleado (ID usuario)
- Monto de comisión
- Porcentaje aplicado
- Fecha de generación
- Estado (PENDIENTE/LIQUIDADA)
- Fecha de liquidación (si aplica)
- Usuario que liquidó (si aplica)

### 4.5 Servicio
- ID único
- Nombre
- Precio base
- Duración estimada (opcional)
- Tipo de vehículo (opcional)
- Activo/inactivo
- Descripción (opcional)
- Fecha de creación
- Fecha de última modificación

### 4.6 Extra
- Similar a Servicio

### 4.7 Usuario
- ID único
- Nombre completo
- Usuario (login)
- Contraseña (hash)
- Rol
- Activo/inactivo
- Fecha de creación

---

## 5. EXPERIENCIA PWA (Progressive Web App)

### 5.1 Requisitos PWA
- Instalable en dispositivos móviles (iOS/Android)
- Funciona offline parcial (ver cola, editar OTs locales, sincronizar al reconectar)
- Iconos y splash screen personalizados
- Acceso rápido desde pantalla de inicio

### 5.2 Flujos Optimizados para Móvil
1. **Crear OT rápida**:
   - Pantalla simplificada con campos esenciales
   - Selección por botones grandes y fáciles de tocar
   - Confirmación rápida

2. **Ver cola del día**:
   - Vista Kanban adaptada a móvil (scroll horizontal)
   - Tarjetas compactas pero legibles
   - Gestos táctiles para cambiar estado

3. **Cambiar estado**:
   - Botones grandes "Marcar como LISTO", "Marcar como EN_PROCESO"
   - Confirmación rápida

4. **Registrar cobro**:
   - Formulario simplificado
   - Selector de medio de pago prominente
   - Calculadora de cambio (si es efectivo)

---

## 6. PREPARACIÓN PARA VERSIONES FUTURAS

El sistema debe diseñarse considerando estas funcionalidades futuras (no implementar en MVP):

1. **Automatización de mensajes**: Campo para teléfono de contacto, disparador de notificación al pasar a LISTO
2. **OCR de patentes**: Campo para foto, procesamiento de imagen
3. **Estimación de tiempo (ETA)**: Cálculo basado en cola y capacidad
4. **Gestión de capacidad**: Zonas físicas del lavadero, cupos máximos
5. **Clientes registrados**: Entidad Cliente, asociación a OTs, historial
6. **Fidelización**: Programa de puntos, descuentos

**Consideraciones técnicas:**
- Estructura de base de datos extensible
- API modular para integraciones futuras
- Separación de lógica de negocio para facilitar agregado de funcionalidades

---

## 7. RESTRICCIONES Y SUPUESTOS MVP

- No se requiere registro de clientes (venta anónima)
- Trabajo por orden de llegada (sin turnos)
- Comisiones simples (por ítem o por OT)
- Medios de pago: solo EFECTIVO y TRANSFERENCIA
- Sin integración con sistemas externos (contabilidad, bancos)
- Funciona en navegadores modernos (Chrome, Safari, Firefox)

---

**Documento generado para MVP - Sistema Lavadero de Autos**
**Fecha:** 2024
**Versión:** 1.0

