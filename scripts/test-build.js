#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testando compatibilidade com Render...\n');

// Função para executar comandos e capturar saída
function runCommand(command, description) {
  console.log(`▶️  ${description}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - OK\n`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - ERRO:`);
    console.log(error.message);
    console.log('');
    return { success: false, error: error.message };
  }
}

// Função para verificar arquivos
function checkFile(filePath, description) {
  console.log(`🔍 Verificando ${description}`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${description} existe (${Math.round(stats.size / 1024)}KB)\n`);
    return true;
  } else {
    console.log(`❌ ${description} não encontrado: ${filePath}\n`);
    return false;
  }
}

// Testes
const tests = [
  // 1. Verificar TypeScript
  () => runCommand('npx tsc --noEmit', 'Verificação TypeScript'),
  
  // 2. Build do cliente
  () => runCommand('npm run build:client', 'Build do frontend (Vite)'),
  
  // 3. Build do servidor
  () => runCommand('npm run build:server', 'Build do backend (esbuild)'),
  
  // 4. Verificar arquivos gerados
  () => {
    const checks = [
      checkFile('dist/public/index.html', 'Index HTML'),
      checkFile('dist/public/assets', 'Assets CSS/JS'),
      checkFile('dist/index.js', 'Server bundle'),
    ];
    return { success: checks.every(c => c) };
  },
  
  // 5. Teste do servidor em modo produção
  () => {
    console.log('🚀 Testando servidor em modo produção...');
    try {
      // Criar um processo filho para testar o servidor
      const { spawn } = require('child_process');
      const serverProcess = spawn('node', ['dist/index.js'], {
        env: { ...process.env, NODE_ENV: 'production', PORT: '3001' },
        stdio: 'pipe'
      });
      
      return new Promise((resolve) => {
        let output = '';
        
        serverProcess.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('serving on port')) {
            console.log('✅ Servidor iniciou com sucesso\n');
            serverProcess.kill();
            resolve({ success: true });
          }
        });
        
        serverProcess.stderr.on('data', (data) => {
          console.log(`❌ Erro no servidor: ${data}`);
          serverProcess.kill();
          resolve({ success: false, error: data.toString() });
        });
        
        // Timeout após 10 segundos
        setTimeout(() => {
          console.log('❌ Timeout - servidor não iniciou em 10s\n');
          serverProcess.kill();
          resolve({ success: false, error: 'Timeout' });
        }, 10000);
      });
    } catch (error) {
      console.log(`❌ Erro ao testar servidor: ${error.message}\n`);
      return { success: false, error: error.message };
    }
  }
];

// Executar todos os testes
async function runAllTests() {
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (let i = 0; i < tests.length; i++) {
    console.log(`📋 Teste ${i + 1}/${totalTests}`);
    const result = await tests[i]();
    if (result.success) {
      passedTests++;
    }
  }
  
  console.log('═'.repeat(50));
  console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM - PRONTO PARA RENDER!');
    console.log('💡 Próximos passos:');
    console.log('   1. Commit e push para GitHub/GitLab');
    console.log('   2. Conectar repositório no Render.com');
    console.log('   3. Configurar variáveis de ambiente');
    console.log('   4. Deploy!');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM - VERIFICAR ANTES DO DEPLOY');
    process.exit(1);
  }
}

runAllTests().catch(console.error);