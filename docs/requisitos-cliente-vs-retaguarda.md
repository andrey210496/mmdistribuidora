# Requisitos do cliente (reunião 2026-06-23) × Retaguarda × PDV-MM

> Paralelo entre o que a MM pediu na reunião, o que o ERP atual (retaguarda) faz e o que o nosso PDV-MM já tem — com a ação para implantar.
> Legenda: ✅ pronto · 🟡 parcial · 🔴 a fazer.

## Decisões da reunião (confirmadas)
- **Clube: NÃO usar** (por enquanto). Cliente achou que bagunça (preço já é fixo/baixo). Já removido. *Obs.: pode voltar no futuro.*
- **Parcelamento: NÃO** (nem site nem PDV). Só à vista: dinheiro, Pix, débito, crédito à vista. → ajustar (hoje temos campo de parcelamento mín. em Config).
- **Frete: manual** (eles definem valor, podem lucrar na entrega). ✅ já é manual.
- **Pedido no WhatsApp: NÃO** vender por lá — só IA informativa mandando pro site. (fora de escopo agora)
- **Multi-loja:** Suzano e Mogi, **independentes, domínios separados** (`mmdistribuidora...suzano`, `...mogi`). 🔴

---

## 1. PDV / Frente de caixa (prioridade do cliente)
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 1.1 | **Operar por teclado, sem mouse**: F1 dinheiro, F2 débito, F3 crédito, F4 Pix | sim | 🟡 atalhos configuráveis (F2/F4/F6/F8) | Definir defaults F1–F4 p/ formas de pagamento; garantir fluxo 100% teclado |
| 1.2 | **Passo fiscal ANTES do pagamento**: F1 = não-fiscal, F2 = cupom fiscal → depois formas de pgto → Enter finaliza | sim | 🔴 | Inserir etapa "fiscal/não-fiscal" antes do pagamento no PDV |
| 1.3 | **Pagamento misto** (ex.: R$100 dinheiro + R$5 Pix) com troco | sim | ✅ | ok |
| 1.4 | **Imprimir: escolher A4 ou térmica** (passar modelos das impressoras) | sim | 🔴 (só cupom 80mm) | Suporte a 2 layouts/impressoras (A4 e térmica) |
| 1.5 | **Imprimir última nota / reimprimir / cancelar pedido** (botões) | sim | 🔴 | Botões de reimpressão e cancelamento no PDV |
| 1.6 | **PDV funciona OFFLINE** (internet cai e não pode parar de vender) — querem **app instalável** | ✅ (PDV é local) | 🔴 (web, só online) | **GRANDE**: PDV offline (PWA c/ fila local + sync, ou app desktop). Avaliar custo. |
| 1.7 | Busca por nome/SKU/código de barras (bipar) | sim | ✅ | ok |
| 1.8 | Vincular/cadastrar cliente rápido; marcar atacado | sim | ✅ | ok |
| 1.9 | Fiado/crediário no PDV | sim | ✅ | ok |

## 2. Preços (ponto sensível)
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 2.1 | **Preço por forma de pagamento** (dinheiro mais barato, cartão mais caro, Pix outro) | sim (tabela de preços) | 🔴 (preço único) | **Preço por meio de pagamento** no produto/tabela |
| 2.2 | **Preço fixo por cliente por produto** (cliente forte tem preço próprio em cada item; NÃO é %) — evita erro humano de desconto na tela | parcial (tabelas) | 🔴 (só flag atacado) | **Lista de preço fixa por cliente**: cadastrar no cliente os produtos que ele leva + preço; ao vincular no PDV já sai o preço dele |
| 2.3 | Custo do produto → **mostra % de lucro/margem** ao digitar o preço | sim | 🟡 (temos custo, sem margem na tela) | Exibir margem/lucro no cadastro de produto |
| 2.4 | Preço de atacado por quantidade | sim | ✅ | ok |

## 3. Produtos / Estoque
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 3.1 | **Grupo Tributário + NCM** no produto (já vem tabela pronta) — "muito importante" p/ fiscal | sim | 🔴 | Campos fiscais no produto + tabela de grupos tributários |
| 3.2 | **Unidade de medida + conversão** (lançam por kg, vendem por pacote; 1 pacote = 2kg; 10 pacotes = 1 fardo) | sim | 🔴 | Unidade de medida + fator de conversão fardo/pacote/un/kg |
| 3.3 | EAN/código de barras | sim | ✅ | ok |
| 3.4 | Alerta estoque baixo + validade (configurável) | sim | ✅ | ok |
| 3.5 | **Inventário / ajuste de estoque** (contagem, entrada/saída manual) | sim | 🔴 | Módulo de inventário |
| 3.6 | Foto do produto (aparece no site) | sim | ✅ | ok |
| 3.7 | Categorias/subcategorias | sim | 🟡 (só categoria) | Adicionar subcategoria/marca (opcional) |

