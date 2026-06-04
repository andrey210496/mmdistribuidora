import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

const categoryImages: Record<string, { image: string; tag: string }> = {
  chocolates: {
    image: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=600&q=80",
    tag: "+200 produtos",
  },
  "doces-finos": {
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&q=80",
    tag: "Artesanal",
  },
  embalagens: {
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&q=80",
    tag: "+200 modelos",
  },
  confeitaria: {
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=600&q=80",
    tag: "Ingredientes",
  },
  festas: {
    image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=600&q=80",
    tag: "Coleção",
  },
};

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 bg-cream/40">
      <div className="container-default">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <span className="eyebrow mb-2 text-xs">Compre por categoria</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa">
              Navegue pelo catálogo
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-cocoa text-sm font-semibold hover:text-caramel inline-flex items-center gap-1 transition"
          >
            Ver tudo <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.slice(0, 5).map((cat) => {
            const data = categoryImages[cat.slug] ?? {
              image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80",
              tag: "Loja",
            };
            return (
              <Link
                key={cat.id}
                href={`/produtos?categoria=${cat.slug}`}
                className="group relative bg-white rounded-2xl overflow-hidden border border-cocoa/10 hover:border-caramel/40 hover:shadow-[0_12px_30px_-8px_rgba(90,43,23,0.2)] transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
                  <span className="absolute top-2.5 left-2.5 bg-white/95 text-cocoa text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                    {data.tag}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <h3 className="font-display font-bold text-cocoa group-hover:text-caramel transition">
                    {cat.name}
                  </h3>
                  <ArrowUpRight
                    size={16}
                    className="text-cocoa/40 group-hover:text-caramel group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
