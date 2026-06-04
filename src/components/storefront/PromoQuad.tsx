import Link from "next/link";
import { ArrowRight, MapPin, Truck } from "lucide-react";

// Cards de destaque da home. Estrutura limpa: imagem no topo (sem texto por
// cima) + conteúdo embaixo numa faixa de cor sólida da marca. Legível e coeso.
const promos = [
  {
    title: "Embalagens que valorizam o seu produto",
    desc: "Caixas, sacos, forminhas e descartáveis pra apresentar bem.",
    cta: "Ver embalagens",
    href: "/produtos?categoria=embalagens",
    bg: "bg-pink-warm",
    btnClass: "bg-rose-brand text-white hover:bg-[#c97d92]",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=85",
  },
  {
    title: "Insumos para confeitaria",
    desc: "Tudo o que você precisa para criar e encantar!",
    cta: "Ver insumos",
    href: "/produtos?categoria=confeitaria",
    bg: "bg-[#dde0c6]",
    btnClass: "bg-olive text-white hover:bg-[#7d8550]",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=800&q=85",
  },
  {
    title: "Produtos das melhores marcas",
    desc: "Qualidade e confiança que você já conhece.",
    cta: "Ver marcas",
    href: "/produtos",
    bg: "bg-[#f4e6d0]",
    btnClass: "bg-caramel text-white hover:bg-[#8a4a1c]",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=85",
    brands: ["Nutella", "Italac", "Piracanjuba", "Puratos", "Harald", "Sicao"],
  },
];

export function PromoQuad() {
  return (
    <section className="pt-10 lg:pt-14 pb-12 lg:pb-16 bg-cream">
      <div className="container-wide">
        <div className="text-center mb-7">
          <span className="eyebrow text-cocoa/60">Pra todo tipo de negócio</span>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa mt-2">
            Tudo que sua confeitaria precisa
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {promos.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="group flex flex-col rounded-2xl overflow-hidden border border-cocoa/10 bg-white hover:shadow-[0_16px_40px_-12px_rgba(90,43,23,0.25)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Imagem topo — limpa, sem texto por cima */}
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Conteúdo embaixo — cor sólida da marca */}
              <div className={`${p.bg} flex flex-col flex-1 p-5`}>
                <h3 className="font-display font-bold text-cocoa text-lg leading-tight tracking-tight mb-1.5">
                  {p.title}
                </h3>
                <p className="text-cocoa/70 text-xs lg:text-sm mb-3">{p.desc}</p>

                {p.brands && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.brands.map((b) => (
                      <span
                        key={b}
                        className="bg-white/80 text-cocoa text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                <span
                  className={`mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider ${p.btnClass} transition w-fit`}
                >
                  {p.cta}
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
                </span>
              </div>
            </Link>
          ))}

          {/* 4º card — Entrega (destaque escuro) */}
          <Link
            href="/contato"
            className="group flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-cocoa to-espresso text-cream hover:shadow-[0_16px_40px_-12px_rgba(90,43,23,0.4)] hover:-translate-y-1 transition-all duration-300 min-h-[280px]"
          >
            {/* Faixa visual topo com mapa */}
            <div className="relative h-36 flex items-center justify-center bg-black/10 overflow-hidden">
              <Truck size={56} className="text-gold/80" strokeWidth={1.2} />
              {/* pontos de entrega decorativos */}
              <div className="absolute inset-0 opacity-40">
                {[[30, 40], [70, 30], [55, 65], [80, 70], [40, 75]].map(([x, y], i) => (
                  <span
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-rose-brand"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col flex-1 p-5">
              <MapPin size={18} className="text-gold mb-2" />
              <h3 className="font-display font-bold text-lg leading-tight mb-1.5">
                Entregamos no{" "}
                <span className="text-gold">Vale do Paraíba</span> e Litoral Norte
              </h3>
              <p className="text-cream/70 text-xs lg:text-sm mb-3">
                Mais agilidade e segurança para o seu negócio.
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-brand text-white hover:bg-[#c97d92] transition w-fit">
                Saiba mais
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
