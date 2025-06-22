#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Validando configuração para Render.com...\n');

const validations = [
  {
    name: 'Package.json engines',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.engines && pkg.engines.node && pkg.engines.npm;
    },
    fix: 'Adicionar engines no package.json'
  },
  {
    name: 'Scripts de build',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts['render-build'] && pkg.scripts['render-start'];
    },
    fix: 'Adicionar scripts render-build e render-start'
  },
  {
    name: 'Arquivo render.yaml',
    check: () => fs.existsSync('render.yaml'),
    fix: 'Criar arquivo render.yaml'
  },
  {
    name: 'Health check endpoint',
    check: () => {
      const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
      return serverIndex.includes('/health') && serverIndex.includes('healthCheck');
    },
    fix: 'Adicionar endpoint /health'
  },
  {
    name: 'Configuração de porta dinâmica',
    check: () => {
      const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
      return serverIndex.includes('process.env.PORT');
    },
    fix: 'Usar process.env.PORT para porta'
  },
  {
    name: 'Trust proxy configurado',
    check: () => {
      const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
      return serverIndex.includes('trust proxy');
    },
    fix: 'Configurar app.set("trust proxy", true)'
  },
  {
    name: 'CORS para Render',
    check: () => {
      const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
      return serverIndex.includes('onrender.com');
    },
    fix: 'Configurar CORS para domínios Render'
  },
  {
    name: 'Graceful shutdown',
    check: () => {
      const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
      return serverIndex.includes('SIGTERM') && serverIndex.includes('gracefulShutdown');
    },
    fix: 'Implementar graceful shutdown'
  },
  {
    name: 'Static files check',
    check: () => {
      const viteFile = fs.readFileSync('server/vite.ts', 'utf8');
      return viteFile.includes('existsSync') && viteFile.includes('dist/public');
    },
    fix: 'Verificar existência de arquivos estáticos'
  },
  {
    name: 'Environment variables example',
    check: () => fs.existsSync('.env.example'),
    fix: 'Criar arquivo .env.example'
  }
];

let passed = 0;
let failed = 0;

console.log('📋 Executando validações...\n');

validations.forEach((validation, index) => {
  try {
    const result = validation.check();
    if (result) {
      console.log(`✅ ${index + 1}. ${validation.name}`);
      passed++;
    } else {
      console.log(`❌ ${index + 1}. ${validation.name}`);
      console.log(`   💡 Correção: ${validation.fix}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${validation.name} - Erro: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '═'.repeat(50));
console.log(`📊 RESULTADO: ${passed} ✅ | ${failed} ❌`);

if (failed === 0) {
  console.log('🎉 TODAS AS VALIDAÇÕES PASSARAM!');
  console.log('🚀 Projeto 100% compatível com Render.com');
  console.log('\n📋 Lista de verificação final:');
  console.log('   ✅ Configuração do servidor otimizada');
  console.log('   ✅ Health checks implementados');
  console.log('   ✅ Graceful shutdown configurado');
  console.log('   ✅ CORS para Render configurado');
  console.log('   ✅ Scripts de build otimizados');
  console.log('   ✅ Variáveis de ambiente documentadas');
} else {
  console.log('⚠️  ALGUMAS VALIDAÇÕES FALHARAM');
  console.log('🔧 Corrija os problemas acima antes do deploy');
  process.exit(1);
}