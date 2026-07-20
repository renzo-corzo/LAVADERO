/**
 * Script de seed para datos iniciales
 * Ejecutar con: npm run db:seed
 */

import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// El seed crea credenciales conocidas: NUNCA debe correr contra producción.
if (process.env.NODE_ENV === 'production') {
  console.error('❌ El seed está deshabilitado con NODE_ENV=production. Aborta.')
  process.exit(1)
}

/**
 * Resuelve la contraseña de un usuario seed.
 * Prioriza la variable de entorno; si no existe usa un default solo apto para desarrollo local.
 */
function resolveSeedPassword(envVar: string, fallback: string): string {
  const fromEnv = process.env[envVar]?.trim()
  if (fromEnv) return fromEnv
  console.warn(
    `⚠️  ${envVar} no definida: usando contraseña por defecto solo para desarrollo local. ` +
      `Definí ${envVar} en tu .env para una clave propia.`
  )
  return fallback
}

async function main() {
  console.log('🌱 Iniciando seed...')

  // Empresa por defecto (la migración crea "Mi Lavadero"; por si acaso, upsert)
  const empresa = await prisma.empresa.upsert({
    where: { nombre: 'Mi Lavadero' },
    update: {},
    create: { id: 'emp_default', nombre: 'Mi Lavadero', activo: true },
  })
  console.log('✅ Empresa por defecto:', empresa.nombre)

  // Sucursal por defecto (la migración crea "Principal"; por si acaso, upsert)
  const sucursal = await prisma.sucursal.upsert({
    where: { empresaId_nombre: { empresaId: empresa.id, nombre: 'Principal' } },
    update: {},
    create: { id: 'suc_principal', empresaId: empresa.id, nombre: 'Principal', activo: true },
  })
  console.log('✅ Sucursal por defecto:', sucursal.nombre)

  const adminPassword = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'admin123')
  const hashedPassword = await hash(adminPassword, 10)

  // Crear usuario ADMIN de plataforma (sin empresa: ve todo)
  await prisma.usuario.upsert({
    where: { usuario: 'superadmin' },
    update: {},
    create: {
      nombre: 'Admin Plataforma',
      usuario: 'superadmin',
      password: hashedPassword,
      rol: UserRole.ADMIN,
      empresaId: null,
      activo: true,
    },
  })
  console.log('✅ Usuario superadmin (ADMIN de plataforma) creado')

  // Crear usuario DUEÑO por defecto (de la empresa por defecto)
  await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      usuario: 'admin',
      password: hashedPassword,
      rol: UserRole.DUENO,
      empresaId: empresa.id,
      activo: true,
    },
  })

  console.log('✅ Usuario admin creado (usuario: admin)')
  console.log('   ⚠️  Cambiá la contraseña después del primer login')

  // Crear servicios de ejemplo
  const servicios = await Promise.all([
    prisma.servicio.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Lavado Básico' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        nombre: 'Lavado Básico',
        precio: 1500,
        duracionEstimada: 30,
        tipoVehiculo: 'chico',
        activo: true,
        descripcion: 'Lavado básico exterior del vehículo',
      },
    }),
    prisma.servicio.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Lavado Completo' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        nombre: 'Lavado Completo',
        precio: 2500,
        duracionEstimada: 60,
        tipoVehiculo: 'chico',
        activo: true,
        descripcion: 'Lavado completo exterior e interior',
      },
    }),
    prisma.servicio.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Lavado Premium' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
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
  const encargadoPassword = await hash(
    resolveSeedPassword('SEED_ENCARGADO_PASSWORD', 'encargado123'),
    10
  )
  await prisma.usuario.upsert({
    where: { usuario: 'encargado' },
    update: {},
    create: {
      nombre: 'Encargado Ejemplo',
      usuario: 'encargado',
      password: encargadoPassword,
      rol: UserRole.ENCARGADO,
      empresaId: empresa.id,
      sucursalId: sucursal.id,
      activo: true,
    },
  })
  console.log('✅ Usuario encargado creado (usuario: encargado)')

  // Crear usuario LAVADOR de ejemplo
  const lavadorPassword = await hash(
    resolveSeedPassword('SEED_LAVADOR_PASSWORD', 'lavador123'),
    10
  )
  await prisma.usuario.upsert({
    where: { usuario: 'lavador' },
    update: {},
    create: {
      nombre: 'Lavador Ejemplo',
      usuario: 'lavador',
      password: lavadorPassword,
      rol: UserRole.LAVADOR,
      empresaId: empresa.id,
      sucursalId: sucursal.id,
      activo: true,
    },
  })
  console.log('✅ Usuario lavador creado (usuario: lavador)')

  // Crear extras de ejemplo
  const extras = await Promise.all([
    prisma.extra.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Aspirado Motor' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        nombre: 'Aspirado Motor',
        precio: 800,
        duracionEstimada: 20,
        activo: true,
        descripcion: 'Aspirado completo del compartimento del motor',
      },
    }),
    prisma.extra.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Limpieza de Tapizados' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
        nombre: 'Limpieza de Tapizados',
        precio: 1200,
        duracionEstimada: 30,
        activo: true,
        descripcion: 'Limpieza profunda de tapizados',
      },
    }),
    prisma.extra.upsert({
      where: { empresaId_sucursalId_nombre: { empresaId: empresa.id, sucursalId: sucursal.id, nombre: 'Encerado' } },
      update: {},
      create: {
        empresaId: empresa.id,
        sucursalId: sucursal.id,
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
