import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSyncAuthorized, type CatalogPayload } from "@/lib/sync";

// POST /api/sync/catalog  (vitrine online recebe o catálogo da retaguarda)
// Auth: header x-sync-token == SYNC_TOKEN. Upsert idempotente por id.
export async function POST(req: NextRequest) {
  if (!isSyncAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let payload: CatalogPayload;
  try {
    payload = (await req.json()) as CatalogPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const categories = payload.categories ?? [];
  const products = payload.products ?? [];
  const deleted = payload.deletedProductIds ?? [];

  let upCats = 0;
  let upProds = 0;

  // Categorias primeiro (FK dos produtos)
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.name, slug: c.slug, sortOrder: c.sortOrder },
      create: { id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder },
    });
    upCats++;
  }

  // Produtos + imagens (substitui as imagens a cada sync)
  for (const p of products) {
    const data = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      sku: p.sku,
      barcode: p.barcode,
      priceCents: p.priceCents,
      compareAtPriceCents: p.compareAtPriceCents,
      stock: p.stock,
      unit: p.unit,
      weightGrams: p.weightGrams,
      active: p.active,
      featured: p.featured,
      categoryId: p.categoryId,
    };
    await prisma.$transaction(async (tx) => {
      await tx.product.upsert({
        where: { id: p.id },
        update: data,
        create: { id: p.id, ...data },
      });
      await tx.productImage.deleteMany({ where: { productId: p.id } });
      if (p.images.length) {
        await tx.productImage.createMany({
          data: p.images.map((img) => ({
            productId: p.id,
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder,
          })),
        });
      }
    });
    upProds++;
  }

  // Removidos/inativados: não apaga (preserva histórico) — só desativa
  if (deleted.length) {
    await prisma.product.updateMany({
      where: { id: { in: deleted } },
      data: { active: false },
    });
  }

  return NextResponse.json({
    ok: true,
    categories: upCats,
    products: upProds,
    deactivated: deleted.length,
  });
}
