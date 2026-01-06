/**
 * Utilidades para cálculo de comisiones
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
 * Calcula las comisiones para una OT cuando está ENTREGADA y PAGADA
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

  // Calcular comisiones por empleado
  const comisionesACrear: Array<{
    ordenTrabajoId: string
    empleadoId: string
    monto: number
    porcentaje: number
  }> = []

  for (const config of configs) {
    const porcentajePorServicio = config.porcentajePorServicio
      ? JSON.parse(config.porcentajePorServicio)
      : null

    let montoComision = 0

    if (config.modelo === 'POR_OT') {
      // Modelo B: Porcentaje sobre el total de la OT
      montoComision = (Number(ot.total) * config.porcentaje) / 100
    } else {
      // Modelo A: Por porcentaje por ítem (servicio y extras)
      // Comisión por servicio
      const porcentajeServicio =
        porcentajePorServicio?.[ot.servicio.id] || config.porcentaje
      montoComision += (Number(ot.servicio.precio) * porcentajeServicio) / 100

      // Comisión por extras
      for (const extraOt of ot.extras) {
        const porcentajeExtra =
          porcentajePorServicio?.[extraOt.extra.id] || config.porcentaje
        montoComision += (Number(extraOt.extra.precio) * porcentajeExtra) / 100
      }
    }

    // Dividir entre empleados si hay múltiples (equitativo)
    const montoPorEmpleado = montoComision / empleadosIds.length

    comisionesACrear.push({
      ordenTrabajoId: otId,
      empleadoId: config.empleadoId,
      monto: Math.round(montoPorEmpleado * 100) / 100, // Redondear a 2 decimales
      porcentaje: config.porcentaje,
    })
  }

  // Crear comisiones en una transacción
  if (comisionesACrear.length > 0) {
    await prisma.$transaction(
      comisionesACrear.map((comision) =>
        prisma.comision.create({
          data: comision,
        })
      )
    )

    console.log(
      `[comisiones] ✅ Comisiones calculadas para OT ${otId}: ${comisionesACrear.length} comisiones creadas`
    )
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




