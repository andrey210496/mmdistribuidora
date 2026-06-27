# HANDOFF — Projeto PDV MM (MM Distribuidora)

> Documento de passagem de contexto entre sessões do Claude Code.
> **Na nova sessão (aberta DENTRO desta pasta), peça: "leia o HANDOFF-MM.md e continue".**

## 1. Identidade do projeto (confirme no início)
- **Pasta:** `C:\Users\andre\OneDrive\Área de Trabalho\PDV-MM` (este é o projeto MM; NÃO mexer no `Downloads\doce-encanto`, que é outro projeto).
- **Repo:** `origin = https://github.com/andrey210496/mmdistribuidora.git`
- **Banco:** `mm_distribuidora` (Postgres localhost:5432, user/pass postgres/postgres)
- **package.json name:** `pdv-mm`
- **Login admin (seed):** `admin@doceencanto.local` / `admin` (troca obrigatória no 1º login). 16 produtos de exemplo.

## 2. Marca / paleta (MM Distribuidora)
- Nome de exibição em tudo: **MM Distribuidora**.
- Logo oficial: `public/Logo suzano.png` é a arte original (1080×1350 com margens). **Recortar com `sharp` (`.trim()`) e salvar como `public/logo.png`** (resultado ~925×399, lockup horizontal). O `public/logo.png` atual ainda é o antigo — precisa refazer.
- Paleta (remapear os tokens em `tailwind.config.ts` + vars em `src/app/globals.css`):
  - `rose-brand` = **#D12B2B** (VERMELHO primário; era rosa #e8a2b6)
  - `gold` = #f2b23e · `caramel` = #D98A2B · `cocoa` = #5a3214 · `espresso` = #3a1e0c · `cream` = #fbf2e2 · `olive` mantido verde (sucesso)
  - Trocar rosas hardcoded `#e8a2b6`→#D12B2B, `#c97d92`/`#b06b80`→#A81E1E. Manter dourados/marrons (`#d4a574`,`#a07640`,`#8a5a1e`).
- `src/lib/company.ts`: `name`/`legalName` = "MM Distribuidora". CNPJ/e-mail/domínio/WhatsApp ainda são os antigos — o cliente precisa fornecer os reais.

## 3. Regras de trabalho
- **Banco evolui via `npx prisma db push`** (não migrations; histórico de migrations está drifted). Depois `npx prisma generate`. Parar o `npm run dev` antes do push (trava a DLL do Prisma no Windows).
- **COMMITAR a cada etapa** (no repo mmdistribuidora). Numa sessão anterior, trabalho não-commitado foi apagado por um reset de árvore. Não deixar grande bloco só no working tree.
- **NÃO** adicionar trailer `Co-Authored-By` (regra do CLAUDE.md; settings sem `attribution.commit`).
- Dinheiro sempre em centavos (Int). Backend é a fonte da verdade de preço.
- ⚠️ Pasta está dentro do OneDrive → `node_modules` sincroniza (pesado). Considerar mover pra fora do OneDrive (ex.: `C:\Projetos\PDV-MM`).

## 4. O que já foi construído numa sessão anterior e PRECISA SER RECONSTRUÍDO
A base desta cópia é o código publicado (Doce Encanto rebrandeado superficialmente). As features abaixo foram feitas mas **se perderam** (reset) e não estão aqui. Reconstruir nesta ordem, commitando cada uma:

### Etapa 1 — Schema + base (`prisma db push` + commit)
- enum `OrderChannel { ONLINE, PDV }`; `PaymentMethod` += `DEBIT_CARD, CASH, STORE_CREDIT`.
- `Order` += `channel`, `cashSessionId`, `amountReceivedCents`, `changeCents`, relação `payments`, `creditTransactions`.
- `CashRegisterSession` (status OPEN/CLOSED, openingFloatCents, countedCashCents, expectedCashCents, differenceCents, opened/closedBy/At) + `CashMovement` (SANGRIA/SUPRIMENTO).
- `OrderPayment` (orderId, method, amountCents) — pagamento misto.
- `CreditTransaction` (customerId, type CHARGE/PAYMENT, amountCents, orderId?, method?) + enum `CreditTxType`.
- `Product` += `barcode @unique`, `wholesalePriceCents`, `wholesaleMinQty @default(0)`.
- `Customer` += `isWholesale`, `creditLimitCents`.
- (ERP fase 2) `Supplier`, `StockEntry`, `StockEntryItem`, enum `StockEntryStatus`, `Product.stockEntryItems`.

