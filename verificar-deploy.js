/**
 * Script para verificar el estado del deployment en Vercel
 * Ejecutar con: node verificar-deploy.js
 */

const https = require('https');

console.log('🔍 Verificando estado del deployment...\n');

// Información que necesitas completar:
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'YOUR_VERCEL_TOKEN';
const PROJECT_ID = 'prj_1wDehGWTe3PfqOZrJgrFKtqkHl0k'; // Del Deploy Hook que viste

if (VERCEL_TOKEN === 'YOUR_VERCEL_TOKEN') {
  console.log('⚠️  Necesitas configurar tu token de Vercel:');
  console.log('   1. Ve a: https://vercel.com/account/tokens');
  console.log('   2. Crea un token');
  console.log('   3. Ejecuta: $env:VERCEL_TOKEN="tu_token" ; node verificar-deploy.js\n');
  console.log('   O simplemente ve a Vercel Dashboard para verificar manualmente.\n');
  process.exit(1);
}

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/deployments?projectId=${PROJECT_ID}&limit=5`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.deployments && result.deployments.length > 0) {
        console.log('📊 Últimos deployments:\n');
        result.deployments.forEach((deploy, index) => {
          const status = deploy.readyState;
          const emoji = status === 'READY' ? '✅' : status === 'BUILDING' ? '⏳' : '❌';
          const date = new Date(deploy.createdAt).toLocaleString('es-AR');
          
          console.log(`${emoji} ${index + 1}. ${deploy.url || 'N/A'}`);
          console.log(`   Estado: ${status}`);
          console.log(`   Commit: ${deploy.meta?.githubCommitRef || deploy.meta?.gitlabCommitRef || 'N/A'}`);
          console.log(`   Fecha: ${date}`);
          console.log(`   ID: ${deploy.uid}\n`);
        });
      } else {
        console.log('❌ No se encontraron deployments');
      }
    } catch (error) {
      console.error('❌ Error al parsear respuesta:', error.message);
      console.log('Respuesta recibida:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la solicitud:', error.message);
});

req.end();




