import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

// ============================================================
// Sync BAIXA (online -> PDV) — F5.2. Ver [[mm-arquitetura-f5]]
// ------------------------------------------------------------
// A gestao ONLINE e a fonte da verdade. O PDV-servidor puxa, por cursor
// (updatedAt), o que precisa para vender offline: catalogo, precos, clientes,
// usuarios (login offline) e configuracoes. Idempotente (upsert por id).
// ============================================================

export type PullImage = { url: string; alt: string | null; sortOrder: number };

export type PullProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  barcode: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  priceCashCents: number | null;
  pricePixCents: number | null;
  priceCardCents: number | null;
  wholesalePriceCents: number | null;
  wholesaleMinQty: number;
  costCents: number | null;
  stock: number;
  unit: string;
  weightGrams: number;
  ncm: string | null;
  cest: string | null;
  origem: string;
  taxGroupId: string | null;
  active: boolean;
  featured: boolean;
  categoryId: string | null;
  images: PullImage[];
};

export type PullCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export type PullTaxGroup = {
  id: string;
  name: string;
  cfop: string | null;
  csosn: string | null;
  cst: string | null;
  origem: string;
  icmsAliquota: number;
  active: boolean;
};

export type PullCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  passwordHash: string | null;
  isWholesale: boolean;
  creditLimitCents: number;
};

export type PullCustomerPrice = {
  id: string;
  customerId: string;
  productId: string;
  priceCents: number;
};

export type PullUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  jobTitle: string | null;
  permissions: string[];
  active: boolean;
  mustChangePassword: boolean;
};

export type PullSetting = { key: string; value: string; encrypted: boolean };

export type PullPayload = {
  now: string; // ISO — o PDV usa como proximo `since`
  categories: PullCategory[];
  taxGroups: PullTaxGroup[];
  products: PullProduct[];
  customers: PullCustomer[];
  customerPrices: PullCustomerPrice[];
  users: PullUser[];
  settings: PullSetting[];
};

// ---- LADO ONLINE: monta o pacote com o que mudou desde `since` ----
// Bounded por [since, now] p/ nao perder nem duplicar linhas escritas durante a
// consulta. Categorias/tax groups vao inteiros (poucas linhas).
export async function buildPullPayload(since: Date | null): Promise<PullPayload> {
  const now = new Date();
  const changed = { updatedAt: { gt: since ?? new Date(0), lte: now } };

  const [categories, taxGroups, products, customers, customerPrices, users, settings] =
    await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, sortOrder: true, active: true },
      }),
      prisma.taxGroup.findMany({
        select: {
          id: true, name: true, cfop: true, csosn: true, cst: true,
          origem: true, icmsAliquota: true, active: true,
        },
      }),
      prisma.product.findMany({
        where: changed,
        select: {
          id: true, name: true, slug: true, description: true, sku: true, barcode: true,
          priceCents: true, compareAtPriceCents: true, priceCashCents: true, pricePixCents: true,
          priceCardCents: true, wholesalePriceCents: true, wholesaleMinQty: true, costCents: true,
          stock: true, unit: true, weightGrams: true, ncm: true, cest: true, origem: true,
          taxGroupId: true, active: true, featured: true, categoryId: true,
          images: { select: { url: true, alt: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.customer.findMany({
        where: changed,
        select: {
          id: true, name: true, email: true, cpfCnpj: true, phone: true,
          passwordHash: true, isWholesale: true, creditLimitCents: true,
        },
      }),
      prisma.customerProductPrice.findMany({
        where: changed,
        select: { id: true, customerId: true, productId: true, priceCents: true },
      }),
      prisma.user.findMany({
        where: changed,
        select: {
          id: true, email: true, name: true, passwordHash: true, role: true,
          jobTitle: true, permissions: true, active: true, mustChangePassword: true,
        },
      }),
      prisma.setting.findMany({
        where: since ? { updatedAt: { gt: since, lte: now } } : { updatedAt: { lte: now } },
        select: { key: true, value: true, encrypted: true },
      }),
    ]);

  return {
    now: now.toISOString(),
    categories,
    taxGroups,
    products,
    customers,
    customerPrices,
    users,
    settings,
  };
}

// ---- LADO PDV: aplica o pacote no banco local (idempotente) ----
// Ordem respeita as FKs: taxGroups/categories -> products -> customers ->
// customerPrices -> users -> settings.
export async function applyPullPayload(p: PullPayload): Promise<void> {
  for (const t of p.taxGroups) {
    await prisma.taxGroup.upsert({ where: { id: t.id }, update: t, create: t });
  }
  for (const c of p.categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  for (const prod of p.products) {
    const { images, ...data } = prod;
    await prisma.$transaction(async (tx) => {
      await tx.product.upsert({ where: { id: data.id }, update: data, create: data });
      await tx.productImage.deleteMany({ where: { productId: data.id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img) => ({ productId: data.id, ...img })),
        });
      }
    });
  }
  for (const c of p.customers) {
    await prisma.customer.upsert({ where: { id: c.id }, update: c, create: c });
  }
  for (const cp of p.customerPrices) {
    await prisma.customerProductPrice.upsert({ where: { id: cp.id }, update: cp, create: cp });
  }
  for (const u of p.users) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
  }
  for (const s of p.settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, encrypted: s.encrypted },
      create: { key: s.key, value: s.value, encrypted: s.encrypted },
    });
  }
}
