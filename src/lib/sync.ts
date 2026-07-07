import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { prisma } from "./prisma";

// ============================================================
// Sincronização vitrine online <-> retaguarda instalada (F4.2)
// ------------------------------------------------------------
// A retaguarda LOCAL é a fonte da verdade. Ela:
//   - EMPURRA o catálogo (produtos/preços/estoque) para a vitrine online
//   - PUXA os pedidos novos feitos na vitrine
// A vitrine online expõe os endpoints em /api/sync/* e autentica por um
// segredo compartilhado (SYNC_TOKEN) enviado no header "x-sync-token".
// ============================================================

export const SYNC_HEADER = "x-sync-token";
export const STATION_HEADER = "x-station";
export const APP_VERSION_HEADER = "x-app-version";

// F5.6: registra/atualiza o PDV que chamou (heartbeat). Chamado pelas rotas de
// sync na gestao online. Nunca quebra o sync se falhar.
export async function touchStation(req: Request): Promise<void> {
  const station = (req.headers.get(STATION_HEADER) ?? "").trim();
  if (!station) return;
  const appVersion = (req.headers.get(APP_VERSION_HEADER) ?? "").trim() || null;
  try {
    await prisma.pdvStation.upsert({
      where: { id: station },
      update: appVersion ? { lastSeenAt: new Date(), appVersion } : { lastSeenAt: new Date() },
      create: { id: station, appVersion },
    });
  } catch {
    /* heartbeat e best-effort */
  }
}

/** Compara o token recebido com o SYNC_TOKEN (tempo constante). */
export function isSyncAuthorized(req: Request): boolean {
  const expected = env.SYNC_TOKEN;
  if (!expected) return false; // sync desabilitado se não configurado
  const got = req.headers.get(SYNC_HEADER) ?? "";
  // hash p/ igualar tamanho antes do timingSafeEqual
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// ---- Contrato do catálogo (local -> online) ----
export type CatalogImage = { url: string; alt: string | null; sortOrder: number };
export type CatalogCategory = { id: string; name: string; slug: string; sortOrder: number };
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  unit: string;
  weightGrams: number;
  active: boolean;
  featured: boolean;
  categoryId: string | null;
  images: CatalogImage[];
};

export type CatalogPayload = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  // ids removidos/inativados desde o último sync (opcional)
  deletedProductIds?: string[];
};

// ---- Contrato de pedido (online -> local) ----
export type SyncOrderItem = {
  productId: string;
  sku: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};
export type SyncOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string | null;
  customerCpfSnapshot: string | null;
  shippingZip: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement: string | null;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  paidAt: string | null;
  createdAt: string;
  items: SyncOrderItem[];
};
