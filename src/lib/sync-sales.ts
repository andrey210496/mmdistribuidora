import { prisma } from "./prisma";
import type { PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";

// ============================================================
// Sync SOBE (PDV -> online) — F5.3. Ver [[mm-arquitetura-f5]]
// ------------------------------------------------------------
// O PDV vende offline e enfileira. Este modulo empurra as vendas do balcao
// para a gestao ONLINE, que aplica de forma idempotente (por order.id), baixa
// o ESTOQUE REAL (fonte da verdade) e devolve o estoque atualizado para o PDV
// reconciliar. Vendas canceladas antes de subir viram registro cancelado
// (sem mexer em estoque/financeiro).
// ============================================================

export type SyncSaleItem = {
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  unitCostCents: number;
  costTotalCents: number;
  note: string | null;
};

export type SyncSalePayment = { method: PaymentMethod; amountCents: number };

export type SyncSaleCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  isWholesale: boolean;
  creditLimitCents: number;
};

export type SyncSale = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  shippingZip: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerCpfSnapshot: string | null;
  customerPhoneSnapshot: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  amountReceivedCents: number | null;
  changeCents: number | null;
  fiscal: boolean;
  station: string | null;
  soldById: string | null;
  soldByName: string | null;
  canceledAt: string | null;
  canceledReason: string | null;
  createdAt: string;
  onCredit: boolean;
  creditChargeCents: number | null;
  customer: SyncSaleCustomer;
  items: SyncSaleItem[];
  payments: SyncSalePayment[];
};

export type SalesPushRequest = { sales: SyncSale[] };
export type SalesPushResponse = {
  ok: boolean;
  acked: string[]; // order.ids aplicados (ou ja existentes)
  stock: { productId: string; stock: number }[]; // estoque autoritativo p/ reconciliar
};

// ---- LADO PDV: monta a fila de vendas ainda nao enviadas ----
export async function buildSalesToPush(limit = 50): Promise<SyncSale[]> {
  const orders = await prisma.order.findMany({
    where: { channel: "PDV", syncedToOnline: false },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      items: true,
      payments: true,
      creditTransactions: { where: { type: "CHARGE" } },
      customer: true,
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    status: o.status,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    shippingCents: o.shippingCents,
    totalCents: o.totalCents,
    shippingZip: o.shippingZip,
    shippingStreet: o.shippingStreet,
    shippingNumber: o.shippingNumber,
    shippingComplement: o.shippingComplement,
    shippingNeighborhood: o.shippingNeighborhood,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    customerNameSnapshot: o.customerNameSnapshot,
    customerEmailSnapshot: o.customerEmailSnapshot,
    customerCpfSnapshot: o.customerCpfSnapshot,
    customerPhoneSnapshot: o.customerPhoneSnapshot,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    amountReceivedCents: o.amountReceivedCents,
    changeCents: o.changeCents,
    fiscal: o.fiscal,
    station: o.station,
    soldById: o.soldById,
    soldByName: o.soldByName,
    canceledAt: o.canceledAt ? o.canceledAt.toISOString() : null,
    canceledReason: o.canceledReason,
    createdAt: o.createdAt.toISOString(),
    onCredit: o.paymentMethod === "STORE_CREDIT",
    creditChargeCents: o.creditTransactions[0]?.amountCents ?? null,
    customer: {
      id: o.customer.id,
      name: o.customer.name,
      email: o.customer.email,
      cpfCnpj: o.customer.cpfCnpj,
      phone: o.customer.phone,
      isWholesale: o.customer.isWholesale,
      creditLimitCents: o.customer.creditLimitCents,
    },
    items: o.items.map((it) => ({
      productId: it.productId,
      productNameSnapshot: it.productNameSnapshot,
      productSkuSnapshot: it.productSkuSnapshot,
      unitPriceCents: it.unitPriceCents,
      quantity: it.quantity,
      totalCents: it.totalCents,
      unitCostCents: it.unitCostCents,
      costTotalCents: it.costTotalCents,
      note: it.note,
    })),
    payments: o.payments.map((p) => ({ method: p.method, amountCents: p.amountCents })),
  }));
}

