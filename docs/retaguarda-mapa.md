# Mapa do ERP Retaguarda (sistema atual da MM) — para substituição pelo PDV-MM

> Fonte: `https://sp01.retaguarda.app/distribuidoramm/sistema` (v4.01.19.048).
> Exploração via Chrome. Sistema recém-provisionado (pouca data) — foco na **estrutura/campos** de cada tela.
> Legenda: ✅ já temos no PDV-MM · 🟡 parcial · 🔴 não temos (gap).

## Visão geral
ERP de varejo fiscal (NFC-e/NF-e/SAT, CFOP, tributação), com compras, estoque, financeiro, multi-empresa/multi-PDV. Não tem e-commerce (vantagem nossa).

UI padrão dos cadastros: aba "Pesquisa Simples / Pesquisa Avançada", filtros, botões `Pesquisar` / `Adicionar X` / `Visualizar no Excel`, grid paginado.

---

## PARCEIROS
- **Clientes** 🟡 — pesquisa por Razão Social; Adicionar Cliente; export Excel. (Temos clientes, mas sem todos os campos fiscais/PJ.)
- **Fornecedores** 🔴 — mesma UI (pesquisa + Adicionar Fornecedor + Excel). Não temos cadastro de fornecedor.
- **Clientes Potenciais** 🔴 — CRM de prospects.
- **Funcionários** 🔴 — cadastro de colaboradores (RH/comissão), distinto de usuários do sistema.
- **Transportadoras** 🔴 — para frete/NF-e.
- **Representações** 🔴 — representantes comerciais.
- **Grupo de Parceiros** 🔴 — agrupamento/segmentação de clientes/fornecedores.

> Marcação: [aberto] = tela vista de fato · [menu] = caracterizado pelo menu + padrão de Uk.

## PRODUTOS E ESTOQUE
- **Produtos** [aberto] 🟡 — cadastro com: Tipo **EAN**/código, Descrição, **R$ Compra** + R$ Venda, Imagem, **Grupo Tributário**, **Unidade de Medida**, **Balança (pesável)**, **NCM**, **Inserção por Lista (lote)**, **Produto com Variações (grade)**. Busca por Categoria/Subcategoria/Marca/Tipo/NCM. (Temos produto simples; faltam variação, marca/subcategoria, unidade, balança, grupo tributário/NCM.)
- **Tabela de Preços** [aberto] 🟡 — **múltiplas tabelas nomeadas** (varejo/atacado/distribuidor). Temos só normal/atacado fixo por produto.
- **Categorias** [menu] ✅ — temos.
- **Subcategorias** [menu] 🔴 — 2º nível de categoria.
- **Marcas** [menu] 🔴.
- **Setores** [menu] 🔴 — setor/seção de loja.
- **Matéria-Prima** [menu] 🔴 — insumos para produção/composição.
- **Modificadores** [menu] 🔴 — adicionais/observações de item (food service).
- **Unidade de Medidas** [menu] 🔴 — UN, KG, CX, FD...
- **Tipo de Código** [menu] 🔴 — EAN/DUN/interno.
- **Promoções** [menu] 🟡 — temos "de/por" simples; eles têm módulo de promoções.
- **Inventário de Estoque** [menu] 🔴 — contagem/ajuste de estoque.
- **Manutenção em Massa** [menu] 🔴 — edição em lote de produtos (preço, etc.).
- **Produtos para Revenda / Serviços / Grupo de Comissionamento** [menu] 🔴.
- **N.C.M.** [menu] 🔴 — base fiscal de NCM (com alíquotas).

## SAÍDAS (vendas)
- **Pedido de Venda** [aberto] 🔴 — **fluxo B2B** (15 pedidos reais a lanchonetes/lojas); filtros por situação (pendente/aberta/bloqueada), PDV, natureza de operação. **Não temos pedido B2B** (só balcão + e-commerce).
- **Central de Vendas** [aberto] 🟡 — painel de acompanhamento por período/faturamento.
- **Orçamentos (PDV)** [menu] 🟡 — frente de PDV/orçamento (temos PDV balcão).
- **Pré Venda** [menu] 🔴 — separação/pré-venda antes do faturamento.
- **Acompanhamento - Pedidos** [menu] 🟡 — status de pedidos (temos em /admin/pedidos).
- **Análise do Negócio** [menu] 🟡 — BI (temos financeiro/dashboard).
- **Cupom Fiscal / NFC-e / NF-e / SAT CF-e** [menu] 🔴 — **emissão fiscal (gap crítico)**.

