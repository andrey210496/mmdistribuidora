import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { getNavCategories } from "@/lib/categories";

// Tiles de categorias reais do catálogo. Some quando não há categorias.
export async function CategoryTiles() {
  const categories = await getNavCategories(8);
  if (categories.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="container-wide py-12 lg:py-16">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <span className="eyebrow">Categorias</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa mt-1">
              Compre por categoria
            </h2>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-1.5 text-rose-brand hover:text-cocoa font-bold text-sm transition"
          >
            Ver tudo <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className="group rounded-2xl border border-cocoa/10 bg-cream/40 hover:bg-cream hover:border-rose-brand/30 p-5 transition flex items-center gap-3"
            >
              <span className="w-11 h-11 rounded-full bg-rose-brand/10 text-rose-brand flex items-center justify-center shrink-0 group-hover:bg-rose-brand group-hover:text-white transition">
                <Boxes size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-cocoa text-sm leading-snug truncate">
                  {c.name}
                </span>
                <span className="block text-[11px] text-cocoa/50">
                  {c.productCount} {c.productCount === 1 ? "produto" : "produtos"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
