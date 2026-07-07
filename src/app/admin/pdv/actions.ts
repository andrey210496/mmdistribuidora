"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma, type PaymentMethod } from "@prisma/client";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { brlToCents } from "@/lib/money";
import { generateOrderNumber } from "@/lib/utils";
import { IS_PDV, STATION_ID } from "@/lib/mode";
import { resolveUnitPrice } from "@/lib/pricing";
import { computePaymentBreakdown, type PaymentInput } from "@/lib/pos";
import { getOpenCashSession, getOrCreateWalkInCustomer } from "@/lib/cash";
import { getCustomerCreditSummary } from "@/lib/credit";

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.string().min(1).max(100);
const PAY_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"] as const;

function parseBrl(v: string): number | null {
  try {
    return brlToCents(v);
  } catch {
    return null;
  }
}

// ============================================================
// Busca de produtos (nome / SKU / código de barras). Bipar = barcode exato.
// ============================================================
export type PdvProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  priceCents: number;
  wholesalePriceCents: number | null;
  wholesaleMinQty: number;
  stock: number;
  imageUrl: string | null;
};

export async function searchProducts(query: string): Promise<PdvProduct[]> {
  await requireArea("pdv");
  const q = query.trim();
  if (q.length < 1) return [];

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: q },
      ],
    },
    take: 20,
    orderBy: { name: "asc" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    priceCents: p.priceCents,
    wholesalePriceCents: p.wholesalePriceCents,
    wholesaleMinQty: p.wholesaleMinQty,
    stock: p.stock,
    imageUrl: p.images[0]?.url ?? null,
  }));
}

// ============================================================
// Busca de clientes (para vincular a venda). Exclui o "Consumidor".
// ============================================================
export type PdvCustomer = {
  id: string;
  name: string;
  phone: string | null;
  cpfCnpj: string | null;
  isWholesale: boolean;
  creditAvailableCents: number;
  creditOwedCents: number;
  // Preços fixos do cliente: productId -> priceCents (aplicado no PDV).
  productPrices: Record<string, number>;
};

export async function searchCustomers(query: string): Promise<PdvCustomer[]> {
  await requireArea("pdv");
  const q = query.trim();
  if (q.length < 2) return [];

  const customers = await prisma.customer.findMany({
    where: {
      email: { not: "consumidor@pdv.local" },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { cpfCnpj: { contains: q } },
      ],
    },
    take: 10,
    orderBy: { name: "asc" },
    include: { productPrices: { select: { productId: true, priceCents: true } } },
  });

  const out: PdvCustomer[] = [];
  for (const c of customers) {
    const summary = await getCustomerCreditSummary(c.id);
    out.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      cpfCnpj: c.cpfCnpj,
      isWholesale: c.isWholesale,
      creditAvailableCents: summary.availableCents,
      creditOwedCents: summary.owedCents,
      productPrices: Object.fromEntries(c.productPrices.map((p) => [p.productId, p.priceCents])),
    });
  }
  return out;
}

const quickCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().max(30).optional().default(""),
  cpfCnpj: z.string().max(30).optional().default(""),
});

export async function quickCreateCustomer(input: {
  name: string;
  phone?: string;
  cpfCnpj?: string;
}): Promise<{ ok: boolean; error?: string; customer?: PdvCustomer }> {
  await requireArea("pdv");
  const parsed = quickCustomerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const cpf = parsed.data.cpfCnpj.trim();
  if (cpf) {
    const exists = await prisma.customer.findFirst({ where: { cpfCnpj: cpf } });
    if (exists) return { ok: false, error: "Já existe cliente com este CPF/CNPJ." };
  }

  const c = await prisma.customer.create({
    data: {
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim() || null,
      cpfCnpj: cpf || null,
    },
  });

  return {
    ok: true,
    customer: {
      id: c.id,
      name: c.name,
      phone: c.phone,
      cpfCnpj: c.cpfCnpj,
      isWholesale: false,
      creditAvailableCents: 0,
      creditOwedCents: 0,
      productPrices: {},
    },
  };
}

