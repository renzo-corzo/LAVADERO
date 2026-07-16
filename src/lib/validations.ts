/**
 * Schemas de validación con Zod
 * Para validar datos de entrada en API Routes
 */

import { z } from 'zod'

// Schema para crear/editar sucursal
export const crearSucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(60),
  direccion: z.string().max(200).nullish().transform((v) => (v === '' ? undefined : v)),
})

// Schema para crear empresa (plataforma ADMIN): empresa + sucursales + dueño
export const crearEmpresaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  sucursales: z
    .array(z.string().min(1, 'El nombre de la sucursal es obligatorio').max(60))
    .min(1, 'Debe crear al menos una sucursal'),
  dueno: z.object({
    nombre: z.string().min(1, 'El nombre del dueño es obligatorio'),
    usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }),
})

// Schema para crear OT
export const crearOTSchema = z.object({
  servicioId: z.string().min(1, 'El servicio es obligatorio'),
  extrasIds: z.array(z.string()).default([]),
  // Asignar lavador es opcional por ahora (empleados con sueldo fijo, sin comisiones)
  empleadosIds: z.array(z.string().min(1)).default([]),
  patente: z.string().min(1, 'La patente es obligatoria').max(10).trim(),
  tipoVehiculo: z.enum(['chico', 'mediano', 'camioneta']).nullish(),
  descripcionVehiculo: z.string().optional().or(z.literal('')),
  // Ruta relativa devuelta por /api/ots/foto (ej. /uploads/ots/xxxx.jpg)
  fotoUrl: z.string().nullish().transform((v) => (v === '' ? undefined : v)),
  nombreCliente: z.string().min(1, 'El nombre del cliente es obligatorio').trim(),
  telefonoCliente: z.string().min(1, 'El teléfono del cliente es obligatorio').trim(),
  // Para OTs externas (trabajo fuera del lavadero) el horario no es obligatorio
  horarioDeseado: z
    .union([z.string(), z.date(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val == null || val === '') return undefined
      if (typeof val === 'string') {
        const date = new Date(val)
        if (isNaN(date.getTime())) throw new Error('Fecha u hora inválida')
        return date
      }
      return val
    }),
  clienteId: z.string().nullish().transform((v) => (v === '' ? undefined : v)),
  // Sucursal donde se hace el trabajo. Si el usuario tiene sucursal asignada,
  // el servidor la fuerza; si no (DUEÑO/ADMIN), debe venir en el body.
  sucursalId: z.string().nullish().transform((v) => (v === '' ? undefined : v)),
  observaciones: z.string().optional().or(z.literal('')),
  precioAjustado: z.number().positive().nullish(),
  justificacionPrecio: z.string().nullish().transform((v) => (v === '' ? undefined : v)),
})

// Schema para editar OT: mismos campos que crear, pero el cliente y los
// empleados asignados no se modifican en la edición.
export const editarOTSchema = crearOTSchema.omit({
  empleadosIds: true,
  clienteId: true,
})

// Schema para cambiar estado de OT
export const cambiarEstadoOTSchema = z.object({
  nuevoEstado: z.enum(['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO']),
  motivo: z.string().nullish().transform((v) => (v == null || v === '' ? undefined : v)),
}).refine((data) => {
  // Si el estado es CANCELADO, el motivo es obligatorio
  if (data.nuevoEstado === 'CANCELADO' && (!data.motivo || !data.motivo.trim())) {
    return false
  }
  return true
}, {
  message: 'El motivo es obligatorio para cancelar una OT',
  path: ['motivo'],
})

