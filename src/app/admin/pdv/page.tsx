import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenCashSession, getSessionReconciliation } from "@/lib/cash";
import { getPdvShortcuts, getProductHotkeys } from "@/lib/settings";
import { COMPANY } from "@/lib/company";
import { PdvClient, type PdvProductHotkey } from "./PdvClient";

export const metadata = { title: "PDV / Caixa · Admin" };
export const dynamic = "force-dynamic";

export default async function PdvPage() {
  await requireArea("pdv");

  const session = await getOpenCashSession();
  const recon = session ? await getSessionReconciliation(session) : null;
  const shortcuts = await getPdvShortcuts();

  // Atalhos de produto (tecla -> produto): resolve os produtos p/ adicionar no carrinho.
  const hotkeys = await getProductHotkeys();
  const hotkeyProducts = hotkeys.length
    ? await prisma.product.findMany({
        where: { id: { in: hotkeys.map((h) => h.productId) }, active: true },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      })
    : [];
  const productById = new Map(hotkeyProducts.map((p) => [p.id, p]));
  const productHotkeys: PdvProductHotkey[] = hotkeys
    .filter((h) => productById.has(h.productId))
    .map((h) => {
      const p = productById.get(h.productId)!;
      return {
        key: h.key,
        product: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          priceCents: p.priceCents,
          wholesalePriceCents: p.wholesalePriceCents,
          wholesaleMinQty: p.wholesaleMinQty,
          stock: p.stock,
          imageUrl: p.images[0]?.url ?? null,
        },
      };
    });

  return (
    <PdvClient
      storeName={COMPANY.name}
      shortcuts={shortcuts}
      productHotkeys={productHotkeys}
      session={
        session
          ? {
              id: session.id,
              openingFloatCents: session.openingFloatCents,
              openedAt: session.openedAt.toISOString(),
              movements: session.movements.map((m) => ({
                id: m.id,
                type: m.type,
                amountCents: m.amountCents,
                reason: m.reason,
                createdAt: m.createdAt.toISOString(),
              })),
            }
          : null
      }
      recon={recon}
    />
  );
}
