import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db/client', () => ({ prisma: {} }))

import { hasPermission, hasEstadoTransitionPermission } from '@/lib/auth'
import { isValidEstadoTransition } from '@/lib/reglas-negocio'
import { calcularMontoComision } from '@/lib/comisiones'
import { registrarPagoSchema } from '@/lib/validations'

describe('hasPermission', () => {
  it('LAVADOR no puede crear OT ni pagos', () => {
    expect(hasPermission('LAVADOR', 'ot:create')).toBe(false)
    expect(hasPermission('LAVADOR', 'pago:create')).toBe(false)
    expect(hasPermission('LAVADOR', 'pago:view')).toBe(false)
  })
  it('LAVADOR puede avanzar cola hasta LISTO', () => {
    expect(hasPermission('LAVADOR', 'ot:change-state:process')).toBe(true)
    expect(hasPermission('LAVADOR', 'ot:change-state:ready')).toBe(true)
    expect(hasPermission('LAVADOR', 'ot:change-state:delivered')).toBe(false)
  })
  it('ENCARGADO puede entregar', () => {
    expect(hasPermission('ENCARGADO', 'ot:change-state:delivered')).toBe(true)
  })
})

describe('isValidEstadoTransition + permisos', () => {
  it('LAVADOR no puede LISTO -> ENTREGADO', () => {
    const r = isValidEstadoTransition('LISTO', 'ENTREGADO', 'LAVADOR')
    expect(r.valid).toBe(false)
  })
  it('ENCARGADO puede LISTO -> ENTREGADO', () => {
    const r = isValidEstadoTransition('LISTO', 'ENTREGADO', 'ENCARGADO')
    expect(r.valid).toBe(true)
  })
  it('hasEstadoTransitionPermission coherente con entrega', () => {
    expect(
      hasEstadoTransitionPermission('LAVADOR', 'LISTO', 'ENTREGADO')
    ).toBe(false)
    expect(
      hasEstadoTransitionPermission('ENCARGADO', 'LISTO', 'ENTREGADO')
    ).toBe(true)
  })
})

describe('calcularMontoComision porcentajePorServicio', () => {
  const config = {
    id: 'c1',
    empleadoId: 'emp-x',
    modelo: 'POR_ITEM' as const,
    porcentaje: 10,
    porcentajePorServicio: { srv1: 5, ext1: 8 } as Record<string, number>,
    activo: true,
  }

  it('usa servicioId para el servicio principal, no empleadoId', () => {
    const m = calcularMontoComision(
      config,
      'srv1',
      1000,
      100,
      [{ id: 'ext1', precio: 50 }],
      1
    )
    expect(m).toBeCloseTo(100 * 0.05 + 50 * 0.08, 5)
  })

  it('cae al porcentaje global si no hay clave de servicio', () => {
    const m = calcularMontoComision(
      { ...config, porcentajePorServicio: { ext1: 8 } },
      'srv1',
      1000,
      100,
      [{ id: 'ext1', precio: 50 }],
      1
    )
    expect(m).toBeCloseTo(100 * 0.1 + 50 * 0.08, 5)
  })
})

describe('registrarPagoSchema transferencia', () => {
  it('exige referencia en TRANSFERENCIA', () => {
    const bad = registrarPagoSchema.safeParse({
      ordenTrabajoId: 'ot1',
      monto: 10,
      medioPago: 'TRANSFERENCIA',
      referencia: null,
    })
    expect(bad.success).toBe(false)
    const ok = registrarPagoSchema.safeParse({
      ordenTrabajoId: 'ot1',
      monto: 10,
      medioPago: 'TRANSFERENCIA',
      referencia: 'TRX-1',
    })
    expect(ok.success).toBe(true)
  })
  it('EFECTIVO sin referencia OK', () => {
    const ok = registrarPagoSchema.safeParse({
      ordenTrabajoId: 'ot1',
      monto: 10,
      medioPago: 'EFECTIVO',
      referencia: null,
    })
    expect(ok.success).toBe(true)
  })
})
