/**
 * Script de seed para datos iniciales
 * Ejecutar con: npm run db:seed
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Hashear contraseña por defecto: "admin123"
  const hashedPassword = await hash('admin123', 10)

  // Crear usuario DUEÑO por defecto
  const dueno = await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      usuario: 'admin',
      password: hashedPassword,
      rol: UserRole.DUENO,
      activo: true,
    },
  })

  console.log('✅ Usuario admin creado:')
  console.log('   Usuario: admin')
  console.log('   Contraseña: admin123')
  console.log('   ⚠️  IMPORTANTE: Cambiar la contraseña después del primer login')

  // Crear servicios de ejemplo
  const servicios = await Promise.all([
    prisma.servicio.upsert({
      where: { nombre: 'Lavado Básico' },
      update: {},
      create: {
        nombre: 'Lavado Básico',
        precio: 1500,
        duracionEstimada: 30,
        tipoVehiculo: 'chico',
        activo: true,
        descripcion: 'Lavado básico exterior del vehículo',
      },
    }),
    prisma.servicio.upsert({
      where: { nombre: 'Lavado Completo' },
      update: {},
      create: {
        nombre: 'Lavado Completo',
        precio: 2500,
        duracionEstimada: 60,
        tipoVehiculo: 'chico',
        activo: true,
        descripcion: 'Lavado completo exterior e interior',
      },
    }),
    prisma.servicio.upsert({
      where: { nombre: 'Lavado Premium' },
      update: {},
      create: {
        nombre: 'Lavado Premium',
        precio: 3500,
        duracionEstimada: 90,
        tipoVehiculo: 'chico',
        activo: true,
        descripcion: 'Lavado premium con encerado incluido',
      },
    }),
  ])

  console.log('✅ Servicios creados:', servicios.length)

  // Crear usuario ENCARGADO de ejemplo
  const encargadoPassword = await hash('encargado123', 10)
  const encargado = await prisma.usuario.upsert({
    where: { usuario: 'encargado' },
    update: {},
    create: {
      nombre: 'Encargado Ejemplo',
      usuario: 'encargado',
      password: encargadoPassword,
      rol: UserRole.ENCARGADO,
      activo: true,
    },
  })
  console.log('✅ Usuario encargado creado (usuario: encargado, contraseña: encargado123)')

  // Crear usuario LAVADOR de ejemplo
  const lavadorPassword = await hash('lavador123', 10)
  const lavador = await prisma.usuario.upsert({
    where: { usuario: 'lavador' },
    update: {},
    create: {
      nombre: 'Lavador Ejemplo',
      usuario: 'lavador',
      password: lavadorPassword,
      rol: UserRole.LAVADOR,
      activo: true,
    },
  })
  console.log('✅ Usuario lavador creado (usuario: lavador, contraseña: lavador123)')

  // Crear extras de ejemplo
  const extras = await Promise.all([
    prisma.extra.upsert({
      where: { nombre: 'Aspirado Motor' },
      update: {},
      create: {
        nombre: 'Aspirado Motor',
        precio: 800,
        duracionEstimada: 20,
        activo: true,
        descripcion: 'Aspirado completo del compartimento del motor',
      },
    }),
    prisma.extra.upsert({
      where: { nombre: 'Limpieza de Tapizados' },
      update: {},
      create: {
        nombre: 'Limpieza de Tapizados',
        precio: 1200,
        duracionEstimada: 30,
        activo: true,
        descripcion: 'Limpieza profunda de tapizados',
      },
    }),
    prisma.extra.upsert({
      where: { nombre: 'Encerado' },
      update: {},
      create: {
        nombre: 'Encerado',
        precio: 1500,
        duracionEstimada: 45,
        activo: true,
        descripcion: 'Encerado profesional del vehículo',
      },
    }),
  ])

  console.log('✅ Extras creados:', extras.length)

  console.log('✅ Seed completado!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

