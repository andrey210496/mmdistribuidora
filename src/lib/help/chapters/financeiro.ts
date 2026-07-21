import type { Chapter } from "../types";

export const financeiro: Chapter = {
  slug: "financeiro",
  title: "Financeiro e relatórios",
  summary: "Contas a pagar e receber, lucro, margem e vendas por período.",
  icon: "CreditCard",
  keywords: ["caixa", "faturamento", "despesa", "lucro", "margem", "cmv", "ticket medio", "a pagar", "a receber"],
  scope: "online",
  blocks: [
    { t: "h", text: "Financeiro" },
    { t: "path", text: "Menu lateral › Financeiro" },
    {
      t: "p",
      text: "Exige a permissão **Financeiro**. Trabalha em **regime de caixa**: o valor conta no dia em que foi efetivamente pago ou recebido, não na data da venda.",
    },
    {
      t: "note",
      title: "Por que a venda no fiado não aparece no faturamento",
      text: "É consequência do regime de caixa: a venda fiado só vira receita quando o cliente **paga**. Até lá ela fica em 'A receber em fiado'.",
    },

    { t: "h", text: "Os números do topo" },
    {
      t: "table",
      head: ["Indicador", "Como é calculado"],
      rows: [
        ["Faturamento recebido", "Tudo que entrou no período. Mostra a variação em relação ao período anterior."],
        ["Despesas pagas", "Tudo que saiu no período."],
        ["Resultado (caixa)", "Faturamento menos despesas."],
        ["Ticket médio", "Valor total dos pedidos pagos ÷ número de pedidos pagos."],
        ["A receber (em aberto)", "Contas a receber ainda não liquidadas. Independe do período escolhido."],
        ["A pagar (em aberto)", "Contas a pagar ainda não liquidadas. Independe do período escolhido."],
        ["A receber em fiado", "Soma das dívidas de todos os clientes."],
        ["Contas vencidas", "Contas a pagar com vencimento no passado."],
        ["Perdas (estornos)", "Valor devolvido a clientes no período."],
      ],
    },
    {
      t: "p",
      text: "O filtro de período tem quatro opções: **Este mês** (padrão), **30 dias**, **Este ano** e **Tudo**.",
    },

    { t: "h", text: "Rentabilidade" },
    {
      t: "p",
      text: "Mostra **receita de produtos**, **custo (CMV)**, **lucro bruto** e **margem**. Depende do custo cadastrado nos produtos.",
    },
    {
      t: "warn",
      text: "Se aparecer o aviso pedindo para cadastrar o custo dos produtos, os números de lucro e margem estão **incorretos** — sem custo, o sistema calcula como se tudo fosse lucro.",
    },

    { t: "h", text: "Lançamentos manuais" },
    {
      t: "p",
      text: "Serve para registrar o que não vem de venda: aluguel, salários, marketing, impostos, embalagens.",
    },
    {
      t: "steps",
      items: [
        "Em **Novo lançamento**, escolha **A pagar** ou **A receber**.",
        "Preencha descrição, categoria, valor e vencimento.",
        "Marque **Já foi pago/recebido** se a conta já foi quitada.",
      ],
    },
    {
      t: "table",
      head: ["Ação", "Quando aparece"],
      rows: [
        ["Liquidar", "Marca a conta como paga hoje."],
        ["Cancelar", "Anula o lançamento."],
        ["Desfazer liquidação", "Só para lançamentos que não são de uma venda realmente paga."],
        ["Excluir", "Só para lançamentos **manuais** — os gerados por vendas nunca podem ser excluídos."],
      ],
    },
    {
      t: "note",
      text: "Confirmar uma entrada de mercadoria cria automaticamente uma **conta a pagar** ao fornecedor.",
    },

    { t: "h", text: "Relatórios" },
    { t: "path", text: "Menu lateral › Relatórios" },
    {
      t: "p",
      text: "Exige a permissão **Relatórios**. Todos consideram apenas pedidos **pagos**, pela data do pagamento.",
    },
    {
      t: "table",
      head: ["Relatório", "O que mostra"],
      rows: [
        ["Faturamento por dia", "Gráfico dos últimos 14 dias. **Sempre 14 dias — ignora o filtro de período.**"],
        ["Por forma de pagamento", "Quanto entrou em dinheiro, Pix, débito, crédito e fiado."],
        ["Por canal", "Quanto veio do balcão (PDV) e quanto da loja online."],
        ["Produtos vendidos", "Os 50 produtos mais vendidos, com quantidade, faturamento, lucro e margem."],
      ],
    },
    {
      t: "note",
      text: "Os relatórios **não têm exportação** para Excel/CSV/PDF, e o único filtro é o de período (os quatro pré-definidos). Para levar os dados para fora, use a impressão do navegador.",
    },

    { t: "h", text: "Vendas por operador" },
    { t: "path", text: "Menu lateral › PDVs / Operadores" },
    {
      t: "p",
      text: "Mostra quanto cada pessoa vendeu — hoje e no mês — e o ticket médio de cada uma. Também lista os **caixas conectados**, com a versão instalada e há quanto tempo cada máquina apareceu (online = visto nos últimos 3 minutos).",
    },
    {
      t: "tip",
      text: "Para isso funcionar, cada pessoa precisa ter o **próprio usuário**. Login compartilhado junta todas as vendas numa pessoa só.",
    },
  ],
};