// ============================================================
// Caixa: abrir, fechar, sangria/suprimento.
// ============================================================
export async function openCashSession(openingFloatBrl: string): Promise<ActionResult> {
  const user = await requireArea("pdv");
  const cents = (openingFloatBrl ?? "").trim() === "" ? 0 : parseBrl(openingFloatBrl);
  if (cents == null || cents < 0) return { ok: false, error: "Valor inválido" };

  const open = await getOpenCashSession();
  if (open) return { ok: false, error: "Já existe um caixa aberto." };

  const session = await prisma.cashRegisterSession.create({
    data: { openingFloatCents: cents, openedBy: user.id, status: "OPEN" },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "cash.opened",
    entityType: "CashRegisterSession",
    entityId: session.id,
    afterJson: { openingFloatCents: cents },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/pdv");
  return { ok: true };
}

const movementSchema = z.object({
  type: z.enum(["SANGRIA", "SUPRIMENTO"]),
  amountBrl: z.string(),
  reason: z.string().max(200).optional().default(""),
});

export async function addCashMovement(
  type: "SANGRIA" | "SUPRIMENTO",
  amountBrl: string,
  reason: string
): Promise<ActionResult> {
  const user = await requireArea("pdv");
  const parsed = movementSchema.safeParse({ type, amountBrl, reason });
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const cents = parseBrl(parsed.data.amountBrl);
  if (cents == null || cents <= 0) return { ok: false, error: "Valor inválido" };

  const session = await getOpenCashSession();
  if (!session) return { ok: false, error: "Nenhum caixa aberto." };

  await prisma.cashMovement.create({
    data: {
      cashSessionId: session.id,
      type: parsed.data.type,
      amountCents: cents,
      reason: parsed.data.reason.trim() || null,
      createdBy: user.id,
    },
  });

  revalidatePath("/admin/pdv");
  return { ok: true };
}

export async function closeCashSession(countedCashBrl: string): Promise<ActionResult> {
  const user = await requireArea("pdv");
  const session = await getOpenCashSession();
  if (!session) return { ok: false, error: "Nenhum caixa aberto." };

  const counted = parseBrl(countedCashBrl);
  if (counted == null || counted < 0) return { ok: false, error: "Valor inválido" };

  const { getSessionReconciliation } = await import("@/lib/cash");
  const recon = await getSessionReconciliation(session);
  const difference = counted - recon.expectedCashCents;

  await prisma.cashRegisterSession.update({
    where: { id: session.id },
    data: {
      status: "CLOSED",
      closedBy: user.id,
      closedAt: new Date(),
      expectedCashCents: recon.expectedCashCents,
      countedCashCents: counted,
      differenceCents: difference,
    },
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "cash.closed",
    entityType: "CashRegisterSession",
    entityId: session.id,
    afterJson: { expectedCashCents: recon.expectedCashCents, countedCashCents: counted, differenceCents: difference },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/pdv");
  return { ok: true };
}

// ============================================================
// Finalizar venda no balcão (à vista ou no fiado).
// PDV nasce ENTREGUE; baixa estoque; à vista lança receita + pagamentos;
// fiado gera CHARGE (sem receita até o recebimento).
// ============================================================
export type SaleInput = {
  items: { productId: string; quantity: number; note?: string | null }[];
  customerId: string | null; // null = Consumidor
  payments: PaymentInput[];
  onCredit: boolean;
  paymentMode?: "CASH" | "PIX" | "CARD"; // modo de preço (preço por forma de pgto)
  fiscal?: boolean; // emitir cupom fiscal (NFC-e) ou não
};

export type SaleResult = {
  ok: boolean;
  error?: string;
  orderId?: string;
  orderNumber?: string;
  changeCents?: number;
};

export async function finalizeSale(input: SaleInput): Promise<SaleResult> {
  const user = await requireArea("pdv");

  const session = await getOpenCashSession();
  if (!session) return { ok: false, error: "Abra o caixa antes de vender." };

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Carrinho vazio." };
  }

  // Resolve o cliente (Consumidor por padrão) + seus preços fixos.
  let customer: Awaited<ReturnType<typeof getOrCreateWalkInCustomer>>;
  const customerPriceMap = new Map<string, number>();
  if (input.customerId) {
    const id = idSchema.safeParse(input.customerId);
    if (!id.success) return { ok: false, error: "Cliente inválido" };
    const c = await prisma.customer.findUnique({
      where: { id: id.data },
      include: { productPrices: { select: { productId: true, priceCents: true } } },
    });
    if (!c) return { ok: false, error: "Cliente não encontrado" };
    for (const pp of c.productPrices) customerPriceMap.set(pp.productId, pp.priceCents);
    customer = c;
  } else {
    if (input.onCredit) return { ok: false, error: "Fiado exige um cliente cadastrado." };
    customer = await getOrCreateWalkInCustomer();
  }

  const isWholesale = customer.isWholesale;
  const paymentMode = input.paymentMode ?? "CASH";

  // Recalcula preços do banco (anti-fraude).
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== new Set(productIds).size) {
    return { ok: false, error: "Algum produto não está mais disponível." };
  }

  const orderItemsData: {
    productId: string;
    productNameSnapshot: string;
    productSkuSnapshot: string;
    unitPriceCents: number;
    quantity: number;
    totalCents: number;
    unitCostCents: number;
    costTotalCents: number;
    note: string | null;
  }[] = [];
  let subtotalCents = 0;
  let normalSubtotalCents = 0;
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!;
    const qty = Math.floor(item.quantity);
    if (qty <= 0) return { ok: false, error: `Quantidade inválida para "${product.name}".` };
    if (qty > product.stock) {
      return { ok: false, error: `Estoque insuficiente para "${product.name}" (${product.stock}).` };
    }
    const unitPriceCents = resolveUnitPrice(product, {
      isWholesale,
      qty,
      paymentMode,
      customerPriceCents: customerPriceMap.get(product.id) ?? null,
    }).unitPriceCents;
    const totalCents = unitPriceCents * qty;
    const unitCostCents = product.costCents ?? 0;
    subtotalCents += totalCents;
    normalSubtotalCents += product.priceCents * qty;
    orderItemsData.push({
      productId: product.id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceCents,
      quantity: qty,
      totalCents,
      unitCostCents,
      costTotalCents: unitCostCents * qty,
      note: (item.note ?? "").trim() || null,
    });
  }

  const totalCents = subtotalCents;
  const discountCents = Math.max(0, normalSubtotalCents - subtotalCents);

  // Pagamento (à vista) ou validação de crédito (fiado).
  let breakdown = computePaymentBreakdown(totalCents, []);
  let paymentMethod: PaymentMethod = "CASH";
  let paymentRows: { method: PaymentMethod; amountCents: number }[] = [];

  if (input.onCredit) {
    const summary = await getCustomerCreditSummary(customer.id);
    if (summary.limitCents <= 0) return { ok: false, error: "Cliente sem limite de crédito." };
    if (totalCents > summary.availableCents) {
      return { ok: false, error: "Crédito insuficiente para esta venda." };
    }
    paymentMethod = "STORE_CREDIT";
  } else {
    const payments = (input.payments ?? []).filter(
      (p) => PAY_METHODS.includes(p.method as (typeof PAY_METHODS)[number]) && p.amountCents > 0
    );
    breakdown = computePaymentBreakdown(totalCents, payments);
    if (!breakdown.isComplete) {
      return { ok: false, error: "Pagamento não cobre o total da venda." };
    }
    for (const p of payments) {
      if (p.method === "CASH") continue;
      paymentRows.push({ method: p.method, amountCents: p.amountCents });
    }
    if (breakdown.cashAppliedCents > 0) {
      paymentRows.push({ method: "CASH", amountCents: breakdown.cashAppliedCents });
    }
    paymentMethod =
      [...paymentRows].sort((a, b) => b.amountCents - a.amountCents)[0]?.method ?? "CASH";
  }

  const now = new Date();
  const customerId = customer.id;
  const orderBase = {
    customerId,
    channel: "PDV" as const,
    status: "DELIVERED" as const,
    subtotalCents,
    discountCents,
    shippingCents: 0,
    totalCents,
    shippingZip: "",
    shippingStreet: "Venda no balcão (PDV)",
    shippingNumber: "-",
    shippingComplement: null,
    shippingNeighborhood: "-",
    shippingCity: "-",
    shippingState: "",
    customerNameSnapshot: customer.name,
    customerEmailSnapshot: customer.email ?? "",
    customerCpfSnapshot: customer.cpfCnpj,
    customerPhoneSnapshot: customer.phone,
    paymentMethod,
    paymentStatus: (input.onCredit ? "PENDING" : "CONFIRMED") as "PENDING" | "CONFIRMED",
    paidAt: input.onCredit ? null : now,
    cashSessionId: session.id,
    amountReceivedCents: input.onCredit ? null : breakdown.cashGivenCents || null,
    changeCents: input.onCredit ? null : breakdown.changeCents,
    fiscal: Boolean(input.fiscal),
    items: { create: orderItemsData },
    statusHistory: {
      create: {
        toStatus: "DELIVERED" as const,
        changedBy: user.id,
        notes: input.onCredit ? "Venda no balcão (fiado)" : "Venda no balcão (PDV)",
      },
    },
  };

  // No PDV local, o numero leva o prefixo da estacao p/ nunca colidir entre
  // caixas ao subir para a gestao online (F5.3).
  const orderPrefix = IS_PDV ? `PDV${STATION_ID || "0"}` : "DE";
  let created: { id: string; orderNumber: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderCount = await prisma.order.count();
    const orderNumber = generateOrderNumber(orderCount + 1 + attempt, orderPrefix);
    try {
      created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({ data: { orderNumber, ...orderBase } });

        // Baixa de estoque
        for (const it of orderItemsData) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: it.quantity } },
          });
        }

        if (input.onCredit) {
          // CHARGE no crediário (sem receita — regime de caixa).
          await tx.creditTransaction.create({
            data: {
              customerId,
              type: "CHARGE",
              amountCents: totalCents,
              orderId: order.id,
              createdBy: user.id,
            },
          });
        } else {
          // Pagamentos + receita reconhecida.
          if (paymentRows.length > 0) {
            await tx.orderPayment.createMany({
              data: paymentRows.map((p) => ({
                orderId: order.id,
                method: p.method,
                amountCents: p.amountCents,
              })),
            });
          }
          await tx.financialEntry.create({
            data: {
              type: "RECEIVABLE",
              status: "PAID",
              category: "venda",
              description: `Venda balcão — Pedido ${order.orderNumber}`,
              amountCents: totalCents,
              dueDate: now,
              paidAt: now,
              orderId: order.id,
            },
          });
        }

        return { id: order.id, orderNumber: order.orderNumber };
      });
      break;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 4
      ) {
        continue;
      }
      throw err;
    }
  }

  if (!created) return { ok: false, error: "Não foi possível registrar a venda. Tente novamente." };

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: input.onCredit ? "pdv.sale.credit" : "pdv.sale.paid",
    entityType: "Order",
    entityId: created.id,
    afterJson: { orderNumber: created.orderNumber, totalCents, paymentMethod },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/pdv");
  revalidatePath("/admin/pedidos");
  return {
    ok: true,
    orderId: created.id,
    orderNumber: created.orderNumber,
    changeCents: breakdown.changeCents,
  };
}

