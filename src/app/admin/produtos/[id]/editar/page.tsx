import { notFound } from "next/navigation";
import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";
import { StockAdjust } from "./StockAdjust";

export const metadata = { title: "Editar produto · Admin" };

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireArea("produtos");
  const { id } = await params;

  const [product, categories, taxGroups] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.taxGroup.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="p-6 lg:p-8">
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku,
          barcode: product.barcode,
          priceCents: product.priceCents,
          compareAtPriceCents: product.compareAtPriceCents,
          priceCashCents: product.priceCashCents,
          pricePixCents: product.pricePixCents,
          priceCardCents: product.priceCardCents,
          wholesalePriceCents: product.wholesalePriceCents,
          wholesaleMinQty: product.wholesaleMinQty,
          costCents: product.costCents,
          stock: product.stock,
          unit: product.unit,
          weightGrams: product.weightGrams,
          active: product.active,
          featured: product.featured,
          expiryDate: product.expiryDate
            ? product.expiryDate.toISOString().slice(0, 10)
            : null,
          categoryId: product.categoryId,
          ncm: product.ncm,
          cest: product.cest,
          origem: product.origem,
          taxGroupId: product.taxGroupId,
          imageUrl: product.images[0]?.url ?? null,
        }}
        categories={categories}
        taxGroups={taxGroups}
      />

      <div className="max-w-4xl mt-6">
        <StockAdjust productId={product.id} currentStock={product.stock} unit={product.unit} />
      </div>
    </div>
  );
}
