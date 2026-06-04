import Link from "next/link";
import { ArrowRight } from "lucide-react";

const articles = [
  {
    eyebrow: "Receita",
    title: "Brigadeiro gourmet: a receita que vende",
    desc: "Os segredos para um brigadeiro consistente, brilhante e com sabor inesquecível.",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=85",
    href: "/blog/brigadeiro-gourmet",
    span: "lg:col-span-7 lg:row-span-2",
    isLarge: true,
  },
  {
    eyebrow: "Negócio",
    title: "Como precificar mesa de doces",
    desc: "Cálculo de custo, mão de obra e margem ideal.",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=900&q=85",
    href: "/blog/precificar-mesa-de-doces",
    span: "lg:col-span-5",
  },
  {
    eyebrow: "Tendência",
    title: "Páscoa 2026: o que vai vender",
    desc: "Sabores, formatos e embalagens em alta para a temporada.",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=900&q=85",
    href: "/blog/pascoa-2026-tendencias",
    span: "lg:col-span-5",
  },
];

export function MagazineSection() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div className="max-w-xl">
            <span className="eyebrow mb-3">Conteúdo</span>
            <h2 className="display-section text-espresso mt-3">
              Para quem leva a <span className="font-serif italic font-medium text-caramel">confeitaria a sério</span>.
            </h2>
          </div>
          <Link href="/blog" className="btn-link group">
            Todos os artigos
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {articles.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className={`group flex flex-col bg-cream-soft ${a.span}`}
            >
              <div
                className={`relative overflow-hidden ${a.isLarge ? "aspect-[16/12]" : "aspect-[16/10]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.image}
                  alt={a.title}
                  className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="p-6 lg:p-8 flex-1 flex flex-col bg-white">
                <span className="eyebrow mb-3">{a.eyebrow}</span>
                <h3
                  className={`font-display font-bold text-espresso mt-2 mb-3 leading-tight tracking-tight group-hover:text-caramel transition ${a.isLarge ? "text-2xl lg:text-4xl" : "text-xl lg:text-2xl"}`}
                >
                  {a.title}
                </h3>
                <p className="text-cocoa/65 text-sm lg:text-base mb-5 flex-1 leading-relaxed">
                  {a.desc}
                </p>
                <span className="inline-flex items-center gap-2 text-espresso text-[11px] font-medium uppercase tracking-[0.2em] border-b border-espresso/30 pb-1 w-fit group-hover:gap-3 group-hover:border-espresso transition-all">
                  Ler artigo
                  <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
