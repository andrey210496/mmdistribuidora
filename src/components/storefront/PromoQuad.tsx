import Link from "next/link";
import { ArrowRight, MapPin, Truck } from "lucide-react";

// Blocos de destaque da home — color-blocking solido, comercial.
const promos = [
  {
    title: "Embalagens que valorizam o produto",
    desc: "Caixas, sacos, forminhas e descartáveis.",
    cta: "Ver embalagens",
    href: "/produtos?categoria=embalagens",
    block: "bg-ink text-white",
    btn: "bg-gold text-ink hover:bg-[#e0a230]",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=85",
  },
  {
    title: "Insumos para confeitaria",
    desc: "Tudo pra criar, produzir e vender mais.",
    cta: "Ver insumos",
    href: "/produtos?categoria=confeitaria",
    block: "bg-gold text-ink",
    btn: "bg-ink text-white hover:bg-graphite",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=800&q=85",
  },
  {
    title: "As melhores marcas do mercado",
    desc: "Qualidade que sua clientela já conhece.",
    cta: "Ver marcas",
    href: "/produtos",
    block: "bg-rose-brand text-white",
    btn: "bg-white text-rose-brand hover:bg-white/90",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=85",
    brands: ["Nutella", "Italac", "Piracanjuba", "Puratos", "Harald", "Sicao"],
  },
];

export function PromoQuad() {
  return (
    <section className="py-10 lg:py-12 bg-smoke">
      <div className="container-wide">
        <div className="flex items-stretch gap-3 mb-6">
          <span className="w-1.5 bg-rose-brand shrink-0" aria-hidden />
          <h2 className="font-display text-xl lg:text-[26px] font-bold text-ink uppercase tracking-tight leading-none">
            Pra todo tipo de negócio
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {promos.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex flex-col rounded-lg overflow-hidden border border-line hover:-translate-y-0.5 transition-transform"
            >
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className={`${p.block} flex flex-col flex-1 p-5`}>
                <h3 className="font-display font-bold uppercase text-lg leading-tight tracking-tight mb-1.5">
                  {p.title}
                </h3>
                <p className="opacity-80 text-[13px] mb-3">{p.desc}</p>
                {p.brands && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.brands.map((b) => (
                      <span key={b} className="bg-white/15 text-white text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <span className={`mt-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 text-[11px] font-extrabold uppercase tracking-wider ${p.btn} transition w-fit`}>
                  {p.cta}
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
                </span>
              </div>
            </Link>
          ))}

          {/* 4º bloco — Entrega */}
          <Link
            href="/contato"
            className="group flex flex-col rounded-lg overflow-hidden bg-graphite text-white hover:-translate-y-0.5 transition-transform min-h-[280px]"
          >
            <div className="relative h-36 flex items-center justify-center bg-black/20 overflow-hidden">
              <Truck size={56} className="text-gold" strokeWidth={1.4} />
              <div className="absolute inset-0 opacity-50">
                {[[30, 40], [70, 30], [55, 65], [80, 70], [40, 75]].map(([x, y], i) => (
                  <span key={i} className="absolute w-2 h-2 rounded-full bg-rose-brand" style={{ left: `${x}%`, top: `${y}%` }} />
                ))}
              </div>
            </div>
            <div className="flex flex-col flex-1 p-5">
              <MapPin size={18} className="text-gold mb-2" />
              <h3 className="font-display font-bold uppercase text-lg leading-tight mb-1.5">
                Entregamos no <span className="text-gold">Vale do Paraíba</span> e Litoral Norte
              </h3>
              <p className="text-white/70 text-[13px] mb-3">Agilidade e segurança pro seu negócio.</p>
              <span className="mt-auto inline-flex items-center gap-1.5 px-4 h-9 text-[11px] font-extrabold uppercase tracking-wider bg-rose-brand text-white hover:bg-redDeep transition w-fit">
                Saiba mais <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
