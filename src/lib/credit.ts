import { prisma } from "./prisma";
import type { CreditTxType, PaymentMethod } from "@prisma/client";

// ============================================================
// Crediário / Fiado.
// Saldo devedor = soma(CHARGE) − soma(PAYMENT).
// REGIME DE CAIXA: a venda no fiado NÃO reconhece receita; a receita só
// entra no RECEBIMENTO (registerCreditPayment cria um FinancialEntry PAID).
// Quando o cliente quita tudo, os pedidos em aberto viram CONFIRMED.
// ============================================================

type Tx = { type: CreditTxType; amountCents: number };

/** Saldo (positivo = cliente deve; negativo = crédito a favor). PURA. */
export function creditBalanceCents(txs: Tx[]): number {
  return txs.reduce(
    (s, t) => s + (t.type === "CHARGE" ? t.amountCents : -t.amountCents),
    0
  );
}

export type CreditSummary = {
  limitCents: number;
  owedCents: number; // saldo devedor (nunca negativo)
  availableCents: number; // limite − devido (nunca negativo)
};

/** Resumo do crédito a partir do limite e dos lançamentos. PURA. */
export function summarizeCredit(limitCents: number, txs: Tx[]): CreditSummary {
  const owedCents = Math.max(0, creditBalanceCents(txs));
  return {
    limitCents,
    owedCents,
    availableCents: Math.max(0, limitCents - owedCents),
  };
}

/** Resumo de crédito do cliente (limite + saldo) lido do banco. */
export async function getCustomerCreditSummary(
  customerId: string
): Promise<CreditSummary> {
  const [customer, txs] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { creditLimitCents: true },
    }),
    prisma.creditTransaction.findMany({
      where: { customerId },
      select: { type: true, amountCents: true },
    }),
  ]);
  return summarizeCredit(customer?.creditLimitCents ?? 0, txs);
}

export type CreditResult = { ok: boolean; error?: string };

/**
 * Lança a venda no fiado: valida o crédito disponível e cria o CHARGE
 * vinculado ao pedido. NÃO reconhece receita (regime de caixa).
 * O pedido em si (status/pagamento) é criado por quem chama (PDV).
 */
export async function registerCreditSale(opts: {
  customerId: string;
  orderId: string;
  amountCents: number;
  createdBy?: string | null;
}): Promise<CreditResult> {
  if (!Number.isInteger(opts.amountCents) || opts.amountCents <= 0) {
    return { ok: false, error: "Valor inválido" };
  }
  const summary = await getCustomerCreditSummary(opts.customerId);
  if (summary.limitCents <= 0) {
    return { ok: false, error: "Cliente sem limite de crédito liberado." };
  }
  if (opts.amountCents > summary.availableCents) {
    return { ok: false, error: "Crédito insuficiente para esta venda." };
  }

  await prisma.creditTransaction.create({
    data: {
      customerId: opts.customerId,
      type: "CHARGE",
      amountCents: opts.amountCents,
      orderId: opts.orderId,
      createdBy: opts.createdBy ?? null,
    },
  });
  return { ok: true };
}

/**
 * Recebe um pagamento do fiado. Reconhece a receita (FinancialEntry PAID,
 * regime de caixa) e, se quitar todo o saldo, confirma os pedidos em aberto
 * (paymentStatus PENDING + STORE_CREDIT → CONFIRMED).
 * Nunca recebe mais que o saldo devedor.
 */
export async function registerCreditPayment(opts: {
  customerId: string;
  amountCents: number;
  method: PaymentMethod;
  createdBy?: string | null;
  notes?: string | null;
}): Promise<CreditResult & { appliedCents?: number }> {
  if (!Number.isInteger(opts.amountCents) || opts.amountCents <= 0) {
    return { ok: false, error: "Valor inválido" };
  }
  const customer = await prisma.customer.findUnique({
    where: { id: opts.customerId },
    select: { id: true, name: true },
  });
  if (!customer) return { ok: false, error: "Cliente não encontrado" };

  const summary = await getCustomerCreditSummary(opts.customerId);
  if (summary.owedCents <= 0) {
    return { ok: false, error: "Cliente não tem saldo devedor." };
  }
  // Nunca recebe mais que o devido.
  const applied = Math.min(opts.amountCents, summary.owedCents);
  const now = new Date();
  const fullyPaid = applied >= summary.owedCents;

  await prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        customerId: opts.customerId,
        type: "PAYMENT",
        amountCents: applied,
        method: opts.method,
        notes: opts.notes ?? null,
        createdBy: opts.createdBy ?? null,
      },
    });

    // Receita reconhecida no recebimento (regime de caixa).
    await tx.financialEntry.create({
      data: {
        type: "RECEIVABLE",
        status: "PAID",
        category: "venda",
        description: `Recebimento de fiado — ${customer.name}`,
        amountCents: applied,
        dueDate: now,
        paidAt: now,
      },
    });

    // Quitou tudo: confirma os pedidos fiado em aberto.
    if (fullyPaid) {
      await tx.order.updateMany({
        where: {
          customerId: opts.customerId,
          paymentMethod: "STORE_CREDIT",
          paymentStatus: "PENDING",
        },
        data: { paymentStatus: "CONFIRMED", paidAt: now },
      });
    }
  });

  return { ok: true, appliedCents: applied };
}

/** Total a receber em fiado (saldo devedor somado de todos os clientes). */
export async function getTotalOutstandingCredit(): Promise<number> {
  const grouped = await prisma.creditTransaction.groupBy({
    by: ["type"],
    _sum: { amountCents: true },
  });
  let charge = 0;
  let payment = 0;
  for (const g of grouped) {
    if (g.type === "CHARGE") charge = g._sum.amountCents ?? 0;
    else payment = g._sum.amountCents ?? 0;
  }
  return Math.max(0, charge - payment);
}
