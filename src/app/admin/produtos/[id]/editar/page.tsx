import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";

export const metadata = { title: "Editar produto · Admin" };

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
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
          priceCents: product.priceCents,
          compareAtPriceCents: product.compareAtPriceCents,
          stock: product.stock,
          weightGrams: product.weightGrams,
          active: product.active,
          featured: product.featured,
          categoryId: product.categoryId,
          imageUrl: product.images[0]?.url ?? null,
        }}
        categories={categories}
      />
    </div>
  );
}