## ENTRADAS (compras)
- **Entrada de Mercadoria** [aberto] 🔴 — **Importar NF-e por XML**, Adicionar Entrada, situação (pendente/aberta/contingência), filtros, Excel. Tem 2 NF-e reais de fornecedores.
- **Pedido de Compra** [aberto] 🔴 — Adicionar + "Listar Pedidos do Club da Cotação" (compra coletiva/cotação).
- **NF-e de Entrada** [menu] 🔴 — gestão das NF-e recebidas.
- **Manifestos** [menu] 🔴 — manifestação do destinatário (MDF-e/manifesto NF-e).
- **Reposição de Estoque** [menu] 🔴 — sugestão/ordem de reposição.
- **Troca de Mercadoria** [menu] 🔴 — devolução/troca.

## FISCAL
- **Relatórios Fiscais / Retirada de Documentos** [menu] 🔴.
- **Config:** CFOP, Grupos Tributários, Naturezas de Operação, Regimes Tributários, Regras Tributárias [menu] 🔴 — toda a parametrização fiscal.

## FINANCEIRO
- **Despesas e Receitas** [menu] 🟡 — temos lançamentos a pagar/receber.
- **Plano de Contas** [menu] 🔴.
- **Grupo D.R.E.** [menu] 🔴 — estrutura de DRE.
- **Categoria de Lançamentos** [menu] 🟡.
- **Comissões / Minhas Comissões** [menu] 🔴.
- **Mini Financeiro** [menu] 🟡.

## FATURAMENTO
- **Formas de Pagamento** [menu] 🟡 — temos (PIX/cartão/dinheiro/fiado), mas sem administradoras/regimes.
- **Administradoras de Crédito** [menu] 🔴 — bandeiras/adquirentes + taxas.
- **Grupos/Regimes de Faturamento** [menu] 🔴.

## ADMINISTRAÇÃO
- **Empresas (multi-empresa)** [menu] 🔴.
- **Situação dos PDVs (multi-PDV)** [menu] 🔴.
- **Grupos de Permissões / Permissões de Acesso / Solicitações** [menu] 🟡 — temos permissões por área.
- **Revisões Pendentes / Todas as Movimentações** [menu] 🔴 — auditoria/aprovação.
- **Diretório Virtual / Gerenciar Rejeições** [menu] 🔴.
- **Gerenciar Sessões** [não aberto] — controle de login (não explorei p/ não derrubar acesso).

## UTILIDADES
- **Controle de Validade** [menu] 🔴.
- **Conversão de Produtos** [menu] 🔴 — fardo→unidade (relevante p/ distribuidora!).
- **Etiquetas** [menu] 🔴 — impressão de etiquetas/gôndola.
- **Gerenciar Tarefas** [menu] 🔴.

---

## Conclusão — prioridades para o PDV-MM substituir o Retaguarda
1. **Fiscal NFC-e/NF-e/SAT** (portão legal) — provedor + certificado A1 + contador.
2. **Compras:** Fornecedores + Pedido de Compra + **Entrada de Mercadoria com import de XML**.
3. **Estoque:** Inventário/ajuste, Controle de Validade, **Conversão fardo→unidade**, Etiquetas, Manutenção em massa.
4. **Produtos:** Marcas, Subcategorias, Unidade de medida, Variação/grade, pesáveis, múltiplas Tabelas de Preço.
5. **Vendas B2B:** Pedido de Venda (atacado), Pré-venda.
6. **Financeiro:** Plano de Contas + DRE + Comissões.
7. **Escala:** multi-PDV / multi-empresa (se necessário).

> Telas abertas de fato nesta exploração: Dashboard, Produtos (+cadastro), Tabela de Preços, Central de Vendas, Pedido de Venda, Pedido de Compra, Entrada de Mercadoria, Clientes, Fornecedores. As demais foram caracterizadas pelo menu + padrão de UI consistente — posso abrir qualquer uma em detalhe sob demanda.
