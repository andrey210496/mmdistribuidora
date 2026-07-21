import type { Chapter } from "../types";

export const clientes: Chapter = {
  slug: "clientes",
  title: "Clientes, atacado e fiado",
  summary: "Cadastro, preços especiais, limite de crédito e recebimento de dívida.",
  icon: "Users",
  keywords: ["crediario", "divida", "limite", "atacadista", "preco especial", "ltv", "cpf"],
  scope: "ambos",
  blocks: [
    { t: "path", text: "Menu lateral › Clientes" },
    { t: "p", text: "Exige a permissão **Clientes**." },

    { t: "h", text: "Cadastrar um cliente" },
    { t: "path", text: "Clientes › botão Novo cliente" },
    {
      t: "table",
      head: ["Campo", "Obrigatório", "Observação"],
      rows: [
        ["Nome", "Sim", "Mínimo de 2 caracteres."],
        ["Telefone", "Não", "Vira link de WhatsApp na ficha."],
        ["CPF / CNPJ", "Não", "Não pode repetir entre clientes."],
        ["E-mail", "Não", "Não pode repetir entre clientes."],
        ["Limite de crédito (fiado)", "Não", "Vazio ou 0 = cliente não compra fiado."],
        ["Cliente atacadista", "Não", "Passa a pagar preço de atacado sempre."],
      ],
    },
    {
      t: "p",
      text: "Ao salvar, você cai direto na ficha do cliente — que é onde ficam os preços especiais e o crediário.",
    },
    {
      t: "warn",
      title: "Confira os dados antes de salvar",
      text: "Hoje **não existe tela para editar nome, telefone, e-mail ou CPF** depois de criado. Só é possível alterar atacado, limite de crédito e preços especiais. Corrigir um CPF digitado errado exige suporte técnico.",
    },
    {
      t: "tip",
      text: "No PDV também dá para cadastrar rápido (só nome e telefone) sem sair da venda, pelo link **+ cadastrar novo cliente**.",
    },

    { t: "h", text: "A ficha do cliente" },
    {
      t: "p",
      text: "Mostra quatro números no topo: **total de pedidos**, **pedidos pagos**, **LTV** (tudo que ele já pagou) e **ticket médio**. Abaixo, o histórico completo de pedidos; na lateral, crediário, atacado, preços fixos e endereços salvos.",
    },

    { t: "h", text: "Cliente atacadista" },
    {
      t: "p",
      text: "É uma chave liga/desliga na ficha. Ligada, o cliente paga o preço de atacado **em qualquer quantidade**, no balcão e no site.",
    },
    {
      t: "note",
      text: "Cliente comum também ganha o preço de atacado se comprar a quantidade mínima configurada no produto. A marcação de atacadista serve para dispensar essa quantidade mínima.",
    },

    { t: "h", text: "Preços especiais por produto" },
    {
      t: "p",
      text: "É a lista de produtos com preço próprio daquele cliente — o famoso 'preço do fulano'. Aplicado sozinho no PDV e no site.",
    },
    {
      t: "steps",
      items: [
        "Na ficha do cliente, vá em **Preços fixos deste cliente**.",
        "Busque o produto por nome, SKU ou código de barras.",
        "O campo já vem preenchido com o preço normal — altere para o preço do cliente.",
        "Clique em **Salvar**. Para remover, use o ícone de lixeira.",
      ],
    },
    {
      t: "warn",
      title: "O preço fixo vence todos os outros",
      text: "Inclusive o de atacado e o de promoção. E ele vale **mesmo se for mais caro** que o preço normal — o sistema não impede isso. Revise antes de salvar.",
    },

    { t: "h", text: "Crediário (fiado)" },
    {
      t: "p",
      text: "O painel de crediário mostra três números: **Limite** (quanto ele pode dever), **Devendo** (quanto deve agora) e **Disponível** (limite menos a dívida).",
    },
    {
      t: "steps",
      items: [
        "Clique em **definir limite de crédito** e informe o valor. Sem limite, o cliente não compra fiado.",
        "As vendas no fiado aparecem em **Vendas em aberto**, com número do pedido, data e valor.",
      ],
    },

    { t: "h", text: "Receber um pagamento de fiado" },
    {
      t: "p",
      text: "O botão **Receber pagamento** só aparece quando o cliente está devendo.",
    },
    {
      t: "steps",
      items: [
        "Clique em **Receber pagamento**.",
        "Digite o valor recebido.",
        "Escolha a forma: Dinheiro, PIX, Cartão de débito ou Cartão de crédito.",
        "Clique em **Confirmar**.",
      ],
    },
    {
      t: "p",
      text: "O recebimento **nunca aceita mais que a dívida**: se digitar um valor maior, o sistema aplica só o que era devido. É neste momento que o dinheiro entra como receita no Financeiro.",
    },
    {
      t: "warn",
      title: "Pagamento parcial não baixa pedido por pedido",
      text: "Os pedidos fiado só passam para 'Pago' quando a dívida **total** do cliente chega a zero — aí todos são confirmados de uma vez. Enquanto houver saldo, eles continuam pendentes mesmo com pagamento parcial feito.",
    },
    {
      t: "note",
      text: "Não é possível receber fiado com outro fiado, e não dá para 'adiantar' pagamento de quem não deve nada.",
    },

    { t: "h", text: "Buscar clientes" },
    {
      t: "p",
      text: "Um campo só, que procura ao mesmo tempo por nome, e-mail, CPF/CNPJ e telefone. A lista mostra até 100 clientes por vez.",
    },

    { t: "h", text: "Endereços" },
    {
      t: "note",
      text: "Os endereços que aparecem na ficha vêm das compras feitas pelo site. Não é possível cadastrar ou editar endereço pelo admin — é somente leitura.",
    },
  ],
};
