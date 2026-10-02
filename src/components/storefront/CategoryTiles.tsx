import Link from "next/link";
import { ArrowRight, Candy, Cookie, Package, CakeSlice, PartyPopper, Croissant, Coffee, ShoppingBasket } from "lucide-react";
import { getNavCategories } from "@/lib/categories";

// Blocos tonais quentes/apetitosos (vermelho, dourado, caramelo, uva).
const TONES = [
  "linear-gradient(150deg,#D12B2B,#7d1414)",
  "linear-gradient(150deg,#f2b23e,#D98A2B)",
  "linear-gradient(150deg,#D98A2B,#8a5a1e)",
  "linear-gradient(150deg,#b62b25,#5a1410)",
  "linear-gradient(150deg,#e2a32e,#b7893c)",
  "linear-gradient(150deg,#c0574f,#8E201C)",
  "linear-gradient(150deg,#8a5a1e,#3a1e0c)",
  "linear-gradient(150deg,#A81E1E,#5a3214)",
];

// Icone por palavra-chave do nome (cai no padrao se nao casar).
const ICONS: { match: RegExp; Icon: typeof Candy }[] = [
  { match: /chocolate|choco/i, Icon: Candy },
  { match: /doce|bombom|trufa|brigad/i, Icon: Cookie },
  { match: /embalag|caixa|forminh|descart/i, Icon: Package },
  { match: /confeit|bolo|massa/i, Icon: CakeSlice },
  { match: /festa|decor/i, Icon: PartyPopper },
  { match: /pão|pao|salg|lanch/i, Icon: Croissant },
  { match: /bebida|café|cafe|suco/i, Icon: Coffee },
];
function iconFor(name: string) {
  return ICONS.find((x) => x.match.test(name))?.Icon ?? ShoppingBasket;
}

export async function CategoryTiles() {
  const categories = await getNavCategories(8);
  if (categories.length === 0) return null;

  return (
    <section className="bg-cream">
      <div className="container-wide py-12 lg:py-16">
        <div className="flex items-end justify-between gap-4 mb-9">
          <div>
            <span className="kicker">Departamentos</span>
            <h2 className="display-xl text-ink mt-3">Monte seu pedido</h2>
          </div>
          <Link href="/produtos" className="shrink-0 inline-flex items-center gap-1.5 text-rose-brand hover:text-redDeep font-extrabold text-[13px] uppercase tracking-[0.06em] transition">
            Ver tudo <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.slice(0, 8).map((c, i) => {
            const Icon = iconFor(c.name);
            return (
              <Link
                key={c.id}
                href={`/produtos?categoria=${c.slug}`}
                className="group relative rounded-3xl overflow-hidden h-44 lg:h-52 shadow-[0_18px_40px_-26px_rgba(60,35,20,0.6)] hover:-translate-y-1 transition-all"
                style={{ background: TONES[i % TONES.length] }}
              >
                {/* textura + scrim */}
                <div className="absolute inset-0 tex-diag opacity-70" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 to-transparent" />

                {/* icone */}
                <Icon className="absolute top-4 left-4 text-white/90 group-hover:scale-110 transition-transform" size={30} strokeWidth={1.8} />
                {/* contagem */}
                <span className="absolute top-4 right-4 bg-white/95 text-ink text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                  {c.productCount} {c.productCount === 1 ? "item" : "itens"}
                </span>

                {/* rotulo */}
                <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-2">
                  <div className="font-display font-extrabold text-white text-[19px] lg:text-[21px] leading-tight drop-shadow">
                    {c.name}
                  </div>
                  <span className="shrink-0 w-8 h-8 rounded-full bg-white text-rose-brand flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1 transition-all">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
