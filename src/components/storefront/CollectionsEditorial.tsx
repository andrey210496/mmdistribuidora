import Link from "next/link";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    eyebrow: "Coleção",
    title: "Chocolates Nobres",
    desc: "Origem premium, ao leite, meio amargo e branco. Para quem entende de cacau.",
    image: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=1200&q=85",
    href: "/produtos?categoria=chocolates",
    span: "lg:col-span-7 lg:row-span-2",
  },
  {
    eyebrow: "Embalagens",
    title: "Linha Festa",
    desc: "Caixas, forminhas e detalhes para encantar.",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=85",
    href: "/produtos?categoria=embalagens",
    span: "lg:col-span-5",
  },
  {
    eyebrow: "Confeitaria",
    title: "Ingredientes Selecionados",
    desc: "Bases que fazem a diferença no resultado final.",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=900&q=85",
    href: "/produtos?categoria=confeitaria",
    span: "lg:col-span-5",
  },
];

export function CollectionsEditorial() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container-wide">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow mb-3">Nossas coleções</span>
          <h2 className="display-section text-espresso mt-3">
            Curadoria <span className="font-serif italic font-medium text-caramel">para profissionais</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {collections.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group relative overflow-hidden bg-cocoa min-h-[420px] lg:min-h-0 ${c.span}`}
            >
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/40 to-transparent" />
              </div>

              <div className="relative h-full p-8 lg:p-10 flex flex-col justify-end text-cream">
                <span className="eyebrow-gold mb-3">{c.eyebrow}</span>
                <h3 className="display-card mb-3">{c.title}</h3>
                <p className="text-cream/75 text-sm mb-6 max-w-md">{c.desc}</p>
                <span className="inline-flex items-center gap-2 text-cream text-[12px] font-medium uppercase tracking-[0.2em] border-b border-cream/40 pb-1 w-fit group-hover:gap-3 group-hover:border-cream transition-all">
                  Explorar
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
