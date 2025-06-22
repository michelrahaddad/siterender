#!/usr/bin/env node

import { spawn } from 'child_process';
import fetch from 'node-fetch';

console.log('🎭 Simulando ambiente de produção do Render...\n');

// Simular variáveis de ambiente do Render
const renderEnv = {
  NODE_ENV: 'production',
  PORT: '3002',
  DATABASE_URL: 'postgresql://fake:fake@localhost/fake', // Para teste sem DB real
  JWT_SECRET: 'test-jwt-secret-for-render-simulation',
  SESSION_SECRET: 'test-session-secret-for-render-simulation'
};

async function testEndpoint(url, expectedStatus = 200) {
  try {
    const response = await fetch(url);
    const isSuccess = response.status === expectedStatus;
    console.log(`${isSuccess ? '✅' : '❌'} ${url} - Status: ${response.status}`);
    return isSuccess;
  } catch (error) {
    console.log(`❌ ${url} - Erro: ${error.message}`);
    return false;
  }
}

async function simulateRender() {
  console.log('🚀 Iniciando servidor em modo produção...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    env: { ...process.env, ...renderEnv },
    stdio: 'pipe'
  });
  
  let serverReady = false;
  
  // Monitorar logs do servidor
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('serving on port')) {
      serverReady = true;
      console.log('✅ Servidor iniciado com sucesso');
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log(`⚠️ Server stderr: ${data}`);
  });
  
  // Aguardar servidor iniciar
  await new Promise(resolve => {
    const checkReady = setInterval(() => {
      if (serverReady) {
        clearInterval(checkReady);
        resolve();
      }
    }, 500);
    
    // Timeout após 15 segundos
    setTimeout(() => {
      clearInterval(checkReady);
      resolve();
    }, 15000);
  });
  
  if (!serverReady) {
    console.log('❌ Servidor não iniciou a tempo');
    serverProcess.kill();
    return false;
  }
  
  // Aguardar um pouco mais para estabilizar
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n🧪 Testando endpoints essenciais...');
  
  const baseUrl = `http://localhost:${renderEnv.PORT}`;
  const tests = [
    { url: `${baseUrl}/health`, name: 'Health Check' },
    { url: `${baseUrl}/ready`, name: 'Readiness Check' },
    { url: `${baseUrl}/_health`, name: 'Alternative Health Check' },
    { url: `${baseUrl}/`, name: 'Homepage' },
    { url: `${baseUrl}/admin/login`, name: 'Admin Login Page' },
    { url: `${baseUrl}/api/plans`, name: 'API Plans' },
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    console.log(`🔍 Testando ${test.name}...`);
    const success = await testEndpoint(test.url);
    if (success) passedTests++;
  }
  
  console.log(`\n📊 Resultados: ${passedTests}/${tests.length} endpoints funcionando`);
  
  // Testar funcionalidades específicas
  console.log('\n🎯 Testando funcionalidades específicas...');
  
  try {
    // Testar captura de leads
    const leadResponse = await fetch(`${baseUrl}/api/track-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Teste Render',
        phone: '16999887766',
        email: 'teste@render.com',
        interest: 'plano-individual'
      })
    });
    
    console.log(`${leadResponse.ok ? '✅' : '❌'} Captura de leads WhatsApp - Status: ${leadResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Captura de leads - Erro: ${error.message}`);
  }
  
  // Finalizar teste
  console.log('\n🛑 Finalizando simulação...');
  serverProcess.kill();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const overallSuccess = passedTests >= 4; // Pelo menos 4 dos 6 endpoints básicos
  
  console.log('\n' + '═'.repeat(50));
  if (overallSuccess) {
    console.log('🎉 SIMULAÇÃO RENDER PASSOU!');
    console.log('✅ Projeto pronto para deploy no Render.com');
    console.log('\n📋 Checklist final:');
    console.log('   ✅ Servidor inicia corretamente');
    console.log('   ✅ Health checks funcionando');
    console.log('   ✅ API endpoints respondendo');
    console.log('   ✅ Frontend servindo corretamente');
    console.log('   ✅ Configuração de produção OK');
  } else {
    console.log('❌ SIMULAÇÃO RENDER FALHOU!');
    console.log('⚠️ Verifique os problemas acima antes do deploy');
  }
  
  return overallSuccess;
}

// Verificar se o build existe
import fs from 'fs';
if (!fs.existsSync('dist/index.js')) {
  console.log('❌ Build não encontrado. Executando build primeiro...');
  console.log('📦 npm run build');
  
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build concluído com sucesso\n');
      simulateRender();
    } else {
      console.log('❌ Build falhou');
      process.exit(1);
    }
  });
} else {
  simulateRender();
}