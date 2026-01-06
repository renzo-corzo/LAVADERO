/**
 * Script para verificar la conexión a Neon y las tablas
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificar() {
  try {
    console.log('🔍 Verificando conexión a Neon...')
    
    // Verificar conexión
    await prisma.$connect()
    console.log('✅ Conexión exitosa a Neon!')
    
    // Verificar si existe la tabla Usuario
    const usuarios = await prisma.usuario.count()
    console.log(`📊 Usuarios encontrados: ${usuarios}`)
    
    if (usuarios === 0) {
      console.log('⚠️  No hay usuarios en la base de datos.')
      console.log('💡 Ejecuta: npm run db:seed')
    } else {
      // Listar usuarios
      const usuariosLista = await prisma.usuario.findMany({
        select: {
          usuario: true,
          nombre: true,
          rol: true,
          activo: true,
        },
      })
      console.log('\n📋 Usuarios en la base de datos:')
      usuariosLista.forEach(u => {
        console.log(`   - ${u.usuario} (${u.nombre}) - Rol: ${u.rol} - Activo: ${u.activo}`)
      })
    }
    
    // Verificar servicios
    const servicios = await prisma.servicio.count()
    console.log(`\n📊 Servicios encontrados: ${servicios}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('P1001')) {
      console.error('   No se puede conectar a la base de datos.')
      console.error('   Verifica que DATABASE_URL esté correcta en .env')
    } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.error('   Las tablas no existen.')
      console.error('   Ejecuta: npx prisma db push')
    }
  } finally {
    await prisma.$disconnect()
  }
}

verificar()




