/**
 * Seed de la empresa DEMO para presentaciones a clientes.
 * Idempotente / reseteable: si "Lavadero Demo" ya existe, borra TODOS sus datos
 * (aislados por multi-tenant) y la vuelve a crear fresca.
 *
 * Correr con:
 *   DATABASE_URL="<prod>" npx tsx prisma/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
const NOMBRE_EMPRESA = 'Lavadero Demo'

async function main() {
  // ---- RESET: borrar los datos de la demo si ya existe ----
  const existente = await prisma.empresa.findUnique({ where: { nombre: NOMBRE_EMPRESA } })
  if (existente) {
    const eid = existente.id
    console.log('Demo existente -> reseteando...')
    await prisma.gastoCierre.deleteMany({ where: { cierreCaja: { empresaId: eid } } })
    await prisma.cierreCajaOT.deleteMany({ where: { cierreCaja: { empresaId: eid } } })
    await prisma.cierreCaja.deleteMany({ where: { empresaId: eid } })
    await prisma.pago.deleteMany({ where: { ordenTrabajo: { empresaId: eid } } })
    await prisma.estadoHistorial.deleteMany({ where: { ordenTrabajo: { empresaId: eid } } })
    await prisma.ordenTrabajoExtra.deleteMany({ where: { ordenTrabajo: { empresaId: eid } } })
    await prisma.ordenTrabajoEmpleado.deleteMany({ where: { ordenTrabajo: { empresaId: eid } } })
    await prisma.movimientoStock.deleteMany({ where: { empresaId: eid } })
    await prisma.recetaInsumo.deleteMany({ where: { empresaId: eid } })
    await prisma.ordenTrabajo.deleteMany({ where: { empresaId: eid } })
    await prisma.productoStock.deleteMany({ where: { empresaId: eid } })
    await prisma.extra.deleteMany({ where: { empresaId: eid } })
    await prisma.servicio.deleteMany({ where: { empresaId: eid } })
    await prisma.cliente.deleteMany({ where: { empresaId: eid } })
    await prisma.usuario.deleteMany({ where: { empresaId: eid } })
    await prisma.sucursal.deleteMany({ where: { empresaId: eid } })
    await prisma.empresa.delete({ where: { id: eid } })
  }

  // ---- Empresa + sucursal ----
  const empresa = await prisma.empresa.create({ data: { nombre: NOMBRE_EMPRESA, activo: true } })
  const suc = await prisma.sucursal.create({
    data: { empresaId: empresa.id, nombre: 'Principal', activo: true },
  })

  // ---- Usuarios ----
  const pass = await hash('demo2026', 10)
  const dueno = await prisma.usuario.create({
    data: { nombre: 'Dueno Demo', usuario: 'demo', password: pass, rol: 'DUENO', empresaId: empresa.id, activo: true },
  })
  await prisma.usuario.create({
    data: { nombre: 'Encargado Demo', usuario: 'demo-encargado', password: pass, rol: 'ENCARGADO', empresaId: empresa.id, sucursalId: suc.id, activo: true },
  })

  // ---- Servicios ----
  const mkServ = (nombre: string, precio: number, dur: number) =>
    prisma.servicio.create({
      data: { empresaId: empresa.id, sucursalId: suc.id, nombre, precio, duracionEstimada: dur, tipoVehiculo: 'chico', activo: true },
    })
  const s1 = await mkServ('Lavado Simple', 8000, 30)
  const s2 = await mkServ('Lavado Completo', 12000, 50)
  const s3 = await mkServ('Lavado Premium con cera', 18000, 80)
  const s4 = await mkServ('Detailing interior', 25000, 120)

  // ---- Extras ----
  await prisma.extra.create({ data: { empresaId: empresa.id, sucursalId: suc.id, nombre: 'Aspirado profundo', precio: 3000, activo: true } })
  await prisma.extra.create({ data: { empresaId: empresa.id, sucursalId: suc.id, nombre: 'Pulido de opticas', precio: 5000, activo: true } })

  // ---- Cliente concesionaria ----
  await prisma.cliente.create({
    data: { empresaId: empresa.id, nombre: 'Concesionaria del Sol', tipo: 'CONCESIONARIA', telefono: '3510000000', descuentoPorcentaje: 10, activo: true },
  })

  // ---- Stock ----
  const mkProd = (nombre: string, unidad: string, stock: number, min: number, costo: number) =>
    prisma.productoStock.create({
      data: { empresaId: empresa.id, sucursalId: suc.id, nombre, unidad, stockActual: stock, stockMinimo: min, costoUnitario: costo },
    })
  await mkProd('Shampoo para autos', 'L', 12, 5, 4500)
  await mkProd('Cera liquida', 'L', 3, 4, 9000) // bajo minimo -> alerta
  await mkProd('Esponjas', 'unidad', 20, 8, 600)

  // ---- OTs realistas ----
  const hoy = new Date()
  const enHoraHoy = (h: number, m: number) => { const d = new Date(hoy); d.setHours(h, m, 0, 0); return d }
  const diasAtras = (n: number, h = 11) => { const d = new Date(hoy); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d }

  let creadas = 0
  const mkOT = async (o: {
    patente: string; nombre: string; tel: string; serv: string; estado: any;
    fecha: Date; horario?: Date | null; total: number; pagado?: number; medio?: any
  }) => {
    const ot = await prisma.ordenTrabajo.create({
      data: {
        empresaId: empresa.id, sucursalId: suc.id, servicioId: o.serv,
        patente: o.patente, nombreCliente: o.nombre, telefonoCliente: o.tel,
        estado: o.estado, total: o.total, usuarioCreadorId: dueno.id, esExterna: false,
        fechaIngreso: o.fecha, horarioDeseado: o.horario ?? null,
      },
    })
    if (o.pagado && o.pagado > 0) {
      await prisma.pago.create({
        data: { ordenTrabajoId: ot.id, monto: o.pagado, medioPago: o.medio || 'EFECTIVO', fechaHora: o.fecha, usuarioId: dueno.id },
      })
    }
    creadas++
  }

  // Hoy: en cola / en proceso / listo
  await mkOT({ patente: 'AB123CD', nombre: 'Juan Perez', tel: '3511111111', serv: s1.id, estado: 'EN_COLA', fecha: enHoraHoy(9, 10), horario: enHoraHoy(11, 0), total: 8000 })
  await mkOT({ patente: 'AC456EF', nombre: 'Maria Lopez', tel: '3512222222', serv: s2.id, estado: 'EN_COLA', fecha: enHoraHoy(9, 25), horario: enHoraHoy(12, 30), total: 12000 })
  await mkOT({ patente: 'AD789GH', nombre: 'Carlos Ruiz', tel: '3513333333', serv: s3.id, estado: 'EN_PROCESO', fecha: enHoraHoy(8, 40), horario: enHoraHoy(11, 30), total: 18000 })
  await mkOT({ patente: 'AE012IJ', nombre: 'Ana Gomez', tel: '3514444444', serv: s4.id, estado: 'EN_PROCESO', fecha: enHoraHoy(8, 55), horario: enHoraHoy(13, 0), total: 25000 })
  await mkOT({ patente: 'AF345KL', nombre: 'Diego Sosa', tel: '3515555555', serv: s2.id, estado: 'LISTO', fecha: enHoraHoy(8, 5), horario: enHoraHoy(10, 30), total: 12000 })
  await mkOT({ patente: 'AG678MN', nombre: 'Lucia Diaz', tel: '3516666666', serv: s1.id, estado: 'LISTO', fecha: enHoraHoy(8, 15), horario: enHoraHoy(10, 45), total: 8000 })

  // Hoy: entregadas y cobradas (caja del dia)
  await mkOT({ patente: 'AH901OP', nombre: 'Pedro Nunez', tel: '3517777777', serv: s3.id, estado: 'ENTREGADO', fecha: enHoraHoy(7, 50), total: 18000, pagado: 18000, medio: 'EFECTIVO' })
  await mkOT({ patente: 'AI234QR', nombre: 'Sofia Torres', tel: '3518888888', serv: s2.id, estado: 'ENTREGADO', fecha: enHoraHoy(8, 30), total: 12000, pagado: 12000, medio: 'TRANSFERENCIA' })

  // Dias anteriores: entregadas y cobradas (reportes)
  await mkOT({ patente: 'AJ567ST', nombre: 'Marcos Vega', tel: '3519999999', serv: s1.id, estado: 'ENTREGADO', fecha: diasAtras(1), total: 8000, pagado: 8000 })
  await mkOT({ patente: 'AK890UV', nombre: 'Valentina Rios', tel: '3510101010', serv: s4.id, estado: 'ENTREGADO', fecha: diasAtras(2), total: 25000, pagado: 25000, medio: 'TRANSFERENCIA' })
  await mkOT({ patente: 'AL123WX', nombre: 'Tomas Herrera', tel: '3510202020', serv: s3.id, estado: 'ENTREGADO', fecha: diasAtras(3), total: 18000, pagado: 18000 })

  console.log('\n=== DEMO LISTA ===')
  console.log('Empresa: ' + empresa.nombre)
  console.log('Usuario: demo  /  demo2026   (dueno)')
  console.log('Extra:   demo-encargado / demo2026 (encargado)')
  console.log('OTs: ' + creadas + ' | Servicios: 4 | Extras: 2 | Stock: 3')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
