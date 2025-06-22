# Instruções de Deploy no Render

## Passo 1: Preparar o Banco de Dados
1. Crie uma conta no [Neon Database](https://neon.tech/) (gratuito)
2. Crie um novo projeto PostgreSQL
3. Copie a CONNECTION STRING (formato: `postgresql://user:pass@host/db`)

## Passo 2: Deploy no Render
1. Faça upload do projeto para GitHub/GitLab
2. Acesse [Render.com](https://render.com) e conecte o repositório
3. Selecione "Web Service"
4. Configure:
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Node Version**: 18 ou superior

## Passo 3: Variáveis de Ambiente
Configure as seguintes variáveis no painel do Render:

```
DATABASE_URL = postgresql://user:pass@host/db
JWT_SECRET = sua-chave-secreta-jwt-aqui
SESSION_SECRET = sua-chave-secreta-sessao-aqui
NODE_ENV = production
```

## Passo 4: Configurar Domínio (Opcional)
- Render fornece domínio gratuito: `seu-app.onrender.com`
- Para domínio personalizado, configure no painel do Render

## Passo 5: Testar
1. Aguarde o deploy completar
2. Acesse: `https://seu-app.onrender.com`
3. Teste admin: `https://seu-app.onrender.com/admin/login`
   - Usuário: `admin`
   - Senha: `vidah2025`

## Funcionalidades Garantidas
✅ Landing page completa com parceiros e badges
✅ Sistema de captura de leads WhatsApp
✅ Painel administrativo funcional
✅ Exportação CSV para campanhas
✅ Integração PostgreSQL
✅ Sistema de segurança completo
✅ Responsividade mobile/desktop

## Suporte
Email: cartaomaisvidah@gmail.com