// ============================================================
// Cancelar uma venda do balcão: devolve o estoque, cancela a receita,
// estorna fiado e remove os pagamentos (saem da conferência do caixa).
// ============================================================
export async function cancelPdvSale(orderId: string, reason: string): Promise<ActionResult> {
  const user = await requireArea("pdv");
  const id = idSchema.safeParse(orderId);
  if (!id.success) return { ok: false, error: "Pedido inválido" };

  const order = await prisma.order.findUnique({
    where: { id: id.data },
    include: { items: true },
  });
  if (!order) return { ok: false, error: "Venda não encontrada" };
  if (order.channel !== "PDV") return { ok: false, error: "Só vendas do balcão podem ser canceladas aqui." };
  if (order.status === "CANCELED") return { ok: false, error: "Venda já cancelada." };

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // devolve estoque
    for (const it of order.items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.quantity } },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
        paymentStatus: "REFUNDED",
        canceledAt: now,
        canceledReason: reason?.trim() || "Cancelada no PDV",
      },
    });
    // receita reconhecida → cancelada
    await tx.financialEntry.updateMany({
      where: { orderId: order.id },
      data: { status: "CANCELED" },
    });
    // estorna fiado (remove o CHARGE da venda)
    await tx.creditTransaction.deleteMany({ where: { orderId: order.id, type: "CHARGE" } });
    // pagamentos saem da conferência do caixa
    await tx.orderPayment.deleteMany({ where: { orderId: order.id } });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CANCELED",
        changedBy: user.id,
        notes: `Cancelada no PDV: ${reason?.trim() || "sem motivo"}`,
      },
    });
  });

  const h = await headers();
  await logAudit({
    userId: user.id,
    action: "pdv.sale.canceled",
    entityType: "Order",
    entityId: order.id,
    afterJson: { orderNumber: order.orderNumber, reason },
    ip: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
  });

  revalidatePath("/admin/pdv");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}
