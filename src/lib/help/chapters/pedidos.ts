import type { Chapter } from "../types";

export const pedidos: Chapter = {
  slug: "pedidos",
  title: "Pedidos e separação",
  summary: "Status, separação por QR Code, impressão, NF e estorno.",
  icon: "ShoppingCart",
  keywords: ["status", "separar", "picking", "qr code", "estorno", "reembolso", "nota fiscal", "enviar"],
  scope: "ambos",
  blocks: [
    { t: "path", text: "Menu lateral › Pedidos" },
    { t: "p", text: "Exige a permissão **Pedidos**. Reúne os pedidos do site e as vendas do balcão (marcadas com o selo **Balcão** e o nome do operador)." },

    { t: "h", text: "Os status do pedido" },
    {
      t: "table",
      head: ["Status", "O que significa"],
      rows: [
        ["Aguardando pagamento", "Pedido criado, pagamento ainda não confirmado."],
        ["Pago", "Pagamento confirmado. Entra na fila de separação."],
        ["Em separação", "A equipe está separando os itens."],
        ["Pronto pra envio", "Separado, aguardando saída."],
        ["Enviado", "A caminho do cliente."],
        ["Entregue", "Finalizado."],
        ["Cancelado", "Pedido cancelado."],
        ["Estornado", "Valor devolvido ao cliente."],
      ],
    },
    {
      t: "p",
      text: "O caminho normal é: **Pago → Em separação → Pronto pra envio → Enviado → Entregue**. O botão **Avançar** só aparece quando o pagamento já está confirmado.",
    },
    {
      t: "note",
      text: "Não existe botão de 'marcar como pago' manualmente. O pagamento é confirmado pelo sistema de pagamento do site ou pela venda no PDV.",
    },

    { t: "h", text: "Separação pelo celular (QR Code)" },
    {
      t: "p",
      text: "Cada pedido tem um QR Code próprio que abre a tela de separação no celular do funcionário do estoque — sem precisar de login.",
    },
    {
      t: "steps",
      items: [
        "Abra o pedido e clique em **QR Separação** (ou imprima a folha, que já traz o QR).",
        "O separador aponta a câmera do celular para o QR.",
        "Ele toca em cada item conforme separa; a barra de progresso mostra quanto falta.",
        "Ao marcar o primeiro item, o pedido vira **Em separação** automaticamente.",
        "Com todos marcados, o botão **Finalizar separação** libera e o pedido vira **Pronto pra envio**.",
      ],
    },
    {
      t: "warn",
      title: "O link de separação não pede senha",
      text: "Quem tiver o link ou o QR consegue marcar itens e finalizar a separação daquele pedido. O endereço é secreto e único por pedido, mas trate-o como uma chave: não publique nem mande para fora da equipe.",
    },

    { t: "h", text: "Imprimir" },
    {
      t: "table",
      head: ["Botão", "O que sai"],
      rows: [
        ["Imprimir", "Folha de separação A4: dados da loja e do cliente, endereço, QR Code, lista de itens com quadradinho para marcar, e campos para assinatura de quem separou e conferiu."],
        ["QR Separação", "Página só com o QR grande, para mostrar numa tela ou imprimir à parte."],
      ],
    },

    { t: "h", text: "Emitir NF" },
    {
      t: "warn",
      title: "Não é nota fiscal eletrônica de verdade",
      text: "O botão **Emitir NF** gera um **comprovante interno de venda** com numeração própria — ele **não** é transmitido à SEFAZ e não substitui a NF-e oficial. O próprio documento impresso avisa isso. Para emitir NF-e de verdade é preciso contratar um provedor fiscal e um certificado digital A1.",
    },

    { t: "h", text: "Cancelar" },
    {
      t: "p",
      text: "Só é possível cancelar pedidos em **Aguardando pagamento**, **Pago**, **Em separação** ou **Pronto pra envio**. Depois de enviado, não. O motivo é obrigatório e fica no histórico.",
    },

    { t: "h", text: "Estornar pagamento" },
    {
      t: "p",
      text: "Disponível para pedidos pagos. O sistema sugere dois valores:",
    },
    {
      t: "table",
      head: ["Opção", "Quando usar"],
      rows: [
        ["Líquido", "Devolve o valor **menos a taxa** que a operadora reteve — a taxa não volta para a loja num estorno. Evita prejuízo."],
        ["Total", "Devolve o valor cheio, a loja absorve a taxa."],
      ],
    },
    {
      t: "p",
      text: "O estorno devolve os itens ao estoque, reverte a receita no Financeiro e marca o pedido como Estornado. Depois, aparece um botão pronto para avisar o cliente pelo WhatsApp.",
    },
    {
      t: "warn",
      title: "Estorno não tem desfazer",
      text: "A ação é definitiva. Confirme o valor antes.",
    },
    {
      t: "tip",
      title: "Pagou mas não confirmou?",
      text: "Se o cliente pagou e o pedido continua pendente, use **Sincronizar com Stripe** na tela do pedido: o sistema consulta o pagamento e corrige o status.",
    },

    { t: "h", text: "Encontrar um pedido" },
    {
      t: "p",
      text: "O filtro padrão é **Em aberto** (tudo que ainda precisa de ação). Há um filtro por status e busca por número do pedido, nome ou e-mail do cliente. A lista traz até 100 pedidos.",
    },
  ],
};
