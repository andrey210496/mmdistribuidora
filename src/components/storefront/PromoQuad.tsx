import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const promos = [
  {
    title: "EMBALAGENS",
    titleAccent: "QUE VALORIZAM",
    titleEnd: "O SEU PRODUTO!",
    cta: "Ver produtos",
    href: "/produtos?categoria=embalagens",
    bg: "bg-pink-warm",
    text: "text-cocoa",
    btnClass: "bg-rose-brand text-white hover:bg-[#c97d92]",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=85",
  },
  {
    title: "INSUMOS PARA",
    titleAccent: "CONFEITARIA",
    desc: "Tudo o que você precisa para criar e encantar!",
    cta: "Ver produtos",
    href: "/produtos?categoria=confeitaria",
    bg: "bg-[#dde0c6]",
    text: "text-cocoa",
    btnClass: "bg-olive text-white hover:bg-[#7d8550]",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=800&q=85",
  },
  {
    title: "PRODUTOS DAS",
    titleAccent: "MELHORES MARCAS",
    desc: "Qualidade e confiança que você já conhece!",
    cta: "Ver marcas",
    href: "/marcas",
    bg: "bg-[#f4e6d0]",
    text: "text-cocoa",
    btnClass: "bg-caramel text-white hover:bg-[#8a4a1c]",
    image: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=800&q=85",
    showBrands: true,
  },
];

export function PromoQuad() {
  return (
    <section className="py-10 lg:py-14 bg-cream">
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {promos.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className={`group relative ${p.bg} rounded-2xl overflow-hidden p-6 flex flex-col min-h-[280px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Imagem decorativa */}
              <div className="absolute right-0 top-0 w-2/3 h-full opacity-90 pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt=""
                  className="w-full h-full object-cover object-right"
                  loading="lazy"
                />
                {/* Fade pra esquerda */}
                <div className={`absolute inset-0 ${p.bg} bg-gradient-to-r from-current to-transparent opacity-90`} style={{ background: "linear-gradient(to right, currentColor 0%, transparent 60%)" }} />
              </div>

              <div className={`relative z-10 ${p.text} flex-1 flex flex-col`}>
                <h3 className="font-display font-bold text-lg lg:text-xl leading-tight tracking-tight">
                  {p.title}
                </h3>
                <h3 className="font-display font-bold text-lg lg:text-xl leading-tight tracking-tight">
                  {p.titleAccent}
                </h3>
                {p.titleEnd && (
                  <h3 className="font-display font-bold text-lg lg:text-xl leading-tight tracking-tight">
                    {p.titleEnd}
                  </h3>
                )}
                {p.desc && (
                  <p className={`text-xs lg:text-sm mt-2 mb-4 ${p.text} opacity-80 max-w-[180px]`}>
                    {p.desc}
                  </p>
                )}

                {p.showBrands && (
                  <div className="grid grid-cols-3 gap-1 my-3 max-w-[200px]">
                    {["Nutella", "Italac", "Piracanjuba", "Puratos", "Harald", "Sicao"].map((b) => (
                      <span key={b} className="bg-white/70 text-cocoa text-[8px] font-bold uppercase tracking-tight px-1 py-0.5 rounded text-center truncate">
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider ${p.btnClass} transition`}>
                    {p.cta}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* 4º card — Entregas escuro com mapa */}
          <Link
            href="/atendimento"
            className="group relative bg-gradient-to-br from-cocoa to-espresso rounded-2xl overflow-hidden p-6 flex flex-col min-h-[280px] text-cream hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Mapa decorativo */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
              <svg viewBox="0 0 200 240" className="w-32 h-40" aria-hidden>
                <path
                  d="M 50 30 Q 60 10, 100 25 Q 140 15, 160 50 Q 175 90, 165 140 Q 155 190, 110 215 Q 75 225, 50 200 Q 30 170, 35 130 Q 28 80, 50 30 Z"
                  fill="none"
                  stroke="#d4a574"
                  strokeWidth="2"
                />
                {[
                  [80, 60], [110, 80], [95, 100], [130, 130], [85, 140], [115, 170],
                ].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="6" fill="#e8a2b6" />
                    <circle cx={x} cy={y} r="2" fill="white" />
                  </g>
                ))}
              </svg>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <MapPin size={20} className="text-gold mb-2" />
              <h3 className="font-display font-bold text-lg lg:text-xl leading-tight">
                ENTREGAMOS NO
              </h3>
              <h3 className="font-display font-bold text-lg lg:text-xl leading-tight text-gold">
                VALE DO PARAÍBA
              </h3>
              <h3 className="font-display font-bold text-lg lg:text-xl leading-tight">
                E LITORAL NORTE!
              </h3>
              <p className="text-cream/75 text-xs lg:text-sm mt-2 mb-4 max-w-[180px]">
                Mais agilidade e segurança para o seu negócio.
              </p>

              <div className="mt-auto">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-brand text-white hover:bg-[#c97d92] transition">
                  Saiba mais
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
