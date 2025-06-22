# ✅ Checklist de Deploy no Render - 100% Compatibilidade

## Antes do Deploy

### 1. Preparação do Código
- ✅ Código otimizado para Render
- ✅ Health checks implementados (`/health`, `/ready`, `/_health`)
- ✅ Graceful shutdown configurado
- ✅ Trust proxy habilitado
- ✅ CORS configurado para Render
- ✅ Variáveis de ambiente documentadas

### 2. Testes Locais
```bash
# Executar todos os testes
npm run test:all

# Validar configuração (deve passar 10/10)
npm run validate:render

# Testar build e servidor
npm run test:build

# Simular ambiente Render
node scripts/render-simulation.js
```

## Deploy no Render

### 3. Configuração do Banco de Dados
1. **Neon Database** (Recomendado - Gratuito)
   - Acesse: https://neon.tech
   - Crie projeto PostgreSQL
   - Copie CONNECTION_STRING

2. **Alternativas**
   - Render PostgreSQL (pago)
   - Supabase (gratuito)
   - Railway (gratuito com limite)

### 4. Deploy no Render.com
1. **Conectar Repositório**
   - Push código para GitHub/GitLab
   - Conectar repositório no Render
   - Selecionar "Web Service"

2. **Configurações**
   ```
   Build Command: npm run render-build
   Start Command: npm run render-start
   Node Version: 18 ou superior
   ```

3. **Variáveis de Ambiente**
   ```
   DATABASE_URL = postgresql://user:pass@host/db
   JWT_SECRET = sua-chave-jwt-super-secreta-aqui
   SESSION_SECRET = sua-chave-sessao-super-secreta-aqui
   NODE_ENV = production
   ```

### 5. Verificação Pós-Deploy
- ✅ Site carrega: `https://seu-app.onrender.com`
- ✅ Health check: `https://seu-app.onrender.com/health`
- ✅ Admin funciona: `https://seu-app.onrender.com/admin/login`
- ✅ WhatsApp redirect funciona
- ✅ Captura de leads funciona
- ✅ Badges de desconto visíveis

## Funcionalidades Garantidas

### Frontend
- ✅ Landing page responsiva
- ✅ Seção de parceiros com badges 10-40%
- ✅ Modal de captura de leads
- ✅ Redirecionamento WhatsApp universal
- ✅ Design moderno e otimizado

### Backend
- ✅ API REST completa
- ✅ Sistema de autenticação JWT
- ✅ Rate limiting de segurança
- ✅ Middleware de validação
- ✅ Logs estruturados

### Sistema Administrativo
- ✅ Login seguro: admin/vidah2025
- ✅ Dashboard de conversões
- ✅ Exportação CSV para campanhas
- ✅ Estatísticas em tempo real

### Integração WhatsApp
- ✅ Captura de leads antes redirect
- ✅ Funcionamento universal (mobile/desktop)
- ✅ Validação de dados completa

## Solução de Problemas

### Build Falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Servidor não inicia
- Verificar DATABASE_URL
- Verificar logs no Render
- Testar health check

### WhatsApp não funciona
- Verificar CORS no admin do Render
- Testar em incógnito
- Verificar console do navegador

## Suporte
- Email: cartaomaisvidah@gmail.com
- Admin: https://seu-app.onrender.com/admin/login
- Health: https://seu-app.onrender.com/health