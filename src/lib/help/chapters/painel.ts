import type { Chapter } from "../types";

export const painel: Chapter = {
  slug: "painel",
  title: "Painel e organização do catálogo",
  summary: "O Dashboard, o menu lateral e as categorias.",
  icon: "LayoutDashboard",
  keywords: ["dashboard", "inicio", "menu", "navegacao", "categoria", "alerta", "vencendo"],
  scope: "ambos",
  blocks: [
    { t: "h", text: "O Painel (Dashboard)" },
    { t: "path", text: "Menu lateral › Dashboard" },
    {
      t: "p",
      text: "É a tela de abertura: resumo de vendas e pedidos, e os alertas que exigem ação.",
    },
    {
      t: "table",
      head: ["Alerta", "O que fazer"],
      rows: [
        ["Estoque baixo / esgotado", "Produtos no limite ou zerados. Clique em 'ver todos' para a lista completa e programe a compra."],
        ["Validade próxima", "Produtos perto do vencimento. Priorize a venda ou faça promoção."],
      ],
    },
    {
      t: "p",
      text: "Os dois limites (quantas unidades é 'estoque baixo' e quantos dias antes avisar da validade) ficam em **Configurações**.",
    },

    { t: "h", text: "Por que o menu muda de um lugar para outro" },
    {
      t: "p",
      text: "O menu lateral mostra só o que faz sentido para você — e isso depende de duas coisas:",
    },
    {
      t: "list",
      items: [
        "**Suas permissões** — cada pessoa vê apenas as áreas liberadas no cadastro dela.",
        "**Onde você está** — no caixa instalado na loja o menu é enxuto (PDV, Conexão, Pedidos, Clientes, Configurações). Produtos, relatórios e financeiro ficam na **gestão online**.",
      ],
    },
    {
      t: "note",
      title: "Por que essa separação",
      text: "O caixa precisa ser rápido e funcionar sem internet; a gestão precisa ser acessível de qualquer lugar. Por isso o cadastro e os relatórios vivem online, e o caixa recebe tudo pronto pela sincronização.",
    },

    { t: "h", text: "Categorias" },
    { t: "path", text: "Menu lateral › Categorias" },
    {
      t: "p",
      text: "Organizam o catálogo e formam o menu e os filtros do site. Exige a permissão **Categorias**.",
    },
    {
      t: "steps",
      items: [
        "Digite o nome em **Nova categoria** e salve — o endereço no site é gerado sozinho.",
        "Use o **lápis** para renomear.",
        "Use as **setas ▲▼** para mudar a ordem em que aparecem no site.",
        "Use o selo **Ativa/Inativa** para esconder sem apagar.",
      ],
    },
    {
      t: "note",
      text: "É uma lista simples: **não existe subcategoria**. Categoria inativa some do site, mas os produtos dela continuam acessíveis.",
    },
    {
      t: "warn",
      title: "Excluir categoria não apaga produtos",
      text: "Os produtos apenas ficam **sem categoria** — e somem dos filtros do site até você classificá-los de novo. O botão avisa quantos serão desvinculados.",
    },
  ],
};
