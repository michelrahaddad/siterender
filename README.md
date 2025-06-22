# Cartão + Vidah - Plataforma de Benefícios

## Descrição
Plataforma completa de cartão de benefícios com funcionalidades de captura de leads, sistema administrativo e integração WhatsApp.

## Funcionalidades Principais
- Landing page responsiva com apresentação de planos
- Sistema de captura de leads integrado ao WhatsApp
- Painel administrativo com dashboard de conversões
- Exportação de dados para campanhas publicitárias (Google Ads/Facebook)
- Sistema de autenticação JWT para administradores
- Integração com PostgreSQL via Drizzle ORM

## Deploy no Render

### Pré-requisitos
1. Conta no Render.com
2. Banco PostgreSQL (recomendado: Neon Database)

### Configuração
1. Faça upload do projeto para um repositório Git
2. Conecte o repositório ao Render
3. Configure as variáveis de ambiente:
   - `DATABASE_URL`: URL do banco PostgreSQL
   - `JWT_SECRET`: Chave secreta para JWT
   - `SESSION_SECRET`: Chave secreta para sessões
   - `NODE_ENV`: production

### Comandos
- `npm run render-build`: Build para produção
- `npm run render-start`: Iniciar servidor
- `npm run dev`: Desenvolvimento local

## Acesso Administrativo
- URL: `/admin/login`
- Usuário: `admin`
- Senha: `vidah2025`

## Estrutura do Projeto
```
cartao-vidah/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado
├── dist/            # Build de produção
└── package.json     # Configurações do projeto
```

## Tecnologias
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL com Drizzle ORM
- **Deploy**: Render.com
- **Autenticação**: JWT + Express Session

## Suporte
Para dúvidas técnicas ou suporte, entre em contato através do email: cartaomaisvidah@gmail.com