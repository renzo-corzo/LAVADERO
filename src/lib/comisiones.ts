/**
 * Utilidades para cálculo de comisiones
 * Refactorizado con lógica encapsulada y transacciones atómicas mejoradas
 */

import { prisma } from '@/lib/db/client'

interface ConfigComision {
  id: string
  empleadoId: string
  modelo: 'POR_ITEM' | 'POR_OT'
  porcentaje: number
  porcentajePorServicio?: Record<string, number> | null
  activo: boolean
}

interface OrdenTrabajoConDetalle {
  id: string
  total: number
  servicio: {
    id: string
    precio: number
  }
  extras: Array<{
    extra: {
      id: string
      precio: number
    }
  }>
  empleados: Array<{
    empleadoId: string
  }>
}

/**
 * Calcula el monto de comisión para un empleado (función pura, testeable)
 * @param config - Configuración de comisión del empleado
 * @param totalOT - Total de la orden de trabajo
 * @param precioServicio - Precio del servicio
 * @param extras - Array con precios de extras
 * @param cantidadEmpleados - Cantidad de empleados asignados (para dividir equitativamente)
 * @returns Monto de comisión para el empleado
 */
export function calcularMontoComision(
  config: ConfigComision,
  totalOT: number,
  precioServicio: number,
  extras: Array<{ precio: number; id: string }>,
  cantidadEmpleados: number
): number {
  const porcentajePorServicio = config.porcentajePorServicio
    ? (typeof config.porcentajePorServicio === 'string'
        ? JSON.parse(config.porcentajePorServicio)
        : config.porcentajePorServicio)
    : null

  let montoComision = 0

  if (config.modelo === 'POR_OT') {
    // Modelo B: Porcentaje sobre el total de la OT
    montoComision = (totalOT * config.porcentaje) / 100
  } else {
    // Modelo A: Por porcentaje por ítem (servicio y extras)
    // Comisión por servicio
    const porcentajeServicio =
      porcentajePorServicio?.[config.empleadoId] || config.porcentaje
    montoComision += (precioServicio * porcentajeServicio) / 100

    // Comisión por extras
    for (const extra of extras) {
      const porcentajeExtra =
        porcentajePorServicio?.[extra.id] || config.porcentaje
      montoComision += (extra.precio * porcentajeExtra) / 100
    }
  }

  // Dividir entre empleados si hay múltiples (equitativo)
  const montoPorEmpleado = montoComision / cantidadEmpleados

  // Redondear a 2 decimales
  return Math.round(montoPorEmpleado * 100) / 100
}

/**
 * Calcula las comisiones para una OT cuando está ENTREGADA y PAGADA
 * Usa transacciones atómicas mejoradas
 */
export async function calcularComisiones(otId: string): Promise<void> {
  // Verificar que no haya comisiones ya calculadas para esta OT
  const comisionesExistentes = await prisma.comision.findMany({
    where: { ordenTrabajoId: otId },
  })

  if (comisionesExistentes.length > 0) {
    console.log(`[comisiones] Ya existen comisiones para OT ${otId}, no se recalculan`)
    return
  }

  // Obtener OT con detalles
  const ot = await prisma.ordenTrabajo.findUnique({
    where: { id: otId },
    include: {
      servicio: true,
      extras: { include: { extra: true } },
      empleados: true,
      pagos: true,
    },
  })

  if (!ot) {
    throw new Error(`OT ${otId} no encontrada`)
  }

  // Verificar que esté ENTREGADA
  if (ot.estado !== 'ENTREGADO') {
    console.log(`[comisiones] OT ${otId} no está ENTREGADA, estado: ${ot.estado}`)
    return
  }

  // Verificar que esté completamente PAGADA
  const totalPagado = ot.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0)
  if (totalPagado < Number(ot.total)) {
    console.log(
      `[comisiones] OT ${otId} no está completamente pagada. Total: ${ot.total}, Pagado: ${totalPagado}`
    )
    return
  }

  // Obtener empleados asignados
  const empleadosIds = ot.empleados.map((e) => e.empleadoId)
  if (empleadosIds.length === 0) {
    console.log(`[comisiones] OT ${otId} no tiene empleados asignados`)
    return
  }

  // Obtener configuraciones de comisiones para los empleados
  const configs = await prisma.configComision.findMany({
    where: {
      empleadoId: { in: empleadosIds },
      activo: true,
    },
  })

  if (configs.length === 0) {
    console.log(`[comisiones] No hay configuraciones activas para los empleados de OT ${otId}`)
    return
  }

  // Preparar datos para cálculo
  const totalOT = Number(ot.total)
  const precioServicio = Number(ot.servicio.precio)
  const extras = ot.extras.map((e) => ({
    id: e.extra.id,
    precio: Number(e.extra.precio),
  }))
  const cantidadEmpleados = empleadosIds.length

  // Calcular comisiones por empleado usando función pura
  const comisionesACrear = configs.map((config) => {
    const monto = calcularMontoComision(
      config,
      totalOT,
      precioServicio,
      extras,
      cantidadEmpleados
    )

    return {
      ordenTrabajoId: otId,
      empleadoId: config.empleadoId,
      monto,
      porcentaje: config.porcentaje,
    }
  })

  // Crear comisiones en una transacción atómica
  // Si falla alguna, no se crea ninguna (integridad total)
  if (comisionesACrear.length > 0) {
    try {
      await prisma.$transaction(
        comisionesACrear.map((comision) =>
          prisma.comision.create({
            data: comision,
          })
        ),
        {
          maxWait: 5000, // Máximo 5 segundos de espera
          timeout: 10000, // Timeout de 10 segundos
        }
      )

      console.log(
        `[comisiones] ✅ Comisiones calculadas para OT ${otId}: ${comisionesACrear.length} comisiones creadas`
      )
    } catch (error) {
      console.error(`[comisiones] ❌ Error en transacción para OT ${otId}:`, error)
      throw error // Relanzar para que se maneje arriba
    }
  }
}

/**
 * Verifica y calcula comisiones si corresponde
 * Se llama después de registrar un pago o cambiar estado a ENTREGADO
 */
export async function verificarYCalcularComisiones(otId: string): Promise<void> {
  try {
    await calcularComisiones(otId)
  } catch (error) {
    console.error(`[comisiones] Error al calcular comisiones para OT ${otId}:`, error)
    // No lanzamos el error para que no afecte el flujo principal
  }
}





