/**
 * Script para probar el login directamente
 */

const { PrismaClient } = require('@prisma/client')
const { compare } = require('bcryptjs')
const prisma = new PrismaClient()

async function probarLogin() {
  try {
    console.log('🔍 Probando login...\n')
    
    const usuario = 'admin'
    const password = 'admin123'
    
    console.log(`Usuario: ${usuario}`)
    console.log(`Password: ${password}\n`)
    
    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { usuario: usuario },
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }
    
    console.log('✅ Usuario encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.nombre}`)
    console.log(`   Rol: ${user.rol}`)
    console.log(`   Activo: ${user.activo}`)
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`)
    console.log()
    
    // Verificar contraseña
    console.log('🔐 Verificando contraseña...')
    const isValid = await compare(password, user.password)
    
    if (isValid) {
      console.log('✅ Contraseña válida!')
    } else {
      console.log('❌ Contraseña incorrecta!')
      console.log('⚠️  El hash en la BD no coincide con la contraseña ingresada')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

probarLogin()





