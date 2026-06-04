import Link from "next/link";
import { Clock, ArrowUpRight, BookOpen } from "lucide-react";

const recipes = [
  {
    tag: "RECEITA",
    tagColor: "bg-caramel",
    title: "Brigadeiro gourmet em 5 minutos",
    desc: "A receita que toda confeiteira precisa saber. Rendimento alto, custo baixo, sabor de premium.",
    time: "5 min",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80",
    href: "/blog/brigadeiro-gourmet-5-minutos",
  },
  {
    tag: "DICA",
    tagColor: "bg-rose-brand",
    title: "Como montar mesa de doces lucrativa",
    desc: "Cálculo de custo, precificação e apresentação que vendem mais. Aprenda na prática.",
    time: "8 min",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80",
    href: "/blog/mesa-de-doces-lucrativa",
  },
  {
    tag: "TUTORIAL",
    tagColor: "bg-olive",
    title: "Pão de mel perfeito (passo a passo)",
    desc: "Massa fofinha, recheio cremoso, cobertura crocante. O segredo está no banho de chocolate.",
    time: "12 min",
    image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800&q=80",
    href: "/blog/pao-de-mel-passo-a-passo",
  },
];

export function RecipesSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container-default">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="eyebrow mb-2 text-xs">
              <BookOpen size={12} />
              Conteúdo pra confeiteiros
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa mt-2">
              Receitas e dicas pra <span className="text-caramel">vender mais</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-cocoa text-sm font-semibold hover:text-caramel inline-flex items-center gap-1.5 transition group"
          >
            Ver todos os artigos
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recipes.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group bg-white rounded-2xl overflow-hidden border border-cocoa/10 hover:border-caramel/40 hover:shadow-[0_20px_40px_-12px_rgba(90,43,23,0.2)] transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <span
                  className={`absolute top-3 left-3 ${r.tagColor} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md`}
                >
                  {r.tag}
                </span>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock size={10} />
                  {r.time}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-lg text-cocoa mb-2 group-hover:text-caramel transition leading-tight">
                  {r.title}
                </h3>
                <p className="text-cocoa/70 text-sm mb-4 flex-1 line-clamp-2 leading-relaxed">
                  {r.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-caramel text-sm font-semibold group-hover:gap-2 transition-all">
                  Ler artigo
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
