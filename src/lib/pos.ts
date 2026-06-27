import type { PaymentMethod } from "@prisma/client";

// ============================================================
// PDV — funções PURAS de pagamento e caixa (sem DB/sessão).
// Dinheiro sempre em centavos. Backend é a fonte da verdade.
// ============================================================

export type PaymentInput = { method: PaymentMethod; amountCents: number };

export type PaymentBreakdown = {
  totalCents: number; // total da venda
  cashGivenCents: number; // dinheiro entregue pelo cliente
  nonCashCents: number; // soma das formas que não são dinheiro
  cashAppliedCents: number; // dinheiro que efetivamente entra no caixa (sem troco)
  changeCents: number; // troco a devolver
  paidCents: number; // total aplicado à venda (sem troco)
  remainingCents: number; // quanto ainda falta (>0 = incompleto)
  isComplete: boolean; // cobriu o total?
};

/**
 * Pagamento misto: várias formas para uma venda. Só DINHEIRO gera troco.
 * - nonCash: aplicado integralmente (cartão/PIX são cobrados no valor exato).
 * - cash: aplica-se só o necessário; o excedente vira troco.
 */
export function computePaymentBreakdown(
  totalCents: number,
  payments: PaymentInput[]
): PaymentBreakdown {
  const total = Math.max(0, Math.round(totalCents));

  let cashGivenCents = 0;
  let nonCashCents = 0;
  for (const p of payments) {
    const amt = Math.max(0, Math.round(p.amountCents));
    if (amt === 0) continue;
    if (p.method === "CASH") cashGivenCents += amt;
    else nonCashCents += amt;
  }

  const dueAfterNonCash = Math.max(0, total - nonCashCents);
  const cashAppliedCents = Math.min(cashGivenCents, dueAfterNonCash);
  const changeCents = Math.max(0, cashGivenCents - dueAfterNonCash);
  const paidCents = nonCashCents + cashAppliedCents;
  const remainingCents = Math.max(0, total - paidCents);

  return {
    totalCents: total,
    cashGivenCents,
    nonCashCents,
    cashAppliedCents,
    changeCents,
    paidCents,
    remainingCents,
    isComplete: remainingCents === 0,
  };
}

/**
 * Caixa esperado na gaveta = fundo de abertura + dinheiro de vendas
 * + suprimentos − sangrias. PURA (usada na reconciliação do fechamento).
 */
export function expectedCashCents(args: {
  openingFloatCents: number;
  cashSalesCents: number;
  suprimentosCents: number;
  sangriasCents: number;
}): number {
  return (
    args.openingFloatCents +
    args.cashSalesCents +
    args.suprimentosCents -
    args.sangriasCents
  );
}
