/**
 * Tipos principales del sistema
 * Definir aquí todos los tipos TypeScript usados en la aplicación
 */

// Roles de usuario
// Nota: En Prisma se usa "DUENO" (sin Ñ), pero en TypeScript mantenemos "DUEÑO" para mejor UX
export type UserRole = 'DUENO' | 'ENCARGADO' | 'LAVADOR'

// Estados de Orden de Trabajo
export type OTEstado = 'EN_COLA' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO'

// Tipo de vehículo
export type TipoVehiculo = 'chico' | 'mediano' | 'camioneta'

// Medio de pago
export type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA'

// Estado de comisión
export type ComisionEstado = 'PENDIENTE' | 'LIQUIDADA'

// Usuario
export interface Usuario {
  id: string
  nombre: string
  usuario: string
  rol: UserRole
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// Servicio
export interface Servicio {
  id: string
  nombre: string
  precio: number
  duracionEstimada?: number // en minutos
  tipoVehiculo?: TipoVehiculo
  activo: boolean
  descripcion?: string
  createdAt: Date
  updatedAt: Date
}

// Extra
export interface Extra {
  id: string
  nombre: string
  precio: number
  duracionEstimada?: number // en minutos
  activo: boolean
  descripcion?: string
  createdAt: Date
  updatedAt: Date
}

// Orden de Trabajo (OT)
export interface OrdenTrabajo {
  id: string
  fechaIngreso: Date
  patente: string // Obligatorio ahora
  tipoVehiculo?: TipoVehiculo // Opcional ahora
  descripcionVehiculo?: string
  nombreCliente?: string // Nuevo: nombre del cliente (opcional en BD temporalmente para migración)
  telefonoCliente?: string // Nuevo: teléfono del cliente (opcional en BD temporalmente para migración)
  horarioDeseado?: Date // Nuevo: horario en que quiere tenerlo listo
  servicioId: string
  servicio: Servicio
  extrasIds: string[]
  extras: Extra[]
  empleadosIds: string[]
  empleados: Usuario[]
  observaciones?: string
  estado: OTEstado
  total: number
  precioAjustado?: number // si se ajusta manualmente
  justificacionPrecio?: string
  usuarioCreadorId: string
  usuarioCreador: Usuario
  createdAt: Date
  updatedAt: Date
}

// Historial de cambios de estado
export interface EstadoHistorial {
  id: string
  otId: string
  estadoAnterior: OTEstado
  estadoNuevo: OTEstado
  usuarioId: string
  usuario: Usuario
  fechaHora: Date
}

// Pago
export interface Pago {
  id: string
  otId: string
  ot: OrdenTrabajo
  monto: number
  medioPago: MedioPago
  referencia?: string // para transferencias
  fechaHora: Date
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Cierre de Caja
export interface CierreCaja {
  id: string
  fechaDesde: Date
  fechaHasta: Date
  fechaCierre: Date
  totalEfectivo: number
  totalTransferencia: number
  totalGeneral: number
  otsIds: string[]
  ots: OrdenTrabajo[]
  observaciones?: string
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Comisión
export interface Comision {
  id: string
  otId: string
  ot: OrdenTrabajo
  empleadoId: string
  empleado: Usuario
  monto: number
  porcentaje: number
  estado: ComisionEstado
  fechaGeneracion: Date
  fechaLiquidacion?: Date
  usuarioLiquidacionId?: string
  createdAt: Date
}

// Liquidación de Comisiones
export interface LiquidacionComision {
  id: string
  empleadoId: string
  empleado: Usuario
  fechaDesde: Date
  fechaHasta: Date
  fechaLiquidacion: Date
  comisionesIds: string[]
  comisiones: Comision[]
  montoTotal: number
  usuarioId: string
  usuario: Usuario
  createdAt: Date
}

// Configuración de Comisiones
export interface ConfigComision {
  id: string
  empleadoId: string
  empleado: Usuario
  modelo: 'POR_ITEM' | 'POR_OT'
  porcentaje: number
  porcentajePorServicio?: Record<string, number> // servicioId -> porcentaje
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

// Log de Auditoría
export interface AuditoriaLog {
  id: string
  fechaHora: Date
  usuarioId: string
  usuario: Usuario
  accion: string
  entidad: string
  entidadId?: string
  datos: Record<string, unknown>
}