// Schema para cambiar estado de OTs en lote (solo uso interno/tablero)
export const cambiarEstadoOTLoteSchema = z.object({
  otIds: z.array(z.string().min(1)).min(1, 'Debe seleccionar al menos una OT'),
  nuevoEstado: z.enum(['EN_COLA', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO']),
  motivo: z.string().nullish().transform((v) => (v == null || v === '' ? undefined : v)),
}).refine((data) => {
  // Si el estado es CANCELADO, el motivo es obligatorio
  if (data.nuevoEstado === 'CANCELADO' && (!data.motivo || !data.motivo.trim())) {
    return false
  }
  return true
}, {
  message: 'El motivo es obligatorio para cancelar una OT',
  path: ['motivo'],
})

// Schema para registrar pago (transferencia exige referencia no vacía)
export const registrarPagoSchema = z
  .object({
    ordenTrabajoId: z.string().min(1),
    monto: z.number().positive('El monto debe ser positivo'),
    medioPago: z.enum(['EFECTIVO', 'TRANSFERENCIA']),
    referencia: z.union([z.string(), z.null(), z.undefined()]).optional(),
  })
  .transform((data) => {
    const ref =
      data.referencia == null || data.referencia === ''
        ? null
        : String(data.referencia).trim() || null
    return { ...data, referencia: ref }
  })
  .superRefine((data, ctx) => {
    if (data.medioPago === 'TRANSFERENCIA' && !data.referencia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La referencia es obligatoria para pagos por transferencia (CBU, alias u número de operación).',
        path: ['referencia'],
      })
    }
  })

// La duración se carga en MINUTOS; tope sano para evitar errores de tipeo
// (ej. cargar el precio en el campo de duración bloqueaba todos los horarios).
const duracionMinutos = z
  .number()
  .int()
  .positive()
  .max(480, 'La duración se carga en minutos (máximo 480 = 8 horas)')

// Schema para crear servicio
export const crearServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  precio: z.number().positive('El precio debe ser positivo'),
  duracionEstimada: duracionMinutos.optional(),
  tipoVehiculo: z.enum(['chico', 'mediano', 'camioneta']).optional(),
  descripcion: z.string().optional(),
})

// Schema para crear extra
export const crearExtraSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  precio: z.number().positive('El precio debe ser positivo'),
  duracionEstimada: duracionMinutos.optional(),
  descripcion: z.string().optional(),
})

// Schema para crear cliente
export const crearClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['CONCESIONARIA', 'WALK_IN']).default('WALK_IN'),
  telefono: z.string().nullish().transform((v) => (v == null || v === '' ? undefined : v)),
  email: z
    .union([z.string().email(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v == null || v === '' ? undefined : v)),
  descuentoPorcentaje: z.number().min(0).max(100).nullish(),
  trabajoExterno: z.boolean().optional(),
  usaMontosFijos: z.boolean().optional(),
  montosFijosServicios: z.record(z.string(), z.number()).optional().nullable(),
  montosFijosExtras: z.record(z.string(), z.number()).optional().nullable(),
  prioridad: z.number().int().default(0),
  observaciones: z.string().nullish().transform((v) => (v == null || v === '' ? undefined : v)),
})

// Schema para crear usuario
export const crearUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'DUENO', 'ENCARGADO', 'LAVADOR', 'CLIENTE']),
  // Sucursal del empleado (ENCARGADO/LAVADOR); ADMIN/DUENO sin sucursal = todas
  sucursalId: z.string().nullish().transform((v) => (v === '' ? undefined : v)),
})

// Schema para configurar comisión
export const configComisionSchema = z.object({
  empleadoId: z.string().min(1),
  modelo: z.enum(['POR_ITEM', 'POR_OT']).default('POR_ITEM'),
  porcentaje: z.number().min(0).max(100, 'El porcentaje no puede ser mayor a 100'),
  porcentajePorServicio: z.record(z.string(), z.number()).optional(),
  activo: z.boolean().default(true),
})

// Acepta fecha simple (YYYY-MM-DD de <input type="date">), datetime ISO o Date.
const fechaFlexible = z
  .union([z.string().min(1), z.date()])
  .refine((v) => !isNaN(new Date(v).getTime()), 'Fecha inválida')

// Schema para liquidar comisiones
export const liquidarComisionesSchema = z.object({
  empleadoId: z.string().min(1),
  fechaDesde: fechaFlexible,
  fechaHasta: fechaFlexible,
  comisionesIds: z.array(z.string().min(1)).min(1, 'Debe seleccionar al menos una comisión'),
})

// Schema para cierre de caja
export const cierreCajaSchema = z.object({
  fechaDesde: fechaFlexible,
  fechaHasta: fechaFlexible,
  otsIds: z.array(z.string()).min(1, 'Debe incluir al menos una OT'),
  observaciones: z.string().optional(),
})