### Etapa 2 — PDV / Caixa (`/admin/pdv`, área de permissão `pdv`)
- Abrir/fechar caixa (fundo de troco, conferência esperado×contado), sangria/suprimento.
- Venda no balcão: busca produto por nome/SKU/**código de barras** (bipar = adiciona), carrinho, cliente "Consumidor" ou vincular/cadastrar rápido.
- **Pagamento misto** (dinheiro/PIX/débito/crédito; troco do dinheiro) — função pura `computePaymentBreakdown` (testar).
- Venda PDV nasce PAGA + ENTREGUE, baixa estoque, lança receita; cupom 80mm.
- Reconciliação do caixa por `OrderPayment`.
- Selo "Balcão" em Pedidos; rótulos de pagamento (lib/orders) com CASH/DEBIT_CARD.

### Etapa 3 — Atacado × Varejo
- `src/lib/pricing.ts` → `resolveUnitPrice(product, {isClubMember,isWholesale,qty})` = menor preço aplicável (normal/club/atacado). Usar no PDV, carrinho e checkout.
- Produto: campos preço de atacado + qtd mínima. Cliente: flag atacado (toggle no detalhe/criação). Selos "Atacado".

### Etapa 4 — Crediário / Fiado
- `src/lib/credit.ts`: limite, saldo (CHARGE−PAYMENT), `registerCreditSale` (PENDING, gera CHARGE), `registerCreditPayment` (regime caixa: receita no recebimento; quita → orders viram CONFIRMED).
- PDV: botão "Vender no fiado" (exige cliente + limite). Detalhe do cliente: painel de crédito (limite, devendo, disponível, receber pagamento, vendas em aberto). Financeiro: "a receber em fiado". Selo "Fiado".

### Etapa 5 — Atalhos de teclado do PDV
- `src/lib/pdv-shortcuts.ts` (puro) + get/save em Setting (`pdv.shortcuts`). Tela Configurações: capturar tecla por ação. PDV: listener (teclas simples não disparam digitando; F2–F12/Ctrl/Alt sempre).

### Etapa 6 — Rebrand visual + Redesign do site
- Aplicar paleta/logo (seção 2). Logo.tsx só a imagem (lockup já tem o nome).
- Home: `Hero` codado (proposta de valor + CTAs + card de atacado), `CategoryTiles` (categorias reais via `src/lib/categories.ts`), header com nav de categorias reais, footer com formas de pagamento + "Loja protegida" + CNPJ, ProductCard padronizado. Remover hero antigo (capa.png/Hero com foto de stock).
- Referências do nicho: Mercadoce, Doce Center, Doces Vaz, Sul Doce (distribuidora limpa, branca, densa, com confiança).

### Onda 2 do ERP (depois) — substituir o retaguarda.app
Cliente vai SAIR do ERP retaguarda. Roadmap: Fundação (Fornecedores + Entrada de mercadoria + inventário) → **Fiscal NF-e/NFC-e** (provedor Focus/PlugNotas/NFe.io + certificado A1 + contador = portão legal) → operação (tabelas de preço, promoções agendadas, etiquetas, manutenção em massa) → financeiro/BI (plano de contas, DRE, comissões). Começar por **Entrada de Mercadoria + Fornecedores**.

## 5. Verificação a cada etapa
`npx tsc --noEmit` + `npm test` + `npm run build` antes de commitar. (No Windows: parar o dev antes de `db push`/`build` por causa do lock da DLL do Prisma.)