## 4. Entrada de mercadoria / Compras
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 4.1 | **Entrada por NF-e (XML)**: bipa/importa a nota → puxa produtos, quantidades, tudo | sim (Importar NF-e) | 🔴 | **Importação de XML de NF-e** de entrada (atualiza estoque/custo) |
| 4.2 | Notas **não-fiscais**: lançar (idealmente importar também) | sim | 🔴 | Entrada manual + tentar import |
| 4.3 | Fornecedores | sim | 🔴 | Cadastro de fornecedores |
| 4.4 | Pedido de compra | sim | 🔴 | (fase posterior) |

## 5. Vendas B2B / Entrega
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 5.1 | **Pedido de Venda** (atacado/entrega) com detalhe de produto | sim | 🟡 (pedidos do site) | Fluxo de pedido de venda B2B + impressão p/ entrega |
| 5.2 | **Observação por item** (ex.: "3 fardos", "1 fardo=10 pacotes") p/ o entregador não errar | parcial | 🔴 | Campo de observação por item no pedido/venda |

## 6. Financeiro / Relatórios
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 6.1 | Financeiro (receber/pagar, lucro, margem, DRE) | sim | 🟡 (dashboard financeiro) | Completar (plano de contas/DRE) |
| 6.2 | **Relatórios** — destaque: **produtos vendidos por período** (semana/mês/ano), quanto saiu de cada item | sim (muito completo) | 🔴 | Seção de relatórios (vendas por produto/período, etc.) |
| 6.3 | Lançar conta a pagar/receber manual | sim | ✅ | ok |

## 7. Fiscal (portão legal)
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 7.1 | **NFC-e (cupom fiscal) + NF-e** — já têm certificado | sim | 🔴 | Integração fiscal (provedor + certificado A1 + contador). Depende de 3.1 (NCM/grupo tributário) |

## 8. Admin / Operação
| # | Cliente pediu | Retaguarda | PDV-MM hoje | Ação |
|---|---|---|---|---|
| 8.1 | Colaboradores com permissão por função | sim | ✅ | ok |
| 8.2 | Config home do site (seções), anúncios/popup | — | ✅ | ok (diferencial nosso: e-commerce) |
| 8.3 | Multi-loja (2 lojas, domínios separados) | sim (multi-empresa) | 🔴 | Deploy separado por loja (ou multi-tenant) |

---

## Roadmap sugerido (ordem de implantação)
**Fase 1 — deixar o PDV/retaguarda "redondo" (pedido nº1 do cliente):**
1. PDV: passo fiscal/não-fiscal antes do pagamento + atalhos F1–F4 (1.1, 1.2); reimpressão/cancelar (1.5); impressão A4/térmica (1.4).
2. Observação por item (5.2). Tirar parcelamento (decisão).
3. **Preço por cliente (lista fixa)** (2.2) e **preço por forma de pagamento** (2.1) — atacam o erro humano que mais incomoda.
4. Margem/lucro na tela de produto (2.3).

**Fase 2 — compras/estoque:**
5. Fornecedores + **Entrada de Mercadoria por XML** (4.1–4.3); Inventário (3.5); Unidade/conversão (3.2).

**Fase 3 — relatórios + fiscal:**
6. Relatórios (6.2). 7. Grupo Tributário/NCM (3.1) → **NFC-e/NF-e** (7.1).

**Fase 4 — infra:**
8. PDV OFFLINE (1.6) — avaliar abordagem/custo (PWA vs app). 9. Multi-loja/domínios (8.3).

## ⚠️ Pontos que exigem decisão/custo
- **PDV offline** (1.6): muda a arquitetura (hoje é web online). Maior esforço/custo — alinhar abordagem.
- **Fiscal** (7.1): provedor + certificado A1 + contador (custo recorrente).
- **Multi-loja** (8.3): 2 deploys/domínios + VPS.
- O cliente vai **gravar vídeo do retaguarda** e dar **acesso de leitura** ao sistema deles — usar para detalhar relatórios e fluxos.
