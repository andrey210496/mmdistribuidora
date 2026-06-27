# PDV MM — Sistema de Gestão (MM Distribuidora)

Sistema completo de e-commerce + PDV + ERP para a **MM Distribuidora** (distribuidora de doces, confeitaria e embalagens).

> Projeto independente. (Antiga base "Doce Encanto" — agora MM Distribuidora.)

Stack: **Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind · Stripe**

---

## 🚀 Setup inicial (rode 1 vez)

### Pré-requisitos
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para o Postgres local)

### Passos

```bash
# 1. Instale as dependências
npm install

# 2. Suba o Postgres em container
docker compose up -d

# 3. Crie as tabelas + popule banco (admin, categorias, produtos exemplo)
npx prisma migrate dev --name init
npm run db:seed

# 4. Inicie o servidor
npm run dev
```

Acesse:
- **Loja:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/login
  - **email:** `admin@doceencanto.local`
  - **senha:** `admin`
  - ⚠️ Você será obrigado a trocar a senha no primeiro login.

---

## 📂 Estrutura do projeto

```
doce-encanto/
├── prisma/
│   ├── schema.prisma          # Modelo completo do banco
│   └── seed.ts                # Dados iniciais (admin, produtos, clube)
├── src/
│   ├── app/                   # Rotas Next.js (App Router)
│   │   ├── page.tsx           # Home da loja
│   │   ├── produtos/          # Catálogo público
│   │   ├── clube/             # Clube de vantagens
│   │   └── admin/             # Painel administrativo (auth obrigatória)
│   │       ├── login/
│   │       ├── trocar-senha/
│   │       ├── pedidos/       # (Fase 3)
│   │       ├── produtos/      # (Fase 3)
│   │       ├── financeiro/    # (Fase 4)
│   │       └── ...
│   ├── components/            # Componentes React
│   │   ├── storefront/
│   │   └── admin/
│   ├── lib/                   # Lógica de domínio + segurança
│   │   ├── prisma.ts          # Cliente do banco (singleton)
│   │   ├── env.ts             # Validação de variáveis de ambiente
│   │   ├── auth.ts            # Login com lockout, audit, rotação
│   │   ├── session.ts         # Sessões com iron-session (cookie httpOnly)
│   │   ├── crypto.ts          # argon2id, HMAC, comparação timing-safe
│   │   ├── rate-limit.ts      # Token bucket por IP
│   │   ├── audit.ts           # Log de auditoria
│   │   ├── asaas.ts           # Cliente Asaas (server-only)
│   │   ├── validations.ts     # Schemas Zod de toda entrada
│   │   ├── money.ts           # Helpers de centavos → BRL
│   │   └── utils.ts
│   └── middleware.ts          # CSP + headers de segurança em toda request
└── docker-compose.yml         # Postgres local
```

---

## 🔒 Princípios de segurança aplicados

| Risco | Mitigação |
|---|---|
| **SQL injection** | Prisma com queries parametrizadas. Sem string concat de SQL. |
| **XSS** | React escapa por padrão. Sem `dangerouslySetInnerHTML` em dado de usuário. CSP rigorosa no middleware. |
| **CSRF** | Cookies `sameSite=lax`. Server Actions do Next 15 já incluem proteção CSRF. Token CSRF em sessão para fluxos sensíveis. |
| **Brute force login** | Rate limit 5/min por IP + lockout de conta após 5 tentativas (15 min). |
| **Timing attack em login** | Hash dummy quando email não existe + `timingSafeEqual` para comparações. |
| **Senha fraca** | Argon2id (OWASP 2024+), mínimo 10 caracteres com classes mistas. |
| **Token previsível** | `crypto.randomBytes` em todo token (sessão, pickToken de pedido). |
| **Dados expostos no front** | Toda lógica sensível em Server Actions/API routes. Frontend nunca vê chave Asaas, hash, etc. |
| **Manipulação de preço** | Backend recalcula tudo no checkout a partir do `productId`. Preço enviado pelo cliente é ignorado. |
| **Webhook falsificado** | Validação HMAC do `asaas-access-token` com `safeCompare`. Idempotência por `eventId`. |
| **Clickjacking** | `X-Frame-Options: DENY` + `frame-ancestors 'none'` no CSP. |
| **MITM** | HSTS em produção. Cookies `secure` em produção. |
| **Auditoria** | Toda ação admin grava em `AuditLog` (quem, quando, IP, user-agent, antes/depois). |
| **Dinheiro** | Sempre em centavos (`Int`), nunca `Float`. |

---

## 🗺️ Roadmap

- [x] **Fase 1 — Fundação** ✅
  - Estrutura, banco, segurança base, identidade visual, home, login admin
- [ ] **Fase 2 — Storefront completo**
  - Carrinho, checkout, integração Asaas (PIX/cartão/boleto), webhook
- [ ] **Fase 3 — Painel admin**
  - CRUD pedidos/produtos/clientes, impressão A4 + QR code, tela mobile de separação
  - Botão "Emitir NF" → gera PDF (estrutura pronta para integração futura com Focus/NFe.io)
- [ ] **Fase 4 — Financeiro + Clube**
  - Conciliação Asaas, fluxo de caixa, gestão de assinantes do clube
- [ ] **Fase 5 — Hardening**
  - Testes, deploy na VPS, monitoramento

---

## 🧰 Comandos úteis

```bash
npm run dev              # Servidor de desenvolvimento (hot reload)
npm run build            # Build de produção
npm run start            # Inicia em modo produção
npm run db:studio        # Interface visual do banco (Prisma Studio)
npm run db:migrate       # Cria/aplica migrations
npm run db:seed          # Popula banco com dados iniciais
npx prisma migrate reset # ⚠️ Apaga banco e roda seed do zero
```

---

## 🌎 Deploy na VPS (quando chegar a hora)

1. Instalar Node 20+, Docker e Nginx na VPS
2. Configurar Postgres real (não usar o do docker-compose em produção, ou usar com volumes persistentes + backup)
3. Copiar `.env.example` → `.env` na VPS e preencher com valores **fortes**:
   - `SESSION_SECRET`: gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`: do painel Asaas em produção
4. Configurar Nginx como proxy reverso com HTTPS (Let's Encrypt)
5. `npm run build && pm2 start npm -- start`
6. Configurar webhook do Asaas apontando para `https://seudominio.com.br/api/webhooks/asaas`

---

## ⚠️ Antes de ir pra produção

- [ ] Trocar senha do admin (forçado no primeiro login)
- [ ] Gerar `SESSION_SECRET` forte e único (32+ bytes aleatórios)
- [ ] Configurar credenciais Asaas em produção (não sandbox)
- [ ] Ativar HTTPS + HSTS
- [ ] Backup automático do Postgres
- [ ] Configurar logs centralizados (pino + arquivo ou serviço externo)
- [ ] Decidir provider de NF-e (manual / Focus / NFe.io) e configurar
- [ ] Política de privacidade e termos de uso publicados (LGPD)

---

## 🤝 Próximos passos

Diga ao Claude qual fase quer começar e ele continua a partir daqui.
