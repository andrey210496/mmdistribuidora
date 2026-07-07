import Link from "next/link";
import { getNavCategories } from "@/lib/categories";

// Categorias em cards editoriais elegantes (bloco tonal + rótulo serifado).
const TONES = [
  "linear-gradient(150deg,#6B4326,#2A1710)",
  "linear-gradient(150deg,#B8894A,#7A5326)",
  "linear-gradient(150deg,#9AA0A6,#5F6266)",
  "linear-gradient(150deg,#C0574F,#8E201C)",
];

export async function CategoryTiles() {
  const categories = await getNavCategories(8);
  if (categories.length === 0) return null;

  return (
    <section className="bg-paper border-t border-line">
      <div className="container-wide py-14 lg:py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-brass">Navegue</span>
            <h2 className="font-serif text-[30px] lg:text-[36px] text-ink tracking-tight mt-1.5">Por categoria</h2>
          </div>
          <Link href="/produtos" className="shrink-0 text-wine hover:text-[#8e201c] font-semibold text-[12.5px] uppercase tracking-[0.08em] transition">
            Ver tudo →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.slice(0, 8).map((c, i) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className="group bg-white border border-line hover:border-brass hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="h-32 lg:h-36" style={{ background: TONES[i % TONES.length] }} />
              <div className="px-4 py-4">
                <div className="font-serif text-[19px] text-ink group-hover:text-wine transition-colors leading-tight">{c.name}</div>
                <div className="text-[12px] text-clay mt-1">
                  {c.productCount} {c.productCount === 1 ? "item" : "itens"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
