import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export function BigOfferBanner() {
  return (
    <section className="py-8 lg:py-12 bg-cream/40">
      <div className="container-default">
        <div className="relative bg-gradient-to-r from-espresso via-cocoa to-[#3d1c0e] rounded-3xl overflow-hidden">
          {/* Imagem de fundo */}
          <div className="absolute inset-0 opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600&q=80"
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/80 to-transparent" />

          {/* Sprinkles decorativos */}
          <div className="absolute top-0 right-1/3 anim-sprinkle pointer-events-none">
            <div className="w-3 h-1 rounded-full bg-rose-brand" />
          </div>
          <div className="absolute top-0 right-1/2 anim-sprinkle pointer-events-none" style={{ animationDelay: "1s" }}>
            <div className="w-3 h-1 rounded-full bg-gold" />
          </div>

          <div className="relative grid lg:grid-cols-2 gap-6 p-8 lg:p-12 items-center">
            <div className="text-cream">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold uppercase tracking-wider mb-4">
                <Clock size={12} />
                Termina em 48h
              </div>
              <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight mb-4">
                Combo Confeiteiro:{" "}
                <span className="text-gold">tudo o que você precisa</span> com 35% OFF
              </h2>
              <p className="text-cream/80 mb-6 lg:mb-8 max-w-lg">
                Chocolate ao leite + meio amargo + granulado + forminhas em um único combo,
                pronto pra você produzir muito.
              </p>

              <div className="flex flex-wrap items-baseline gap-4 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-cream/60 mb-1">
                    De
                  </div>
                  <div className="text-cream/40 line-through text-xl">R$ 199,90</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gold mb-1">
                    Por apenas
                  </div>
                  <div className="font-display text-5xl lg:text-6xl font-bold text-gold leading-none">
                    R$ 129<span className="text-3xl">,90</span>
                  </div>
                  <div className="text-xs text-cream/70 mt-1">
                    ou 6x de R$ 21,65 sem juros
                  </div>
                </div>
              </div>

              <Link href="/produtos?ofertas=1" className="btn-gold">
                Quero o combo
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="hidden lg:block relative">
              <div className="grid grid-cols-2 gap-3">
                {[
                  "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80",
                  "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=400&q=80",
                  "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400&q=80",
                  "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80",
                ].map((src, i) => (
                  <div
                    key={src}
                    className={`aspect-square rounded-2xl overflow-hidden ring-1 ring-gold/30 ${i % 2 === 0 ? "translate-y-3" : "-translate-y-3"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
