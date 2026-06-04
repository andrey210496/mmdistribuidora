import type { OrderStatus, PaymentStatus } from "@prisma/client";

// ============================================================
// Status de pedido — labels, cores, transições válidas
// ============================================================

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  PENDING_PAYMENT: {
    label: "Aguardando pagamento",
    color: "text-yellow-800",
    bg: "bg-yellow-100 border-yellow-300",
    description: "Pedido criado, aguardando confirmação do pagamento",
  },
  PAID: {
    label: "Pago",
    color: "text-olive",
    bg: "bg-olive/15 border-olive/40",
    description: "Pagamento confirmado, fila de separação",
  },
  SEPARATING: {
    label: "Em separação",
    color: "text-rose-brand",
    bg: "bg-rose-brand/15 border-rose-brand/40",
    description: "Equipe está separando os itens no estoque",
  },
  READY_TO_SHIP: {
    label: "Pronto pra envio",
    color: "text-caramel",
    bg: "bg-caramel/15 border-caramel/40",
    description: "Separado, aguardando coleta da transportadora",
  },
  SHIPPED: {
    label: "Enviado",
    color: "text-cocoa",
    bg: "bg-cocoa/15 border-cocoa/30",
    description: "Em trânsito até o destinatário",
  },
  DELIVERED: {
    label: "Entregue",
    color: "text-olive",
    bg: "bg-olive/20 border-olive/40",
    description: "Pedido entregue ao cliente",
  },
  CANCELED: {
    label: "Cancelado",
    color: "text-red-700",
    bg: "bg-red-100 border-red-300",
    description: "Pedido cancelado",
  },
  REFUNDED: {
    label: "Estornado",
    color: "text-red-700",
    bg: "bg-red-100 border-red-300",
    description: "Valor estornado ao cliente",
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-700" },
  CONFIRMED: { label: "Confirmado", color: "text-olive" },
  FAILED: { label: "Falhou", color: "text-red-700" },
  REFUNDED: { label: "Estornado", color: "text-red-700" },
};

// Transições válidas — qual o próximo status possível
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "SEPARATING",
  SEPARATING: "READY_TO_SHIP",
  READY_TO_SHIP: "SHIPPED",
  SHIPPED: "DELIVERED",
};

// Status que admin pode forçar (cancelamento)
export const CAN_CANCEL: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "SEPARATING",
  "READY_TO_SHIP",
];

export const ORDER_FLOW: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "SEPARATING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
};

export function nextStatusOf(s: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[s] ?? null;
}

export function canCancel(s: OrderStatus): boolean {
  return CAN_CANCEL.includes(s);
}