// ---- LADO ONLINE: aplica as vendas recebidas (idempotente por id) ----
export async function applySalesPush(sales: SyncSale[]): Promise<SalesPushResponse> {
  const acked: string[] = [];
  const touchedProducts = new Set<string>();

  for (const s of sales) {
    try {
      const existing = await prisma.order.findUnique({ where: { id: s.id }, select: { id: true } });
      if (existing) {
        acked.push(s.id); // ja aplicada -> so confirma
        continue;
      }
      const canceled = s.status === "CANCELED";
      const paidAt = s.paidAt ? new Date(s.paidAt) : null;
      const createdAt = new Date(s.createdAt);

      // Dedup do numero: se OUTRA estacao ja usou este orderNumber (id diferente),
      // acrescenta um sufixo p/ nao violar o unique e travar a fila. Acontece quando
      // dois PDVs ficaram com a mesma estacao.
      let orderNumber = s.orderNumber;
      const clash = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
      if (clash && clash.id !== s.id) orderNumber = `${s.orderNumber}-${s.id.slice(-4)}`;

      await prisma.$transaction(async (tx) => {
      // 1) garante o cliente (pode ter sido criado offline no PDV)
      await tx.customer.upsert({
        where: { id: s.customer.id },
        update: {
          name: s.customer.name,
          email: s.customer.email,
          cpfCnpj: s.customer.cpfCnpj,
          phone: s.customer.phone,
          isWholesale: s.customer.isWholesale,
          creditLimitCents: s.customer.creditLimitCents,
        },
        create: {
          id: s.customer.id,
          name: s.customer.name,
          email: s.customer.email,
          cpfCnpj: s.customer.cpfCnpj,
          phone: s.customer.phone,
          isWholesale: s.customer.isWholesale,
          creditLimitCents: s.customer.creditLimitCents,
        },
      });

      // 2) cria a venda (preserva id, numero e data reais do PDV; cashSessionId
      //    fica nulo — a sessao de caixa e um conceito local do PDV)
      await tx.order.create({
        data: {
          id: s.id,
          orderNumber,
          customerId: s.customerId,
          channel: "PDV",
          status: s.status,
          subtotalCents: s.subtotalCents,
          discountCents: s.discountCents,
          shippingCents: s.shippingCents,
          totalCents: s.totalCents,
          shippingZip: s.shippingZip,
          shippingStreet: s.shippingStreet,
          shippingNumber: s.shippingNumber,
          shippingComplement: s.shippingComplement,
          shippingNeighborhood: s.shippingNeighborhood,
          shippingCity: s.shippingCity,
          shippingState: s.shippingState,
          customerNameSnapshot: s.customerNameSnapshot,
          customerEmailSnapshot: s.customerEmailSnapshot,
          customerCpfSnapshot: s.customerCpfSnapshot,
          customerPhoneSnapshot: s.customerPhoneSnapshot,
          paymentMethod: s.paymentMethod,
          paymentStatus: s.paymentStatus,
          paidAt,
          amountReceivedCents: s.amountReceivedCents,
          changeCents: s.changeCents,
          fiscal: s.fiscal,
          station: s.station,
          soldById: s.soldById,
          soldByName: s.soldByName,
          canceledAt: s.canceledAt ? new Date(s.canceledAt) : null,
          canceledReason: s.canceledReason,
          syncedToLocal: true, // ja veio do balcao; nao precisa "baixar" de novo
          syncedToOnline: true,
          syncedOnlineAt: new Date(),
          createdAt,
          items: {
            create: s.items.map((it) => ({
              productId: it.productId,
              productNameSnapshot: it.productNameSnapshot,
              productSkuSnapshot: it.productSkuSnapshot,
              unitPriceCents: it.unitPriceCents,
              quantity: it.quantity,
              totalCents: it.totalCents,
              unitCostCents: it.unitCostCents,
              costTotalCents: it.costTotalCents,
              note: it.note,
            })),
          },
          statusHistory: {
            create: {
              toStatus: s.status,
              notes: canceled ? "Venda PDV cancelada (sync)" : "Venda no balcao (sync PDV)",
            },
          },
        },
      });

      if (canceled) return; // cancelada: nao mexe em estoque/financeiro

      // 3) baixa o estoque real (autoritativo; permite negativo = oversell)
      for (const it of s.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      // 4) fiado (CHARGE) ou receita reconhecida + pagamentos
      if (s.onCredit) {
        await tx.creditTransaction.create({
          data: {
            customerId: s.customerId,
            type: "CHARGE",
            amountCents: s.creditChargeCents ?? s.totalCents,
            orderId: s.id,
          },
        });
      } else {
        if (s.payments.length > 0) {
          await tx.orderPayment.createMany({
            data: s.payments.map((p) => ({ orderId: s.id, method: p.method, amountCents: p.amountCents })),
          });
        }
        await tx.financialEntry.create({
          data: {
            type: "RECEIVABLE",
            status: "PAID",
            category: "venda",
            description: `Venda balcao — Pedido ${s.orderNumber}`,
            amountCents: s.totalCents,
            dueDate: paidAt ?? createdAt,
            paidAt: paidAt ?? createdAt,
            orderId: s.id,
          },
        });
      }
    });

      acked.push(s.id);
      if (!canceled) for (const it of s.items) touchedProducts.add(it.productId);
    } catch (e) {
      // Uma venda com problema NAO pode travar a fila inteira nem o pull.
      console.error(`[sync-sales] falha ao aplicar venda ${s.id} (${s.orderNumber}):`, e);
    }
  }

  const stock =
    touchedProducts.size > 0
      ? (
          await prisma.product.findMany({
            where: { id: { in: [...touchedProducts] } },
            select: { id: true, stock: true },
          })
        ).map((p) => ({ productId: p.id, stock: p.stock }))
      : [];

  return { ok: true, acked, stock };
}
