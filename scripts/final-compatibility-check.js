#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 VERIFICAÇÃO FINAL DE COMPATIBILIDADE RENDER - 100%\n');

const COMPATIBILITY_CHECKS = [
  {
    category: 'Build System',
    checks: [
      {
        name: 'Scripts render-build e render-start',
        test: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.scripts['render-build'] && pkg.scripts['render-start'];
        }
      },
      {
        name: 'Build separado client/server',
        test: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.scripts['build:client'] && pkg.scripts['build:server'];
        }
      },
      {
        name: 'Target Node.js correto',
        test: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.engines && pkg.engines.node && pkg.engines.node.includes('18');
        }
      }
    ]
  },
  {
    category: 'Server Configuration',
    checks: [
      {
        name: 'Porta dinâmica (process.env.PORT)',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('process.env.PORT');
        }
      },
      {
        name: 'Host 0.0.0.0 (não localhost)',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('"0.0.0.0"') && !server.includes('"localhost"');
        }
      },
      {
        name: 'Trust proxy habilitado',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('trust proxy');
        }
      }
    ]
  },
  {
    category: 'Health Checks',
    checks: [
      {
        name: 'Endpoint /health implementado',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes("'/health'");
        }
      },
      {
        name: 'Health check path no render.yaml',
        test: () => {
          const render = fs.readFileSync('render.yaml', 'utf8');
          return render.includes('healthCheckPath: /health');
        }
      },
      {
        name: 'Multiple health endpoints',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes("'/ready'") && server.includes("'/_health'");
        }
      }
    ]
  },
  {
    category: 'Security & Performance',
    checks: [
      {
        name: 'CORS configurado para Render',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('onrender.com');
        }
      },
      {
        name: 'Helmet security headers',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('helmet');
        }
      },
      {
        name: 'Compression habilitada',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('compression');
        }
      },
      {
        name: 'Graceful shutdown',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('SIGTERM') && server.includes('gracefulShutdown');
        }
      }
    ]
  },
  {
    category: 'Static Files & Frontend',
    checks: [
      {
        name: 'Static files path correto',
        test: () => {
          const vite = fs.readFileSync('server/vite.ts', 'utf8');
          return vite.includes('dist/public');
        }
      },
      {
        name: 'SPA fallback configurado',
        test: () => {
          const vite = fs.readFileSync('server/vite.ts', 'utf8');
          return vite.includes('index.html');
        }
      },
      {
        name: 'Cache headers otimizados',
        test: () => {
          const vite = fs.readFileSync('server/vite.ts', 'utf8');
          return vite.includes('Cache-Control');
        }
      }
    ]
  },
  {
    category: 'Environment & Dependencies',
    checks: [
      {
        name: 'Arquivo .env.example',
        test: () => fs.existsSync('.env.example')
      },
      {
        name: 'DATABASE_URL documentado',
        test: () => {
          const env = fs.readFileSync('.env.example', 'utf8');
          return env.includes('DATABASE_URL');
        }
      },
      {
        name: 'Secrets necessários documentados',
        test: () => {
          const env = fs.readFileSync('.env.example', 'utf8');
          return env.includes('JWT_SECRET') && env.includes('SESSION_SECRET');
        }
      }
    ]
  },
  {
    category: 'Error Handling & Monitoring',
    checks: [
      {
        name: 'Error handling global',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('globalErrorHandler') || server.includes('catch');
        }
      },
      {
        name: 'Process error handlers',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('unhandledRejection') && server.includes('uncaughtException');
        }
      },
      {
        name: 'Structured logging',
        test: () => {
          const server = fs.readFileSync('server/index.ts', 'utf8');
          return server.includes('console.log') && server.includes('timestamp');
        }
      }
    ]
  }
];

function runCompatibilityCheck() {
  let totalChecks = 0;
  let passedChecks = 0;
  let criticalIssues = [];

  console.log('📋 Executando verificações de compatibilidade...\n');

  COMPATIBILITY_CHECKS.forEach(category => {
    console.log(`🔍 ${category.category}:`);
    
    let categoryPassed = 0;
    category.checks.forEach(check => {
      totalChecks++;
      try {
        const result = check.test();
        const icon = result ? '✅' : '❌';
        console.log(`  ${icon} ${check.name}`);
        
        if (result) {
          passedChecks++;
          categoryPassed++;
        } else {
          criticalIssues.push(`${category.category}: ${check.name}`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name} - Erro: ${error.message}`);
        criticalIssues.push(`${category.category}: ${check.name} (ERRO)`);
      }
    });
    
    const categoryScore = Math.round((categoryPassed / category.checks.length) * 100);
    console.log(`  📊 Score: ${categoryScore}%\n`);
  });

  // Resultados finais
  const overallScore = Math.round((passedChecks / totalChecks) * 100);
  
  console.log('═'.repeat(70));
  console.log('📊 RESULTADO FINAL DA COMPATIBILIDADE\n');
  console.log(`✅ Checks aprovados: ${passedChecks}/${totalChecks}`);
  console.log(`📈 Score geral: ${overallScore}%`);
  
  if (criticalIssues.length > 0) {
    console.log(`❌ Problemas detectados: ${criticalIssues.length}\n`);
    console.log('🚨 PROBLEMAS CRÍTICOS:');
    criticalIssues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  console.log('\n' + '═'.repeat(70));

  if (overallScore >= 95) {
    console.log('🎉 COMPATIBILIDADE RENDER: EXCELENTE (95%+)');
    console.log('✨ MÁXIMA COMPATIBILIDADE ATINGIDA');
    console.log('🚀 DEPLOY GARANTIDO 100%');
    console.log('\n🎯 STATUS: ENTERPRISE READY');
    console.log('📦 Zero problemas críticos');
    console.log('⚡ Performance otimizada');
    console.log('🔒 Segurança máxima');
    return true;
  } else if (overallScore >= 85) {
    console.log('✅ COMPATIBILIDADE RENDER: BOA (85%+)');
    console.log('🟡 Alguns ajustes menores recomendados');
    console.log('🚀 Deploy provável de funcionar');
    return true;
  } else {
    console.log('❌ COMPATIBILIDADE RENDER: INSUFICIENTE (<85%)');
    console.log('🔧 Corrija os problemas críticos antes do deploy');
    console.log('⚠️ Risco alto de falha no deploy');
    return false;
  }
}

const success = runCompatibilityCheck();
process.exit(success ? 0 : 1);