/**
 * Script para crear una OT de ejemplo
 * Ejecutar con: tsx prisma/seed-ot-ejemplo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando OT de ejemplo...')

  // Obtener datos necesarios
  const admin = await prisma.usuario.findUnique({
    where: { usuario: 'admin' },
  })

  const encargado = await prisma.usuario.findUnique({
    where: { usuario: 'encargado' },
  })

  const servicio = await prisma.servicio.findFirst({
    where: { activo: true },
  })

  const extras = await prisma.extra.findMany({
    where: { activo: true },
    take: 2,
  })

  if (!admin || !servicio) {
    console.error('❌ No se encontraron datos necesarios. Ejecuta primero: npm run db:seed')
    return
  }

  // Sucursal para la OT de ejemplo (la primera activa, ej. "Principal")
  const sucursal = await prisma.sucursal.findFirst({ where: { activo: true } })
  if (!sucursal) {
    console.error('❌ No hay sucursales. Aplicá las migraciones primero.')
    return
  }

  // Calcular total
  let total = Number(servicio.precio)
  extras.forEach((extra) => {
    total += Number(extra.precio)
  })

  // Crear OT de ejemplo
  const ot = await prisma.$transaction(async (tx) => {
    const nuevaOT = await tx.ordenTrabajo.create({
      data: {
        fechaIngreso: new Date(),
        patente: 'ABC123',
        tipoVehiculo: 'chico',
        descripcionVehiculo: 'Auto rojo, modelo 2020',
        sucursalId: sucursal.id,
        servicioId: servicio.id,
        observaciones: 'OT de ejemplo para prueba',
        estado: 'EN_COLA',
        total,
        usuarioCreadorId: admin.id,
        empleados: {
          create: encargado
            ? [{ empleadoId: encargado.id }]
            : [{ empleadoId: admin.id }],
        },
        extras: {
          create: extras.map((extra) => ({
            extraId: extra.id,
          })),
        },
      },
      include: {
        servicio: true,
        extras: {
          include: {
            extra: true,
          },
        },
        empleados: {
          include: {
            empleado: true,
          },
        },
      },
    })

    // Registrar cambio de estado inicial
    await tx.estadoHistorial.create({
      data: {
        ordenTrabajoId: nuevaOT.id,
        estadoAnterior: 'EN_COLA',
        estadoNuevo: 'EN_COLA',
        usuarioId: admin.id,
        fechaHora: new Date(),
      },
    })

    // Registrar en auditoría
    await tx.auditoriaLog.create({
      data: {
        usuarioId: admin.id,
        accion: 'OT_CREATED',
        entidad: 'OrdenTrabajo',
        entidadId: nuevaOT.id,
        datos: JSON.stringify({
          patente: 'ABC123',
          tipoVehiculo: 'chico',
          servicioId: servicio.id,
          total,
        }),
      },
    })

    return nuevaOT
  })

  console.log('✅ OT de ejemplo creada:')
  console.log(`   ID: ${ot.id}`)
  console.log(`   Patente: ABC123`)
  console.log(`   Estado: EN_COLA`)
  console.log(`   Total: ${total}`)
  console.log(`\n💡 Ahora puedes verla en el Tablero y Dashboard`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

