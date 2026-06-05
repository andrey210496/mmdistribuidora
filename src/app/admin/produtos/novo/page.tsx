import { requireArea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Novo produto · Admin" };

export default async function NovoProdutoPage() {
  await requireArea("produtos");
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="p-6 lg:p-8">
      <ProductForm categories={categories} />
    </div>
  );
}
