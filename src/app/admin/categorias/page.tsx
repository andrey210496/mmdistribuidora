import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./CategoriesManager";

export const metadata = { title: "Categorias · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cocoa">Categorias</h1>
        <p className="text-cocoa/60 text-sm">
          Organize seu catálogo. As categorias ativas aparecem no menu da loja.
        </p>
      </header>

      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          active: c.active,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
