import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";

const promos = [
  {
    title: "Combo Confeiteiro",
    subtitle: "Chocolate + embalagem + ingredientes",
    discount: "Até 40% OFF",
    cta: "Ver combo",
    href: "/produtos?ofertas=1",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=900&q=80",
    bg: "from-cocoa to-espresso",
    accent: "text-gold",
  },
  {
    title: "Embalagens em destaque",
    subtitle: "Caixas, forminhas e sacos",
    discount: "A partir de R$ 5,90",
    cta: "Comprar",
    href: "/produtos?categoria=embalagens",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=80",
    bg: "from-[#a5aa66] to-[#6b7340]",
    accent: "text-cream",
  },
  {
    title: "Coleção Festas",
    subtitle: "Tudo pra mesa de doces ficar perfeita",
    discount: "Frete grátis +R$200",
    cta: "Ver coleção",
    href: "/produtos?categoria=festas",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=900&q=80",
    bg: "from-[#e8a2b6] to-[#b06b80]",
    accent: "text-cream",
  },
];

export function PromoGrid() {
  return (
    <section className="py-12 lg:py-16 bg-cream/40">
      <div className="container-default">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="eyebrow mb-2 text-xs">
              <Tag size={11} />
              Ofertas em destaque
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa">
              Aproveita enquanto dura
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promos.map((promo, i) => (
            <Link
              key={promo.title}
              href={promo.href}
              className={`group relative aspect-[4/5] md:aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br ${promo.bg} ${
                i === 0 ? "md:row-span-1" : ""
              } hover:shadow-[0_24px_60px_-16px_rgba(90,43,23,0.4)] transition-all duration-500 hover:-translate-y-1`}
            >
              {/* Imagem de fundo */}
              <div className="absolute inset-0 opacity-50 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={promo.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Conteúdo */}
              <div className="relative h-full p-6 lg:p-7 flex flex-col justify-end text-white">
                <div className="text-[11px] font-bold uppercase tracking-widest mb-2 opacity-90">
                  {promo.discount}
                </div>
                <h3 className={`font-display font-bold text-2xl lg:text-3xl leading-tight mb-1 ${promo.accent}`}>
                  {promo.title}
                </h3>
                <p className="text-white/85 text-sm mb-4">{promo.subtitle}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold w-fit border-b-2 border-white/40 pb-0.5 group-hover:border-white transition">
                  {promo.cta}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
