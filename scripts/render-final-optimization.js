#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 OTIMIZAÇÃO FINAL PARA 100% COMPATIBILIDADE RENDER\n');

const optimizations = [
  {
    name: 'Otimizar package.json para Render',
    execute: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Garantir ordem correta dos scripts
      pkg.scripts = {
        ...pkg.scripts,
        "render-build": "npm ci --include=dev && npm run build",
        "render-start": "npm run start"
      };
      
      // Otimizar engines
      pkg.engines = {
        node: ">=18.0.0",
        npm: ">=8.0.0"
      };
      
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      return true;
    }
  },
  {
    name: 'Verificar render.yaml otimizado',
    execute: () => {
      const renderConfig = fs.readFileSync('render.yaml', 'utf8');
      return renderConfig.includes('healthCheckPath: /health') && 
             renderConfig.includes('scaling:');
    }
  },
  {
    name: 'Validar estrutura de diretórios',
    execute: () => {
      const requiredDirs = ['client/src', 'server', 'shared', 'scripts'];
      return requiredDirs.every(dir => fs.existsSync(dir));
    }
  },
  {
    name: 'Verificar dependências críticas',
    execute: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const criticalDeps = ['express', 'vite', 'react', 'typescript'];
      return criticalDeps.every(dep => 
        pkg.dependencies[dep] || pkg.devDependencies[dep]
      );
    }
  },
  {
    name: 'Otimizar configuração TypeScript',
    execute: () => {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      tsconfig.compilerOptions = {
        ...tsconfig.compilerOptions,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        skipLibCheck: true
      };
      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
      return true;
    }
  },
  {
    name: 'Criar arquivo .renderignore otimizado',
    execute: () => {
      const renderIgnore = `# Render ignore file
.git/
.gitignore
.env
.env.*
node_modules/
dist/
logs/
*.log
*.tmp
.DS_Store
Thumbs.db
.vscode/
.idea/
*.zip
*.tar.gz
client/client/
scripts/test-*.js
scripts/simulation*.js
attached_assets/
render-final-*/
cartao-vidah-*/
`;
      fs.writeFileSync('.renderignore', renderIgnore);
      return true;
    }
  },
  {
    name: 'Otimizar .gitignore para deploy',
    execute: () => {
      let gitignore = fs.readFileSync('.gitignore', 'utf8');
      const additions = `
# Render specific
.render/
render-logs/
*.render.log

# Build artifacts
dist/
build/

# Deployment files
*.zip
*.tar.gz
deployment-*/
`;
      if (!gitignore.includes('# Render specific')) {
        gitignore += additions;
        fs.writeFileSync('.gitignore', gitignore);
      }
      return true;
    }
  },
  {
    name: 'Criar healthcheck.js para Render',
    execute: () => {
      const healthcheck = `#!/usr/bin/env node
// Simple healthcheck script for Render
const http = require('http');

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

const options = {
  hostname: host,
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.error(\`Health check failed with status: \${res.statusCode}\`);
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.error(\`Health check error: \${error.message}\`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
`;
      fs.writeFileSync('healthcheck.js', healthcheck);
      return true;
    }
  }
];

let successCount = 0;

console.log('🔧 Executando otimizações...\n');

optimizations.forEach((opt, index) => {
  try {
    const result = opt.execute();
    const icon = result ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${opt.name}`);
    if (result) successCount++;
  } catch (error) {
    console.log(`❌ ${index + 1}. ${opt.name} - Erro: ${error.message}`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`📊 Otimizações aplicadas: ${successCount}/${optimizations.length}`);

if (successCount === optimizations.length) {
  console.log('\n🎉 TODAS AS OTIMIZAÇÕES APLICADAS COM SUCESSO!');
  console.log('✨ PROJETO 100% OTIMIZADO PARA RENDER');
  console.log('\n🚀 MELHORIAS IMPLEMENTADAS:');
  console.log('   ✅ Build script otimizado para Render');
  console.log('   ✅ TypeScript configurado para máxima compatibilidade');
  console.log('   ✅ Arquivos ignore criados para deploy limpo');
  console.log('   ✅ Healthcheck script adicionado');
  console.log('   ✅ Dependências validadas');
  console.log('   ✅ Estrutura de projeto verificada');
  
  console.log('\n📋 PRÓXIMO PASSO: Deploy no Render');
  console.log('   1. git add . && git commit && git push');
  console.log('   2. Conectar repositório no Render');
  console.log('   3. Configurar variáveis de ambiente');
  console.log('   4. Deploy automático será iniciado');
} else {
  console.log('\n⚠️ Algumas otimizações falharam');
  console.log('🔧 Revise os erros acima antes do deploy');
}

process.exit(successCount === optimizations.length ? 0 : 1);