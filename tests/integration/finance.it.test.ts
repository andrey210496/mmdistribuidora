import { beforeEach, describe, expect, it } from "vitest";
import { prisma, cleanDb } from "./db";
import {
  resolvePeriod,
  getFinanceSummary,
  getTopProductsByRevenue,
  getOpenPayables,
  listEntries,
} from "@/lib/finance";

beforeEach(cleanDb);

async function seedSale() {
  const now = new Date();
  const customer = await prisma.customer.create({ data: { name: "Cliente Teste" } });
  const product = await prisma.product.create({
    data: {
      name: "Chocolate",
      slug: "chocolate",
      description: "d",
      sku: "SKU-FIN-1",
      priceCents: 5000,
      costCents: 3000,
      stock: 10,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "DE-T-0001",
      customerId: customer.id,
      status: "PAID",
      subtotalCents: 10000,
      totalCents: 10000,
      shippingCents: 0,
      shippingZip: "12000000",
      shippingStreet: "Rua",
      shippingNumber: "1",
      shippingNeighborhood: "Centro",
      shippingCity: "Cidade",
      shippingState: "SP",
      customerNameSnapshot: "Cliente Teste",
      customerEmailSnapshot: "",
      paymentStatus: "CONFIRMED",
      paidAt: now,
      items: {
        create: [
          {
            productId: product.id,
            productNameSnapshot: "Chocolate",
            productSkuSnapshot: "SKU-FIN-1",
            unitPriceCents: 5000,
            quantity: 2,
            totalCents: 10000,
            unitCostCents: 3000,
            costTotalCents: 6000,
          },
        ],
      },
    },
  });

  // Receita da venda (recebida)
  await prisma.financialEntry.create({
    data: {
      type: "RECEIVABLE",
      status: "PAID",
      category: "venda",
      description: "Venda",
      amountCents: 10000,
      dueDate: now,
      paidAt: now,
      orderId: order.id,
    },
  });
  // Despesa paga
  await prisma.financialEntry.create({
    data: {
      type: "PAYABLE",
      status: "PAID",
      category: "aluguel",
      description: "Aluguel",
      amountCents: 2000,
      dueDate: now,
      paidAt: now,
    },
  });
  // Conta a pagar em aberto e VENCIDA
  const past = new Date(now.getTime() - 5 * 86_400_000);
  await prisma.financialEntry.create({
    data: {
      type: "PAYABLE",
      status: "OPEN",
      category: "fornecedor",
      description: "Fornecedor X",
      amountCents: 4000,
      dueDate: past,
    },
  });
}

describe("Financeiro (integração com DB)", () => {
  it("calcula KPIs, CMV, lucro bruto e margem reais", async () => {
    await seedSale();
    const s = await getFinanceSummary(resolvePeriod("tudo"));

    expect(s.receivedCents).toBe(10000);
    expect(s.expensesPaidCents).toBe(2000);
    expect(s.resultCents).toBe(8000);
    expect(s.openPayableCents).toBe(4000);
    expect(s.overduePayableCents).toBe(4000);
    expect(s.overduePayableCount).toBe(1);
    expect(s.paidOrdersCount).toBe(1);
    expect(s.avgTicketCents).toBe(10000);
    expect(s.productRevenueCents).toBe(10000);
    expect(s.cogsCents).toBe(6000);
    expect(s.grossProfitCents).toBe(4000);
    expect(Math.round(s.grossMarginPct)).toBe(40);
  });

  it("ranqueia produtos por faturamento com lucro e margem", async () => {
    await seedSale();
    const top = await getTopProductsByRevenue(resolvePeriod("tudo"), 5);
    expect(top).toHaveLength(1);
    expect(top[0].revenueCents).toBe(10000);
    expect(top[0].costCents).toBe(6000);
    expect(top[0].profitCents).toBe(4000);
    expect(top[0].qty).toBe(2);
    expect(Math.round(top[0].marginPct)).toBe(40);
  });

  it("lista contas a pagar em aberto e marca as vencidas", async () => {
    await seedSale();
    const payables = await getOpenPayables(10);
    expect(payables).toHaveLength(1);
    expect(payables[0].category).toBe("fornecedor");
    expect(payables[0].isOverdue).toBe(true);
  });

  it("lista os lançamentos recentes", async () => {
    await seedSale();
    const entries = await listEntries({ limit: 50 });
    expect(entries.length).toBe(3);
  });
});
