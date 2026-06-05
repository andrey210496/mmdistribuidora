import { beforeEach, describe, expect, it } from "vitest";
import { prisma, cleanDb } from "./db";
import { resolveSectionProducts, type HomeSectionConfig } from "@/lib/home-sections";

beforeEach(cleanDb);

function cfg(over: Partial<HomeSectionConfig>): HomeSectionConfig {
  return {
    id: "s",
    type: "NEW_ARRIVALS",
    title: "t",
    subtitle: null,
    enabled: true,
    sortOrder: 0,
    productLimit: 10,
    expiryDays: 30,
    salesWindowDays: 90,
    ...over,
  };
}

type P = {
  slug: string;
  sku: string;
  priceCents?: number;
  compareAtPriceCents?: number | null;
  clubPriceCents?: number | null;
  stock?: number;
  featured?: boolean;
  expiryDate?: Date | null;
  createdAt?: Date;
};

async function mkProduct(p: P) {
  return prisma.product.create({
    data: {
      name: p.slug,
      slug: p.slug,
      description: "d",
      sku: p.sku,
      priceCents: p.priceCents ?? 1000,
      compareAtPriceCents: p.compareAtPriceCents ?? null,
      clubPriceCents: p.clubPriceCents ?? null,
      stock: p.stock ?? 5,
      featured: p.featured ?? false,
      expiryDate: p.expiryDate ?? null,
      ...(p.createdAt ? { createdAt: p.createdAt } : {}),
    },
  });
}

async function mkPaidOrderFor(productId: string, qty: number) {
  const now = new Date();
  const customer = await prisma.customer.create({ data: { name: "C" } });
  await prisma.order.create({
    data: {
      orderNumber: `DE-T-${Math.random().toString(36).slice(2, 8)}`,
      customerId: customer.id,
      status: "PAID",
      subtotalCents: 1000 * qty,
      totalCents: 1000 * qty,
      shippingZip: "12000000",
      shippingStreet: "R",
      shippingNumber: "1",
      shippingNeighborhood: "B",
      shippingCity: "C",
      shippingState: "SP",
      customerNameSnapshot: "C",
      customerEmailSnapshot: "",
      paymentStatus: "CONFIRMED",
      paidAt: now,
      items: {
        create: [
          {
            productId,
            productNameSnapshot: "x",
            productSkuSnapshot: "x",
            unitPriceCents: 1000,
            quantity: qty,
            totalCents: 1000 * qty,
          },
        ],
      },
    },
  });
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

describe("Seções da Home (integração com DB)", () => {
  it("CLUB_NEAR_EXPIRY: só produtos com validade dentro do prazo", async () => {
    await mkProduct({ slug: "perto", sku: "A", expiryDate: inDays(10), stock: 5 });
    await mkProduct({ slug: "longe", sku: "B", expiryDate: inDays(100), stock: 5 });
    await mkProduct({ slug: "sem-validade", sku: "C", expiryDate: null, stock: 5 });

    const r = await resolveSectionProducts(cfg({ type: "CLUB_NEAR_EXPIRY", expiryDays: 30 }));
    const slugs = r.map((p) => p.slug);
    expect(slugs).toContain("perto");
    expect(slugs).not.toContain("longe");
    expect(slugs).not.toContain("sem-validade");
  });

  it("BEST_OFFERS: só produtos com preço 'de' maior que o atual", async () => {
    await mkProduct({ slug: "oferta", sku: "A", priceCents: 1000, compareAtPriceCents: 2000 });
    await mkProduct({ slug: "normal", sku: "B", priceCents: 1000, compareAtPriceCents: null });

    const r = await resolveSectionProducts(cfg({ type: "BEST_OFFERS" }));
    const slugs = r.map((p) => p.slug);
    expect(slugs).toContain("oferta");
    expect(slugs).not.toContain("normal");
  });

  it("FEATURED: só produtos marcados como destaque", async () => {
    await mkProduct({ slug: "destaque", sku: "A", featured: true });
    await mkProduct({ slug: "comum", sku: "B", featured: false });

    const r = await resolveSectionProducts(cfg({ type: "FEATURED" }));
    const slugs = r.map((p) => p.slug);
    expect(slugs).toEqual(["destaque"]);
  });

  it("NEW_ARRIVALS: ordena do mais novo para o mais antigo", async () => {
    await mkProduct({ slug: "antigo", sku: "A", createdAt: new Date("2020-01-01") });
    await mkProduct({ slug: "novo", sku: "B", createdAt: new Date("2025-01-01") });

    const r = await resolveSectionProducts(cfg({ type: "NEW_ARRIVALS" }));
    expect(r[0].slug).toBe("novo");
  });

  it("BEST_SELLERS: ranqueia pelos produtos mais vendidos (pedidos pagos)", async () => {
    const a = await mkProduct({ slug: "campeao", sku: "A" });
    const b = await mkProduct({ slug: "menos", sku: "B" });
    await mkPaidOrderFor(a.id, 5);
    await mkPaidOrderFor(b.id, 1);

    const r = await resolveSectionProducts(cfg({ type: "BEST_SELLERS", salesWindowDays: 0 }));
    expect(r[0].slug).toBe("campeao");
  });
});
