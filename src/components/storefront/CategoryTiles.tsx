import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { getNavCategories } from "@/lib/categories";

// Grade densa de categorias reais do catalogo. Some quando nao ha categorias.
export async function CategoryTiles() {
  const categories = await getNavCategories(8);
  if (categories.length === 0) return null;

  return (
    <section className="bg-white border-b border-line">
      <div className="container-wide py-10 lg:py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="flex items-stretch gap-3">
            <span className="w-1.5 bg-rose-brand shrink-0" aria-hidden />
            <h2 className="font-display text-xl lg:text-[26px] font-bold text-ink uppercase tracking-tight leading-none">
              Compre por categoria
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-1.5 text-rose-brand hover:text-ink font-extrabold text-[13px] uppercase tracking-wide transition"
          >
            Ver tudo <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className="group flex items-center gap-3.5 bg-white border border-line hover:border-rose-brand rounded-lg p-4 transition-colors"
            >
              <span className="w-12 h-12 shrink-0 bg-smoke text-rose-brand group-hover:bg-rose-brand group-hover:text-white flex items-center justify-center transition-colors">
                <Boxes size={22} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold text-ink text-[14px] uppercase tracking-tight leading-snug truncate group-hover:text-rose-brand transition-colors">
                  {c.name}
                </span>
                <span className="block text-[11.5px] font-semibold text-ink/45">
                  {c.productCount} {c.productCount === 1 ? "item" : "itens"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
