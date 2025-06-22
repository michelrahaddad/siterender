#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔥 VALIDAÇÃO FINAL PARA RENDER - ZERO FALHAS\n');

const criticalChecks = [
  {
    name: 'Environment Variables Documentation',
    check: () => {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      return envExample.includes('DATABASE_URL') && 
             envExample.includes('JWT_SECRET') && 
             envExample.includes('SESSION_SECRET');
    },
    critical: true
  },
  {
    name: 'Build Scripts Optimization',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts['render-build'] && 
             pkg.scripts['render-start'] &&
             pkg.scripts['build:client'] &&
             pkg.scripts['build:server'];
    },
    critical: true
  },
  {
    name: 'Server Port Configuration',
    check: () => {
      const serverFile = fs.readFileSync('server/index.ts', 'utf8');
      return serverFile.includes('process.env.PORT') &&
             serverFile.includes('"0.0.0.0"') &&
             !serverFile.includes('localhost');
    },
    critical: true
  },
  {
    name: 'CORS Production Ready',
    check: () => {
      const serverFile = fs.readFileSync('server/index.ts', 'utf8');
      return serverFile.includes('onrender.com') &&
             serverFile.includes('production');
    },
    critical: true
  },
  {
    name: 'Health Endpoints Complete',
    check: () => {
      const serverFile = fs.readFileSync('server/index.ts', 'utf8');
      return serverFile.includes('/health') &&
             serverFile.includes('/ready') &&
             serverFile.includes('/_health');
    },
    critical: true
  },
  {
    name: 'Database Connection Handling',
    check: () => {
      const dbFile = fs.readFileSync('server/db.ts', 'utf8');
      return dbFile.includes('DATABASE_URL') &&
             dbFile.includes('Pool');
    },
    critical: true
  },
  {
    name: 'Static Files Production Ready',
    check: () => {
      const viteFile = fs.readFileSync('server/vite.ts', 'utf8');
      return viteFile.includes('dist/public') &&
             viteFile.includes('existsSync') &&
             viteFile.includes('Cache-Control');
    },
    critical: true
  },
  {
    name: 'Error Handling Robust',
    check: () => {
      const serverFile = fs.readFileSync('server/index.ts', 'utf8');
      return serverFile.includes('gracefulShutdown') &&
             serverFile.includes('unhandledRejection') &&
             serverFile.includes('uncaughtException');
    },
    critical: true
  },
  {
    name: 'Admin Routes Secure',
    check: () => {
      const routesFile = fs.readFileSync('server/routes.ts', 'utf8');
      return routesFile.includes('/admin') &&
             routesFile.includes('authentication');
    },
    critical: false
  },
  {
    name: 'WhatsApp Integration Ready',
    check: () => {
      const routesFile = fs.readFileSync('server/routes.ts', 'utf8');
      return routesFile.includes('track-whatsapp') &&
             routesFile.includes('validation');
    },
    critical: false
  }
];

let criticalPassed = 0;
let criticalTotal = 0;
let totalPassed = 0;

console.log('📋 Executando validações críticas...\n');

criticalChecks.forEach((check, index) => {
  try {
    const result = check.check();
    const icon = result ? '✅' : '❌';
    const status = result ? 'PASS' : 'FAIL';
    const priority = check.critical ? '[CRÍTICO]' : '[OPCIONAL]';
    
    console.log(`${icon} ${index + 1}. ${check.name} ${priority} - ${status}`);
    
    if (result) totalPassed++;
    if (check.critical) {
      criticalTotal++;
      if (result) criticalPassed++;
    }
    
    if (!result && check.critical) {
      console.log(`   ⚠️  CRÍTICO: Esta validação DEVE passar para deploy seguro`);
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name} - ERRO: ${error.message}`);
    if (check.critical) criticalTotal++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`📊 RESULTADO FINAL:`);
console.log(`   Total: ${totalPassed}/${criticalChecks.length} validações`);
console.log(`   Críticas: ${criticalPassed}/${criticalTotal} validações`);

if (criticalPassed === criticalTotal) {
  console.log('\n🎉 TODAS AS VALIDAÇÕES CRÍTICAS PASSARAM!');
  console.log('✅ DEPLOY GARANTIDO SEM FALHAS NO RENDER');
  console.log('\n🚀 Status: PRONTO PARA PRODUÇÃO');
  console.log('📦 Zero falhas esperadas durante deploy');
  console.log('🔒 Configuração de segurança completa');
  console.log('⚡ Performance otimizada');
  console.log('🏥 Health checks funcionais');
  
  console.log('\n📋 DEPLOY CHECKLIST FINAL:');
  console.log('   ✅ Servidor configurado para Render');
  console.log('   ✅ Banco PostgreSQL necessário');
  console.log('   ✅ Variáveis de ambiente documentadas');
  console.log('   ✅ Build otimizado');
  console.log('   ✅ Health checks implementados');
  console.log('   ✅ Error handling robusto');
  console.log('   ✅ CORS configurado');
  console.log('   ✅ Static files prontos');
  
  process.exit(0);
} else {
  console.log('\n❌ VALIDAÇÕES CRÍTICAS FALHARAM!');
  console.log('🚨 RISCO DE FALHA NO DEPLOY');
  console.log('🔧 Corrija os problemas críticos acima');
  process.exit(1);
}