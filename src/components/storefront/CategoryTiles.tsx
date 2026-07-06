import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getNavCategories } from "@/lib/categories";

// Rail horizontal de "departamentos" color-blocked — cada categoria vira um
// bloco forte, rolavel. Estrutura diferente da grade de cards do template.
const SKINS = [
  "bg-ink text-white",
  "bg-rose-brand text-white",
  "bg-gold text-ink",
  "bg-graphite text-white",
];

export async function CategoryTiles() {
  const categories = await getNavCategories(10);
  if (categories.length === 0) return null;

  return (
    <section className="bg-white border-b border-line">
      <div className="container-wide py-9 lg:py-11">
        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="font-poster text-2xl lg:text-[34px] text-ink uppercase tracking-wide leading-none">
            Departamentos
            <span className="block h-1 w-16 bg-rose-brand mt-2.5" />
          </h2>
          <Link href="/produtos" className="shrink-0 inline-flex items-center gap-1.5 text-rose-brand hover:text-ink font-extrabold text-[12.5px] uppercase tracking-wide transition">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide snap-x pb-1 -mx-1 px-1">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className={`group snap-start shrink-0 w-[150px] lg:w-[185px] h-36 lg:h-40 ${SKINS[i % SKINS.length]} rounded-xl p-4 flex flex-col justify-between relative overflow-hidden`}
            >
              <ArrowUpRight size={20} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition self-end" />
              <div>
                <div className="font-poster text-xl lg:text-2xl uppercase leading-[0.95] tracking-wide">
                  {c.name}
                </div>
                <div className="text-[11.5px] font-bold opacity-70 mt-1 uppercase tracking-wide">
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
