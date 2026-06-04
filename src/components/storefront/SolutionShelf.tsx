import Link from "next/link";
import { ArrowRight } from "lucide-react";

const solutions = [
  {
    emoji: "🍫",
    title: "Pra fazer brigadeiro",
    desc: "Chocolate, leite condensado, granulado e forminhas",
    items: ["Chocolate ao leite", "Leite condensado", "Granulado", "Forminhas nº 5"],
    href: "/produtos?q=brigadeiro",
    bg: "from-caramel/10 to-cream",
    accent: "text-caramel",
  },
  {
    emoji: "🎂",
    title: "Pra decorar bolo",
    desc: "Coberturas, sprinkles, confetes e ferramentas",
    items: ["Sprinkles", "Cobertura", "Bicos de confeitar", "Saco descartável"],
    href: "/produtos?q=cobertura",
    bg: "from-rose-brand/15 to-cream",
    accent: "text-rose-brand",
  },
  {
    emoji: "💍",
    title: "Pra montar mesa de doces",
    desc: "Doces prontos, embalagens, caixas e enfeites",
    items: ["Brigadeiros gourmet", "Beijinhos", "Caixas premium", "Forminhas decoradas"],
    href: "/produtos?categoria=festas",
    bg: "from-olive/15 to-cream",
    accent: "text-olive",
  },
  {
    emoji: "🐰",
    title: "Pra fazer ovo de Páscoa",
    desc: "Chocolate nobre, formas, embalagens e papelão",
    items: ["Chocolate meio amargo", "Formas de ovo", "Papel chumbo", "Saco celofane"],
    href: "/produtos?q=pascoa",
    bg: "from-cocoa/10 to-cream",
    accent: "text-cocoa",
  },
];

export function SolutionShelf() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="container-default">
        <div className="text-center mb-8">
          <span className="eyebrow mb-3 text-xs">Compre por necessidade</span>
          <h2 className="font-display text-2xl lg:text-4xl font-bold text-cocoa mt-3">
            O que você vai fazer hoje?
          </h2>
          <p className="text-cocoa/60 text-sm lg:text-base mt-2 max-w-xl mx-auto">
            Selecionamos kits prontos com tudo que você precisa pra cada tipo de receita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {solutions.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className={`group relative bg-gradient-to-br ${s.bg} rounded-2xl p-6 border border-cocoa/10 hover:border-caramel/40 hover:shadow-[0_20px_40px_-12px_rgba(90,43,23,0.2)] transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="text-4xl lg:text-5xl mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 inline-block">
                {s.emoji}
              </div>
              <h3 className="font-display text-lg font-bold text-cocoa mb-1">
                {s.title}
              </h3>
              <p className="text-cocoa/70 text-xs mb-4 leading-snug">{s.desc}</p>

              <ul className="space-y-1 mb-5">
                {s.items.map((item) => (
                  <li key={item} className="text-xs text-cocoa/80 flex items-center gap-1.5">
                    <span className={`w-1 h-1 rounded-full bg-current ${s.accent}`} />
                    {item}
                  </li>
                ))}
              </ul>

              <span className={`inline-flex items-center gap-1 text-sm font-bold ${s.accent} group-hover:gap-2 transition-all`}>
                Ver produtos
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
