import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroEditorial() {
  return (
    <section className="relative bg-cream-soft overflow-hidden">
      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 min-h-[calc(100vh-128px)] lg:min-h-[680px]">
          {/* Lado esquerdo — Texto editorial */}
          <div className="lg:col-span-5 flex flex-col justify-center py-16 lg:py-24 lg:pr-12 relative z-10">
            <span className="anim-fade-up eyebrow text-cocoa/60 mb-6">
              Coleção 2026 · Confeitaria Profissional
            </span>

            <h1 className="anim-fade-up-1 display-hero text-espresso mb-7">
              <span className="block">A arte</span>
              <span className="block font-serif italic font-medium text-caramel">
                de fazer doces
              </span>
              <span className="block">começa aqui.</span>
            </h1>

            <p className="anim-fade-up-2 text-cocoa/70 text-base lg:text-lg leading-relaxed max-w-md mb-10">
              Chocolates premium, embalagens elegantes e ingredientes selecionados — para confeiteiros que levam a profissão a sério.
            </p>

            <div className="anim-fade-up-3 flex items-center gap-6 flex-wrap">
              <Link href="/produtos" className="btn-primary group">
                Explorar coleção
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition"
                />
              </Link>
              <Link
                href="/clube"
                className="text-espresso text-[13px] font-medium uppercase tracking-[0.15em] hover:text-caramel transition border-b border-espresso/40 pb-1"
              >
                Conheça o Clube
              </Link>
            </div>

            {/* Detalhe inferior */}
            <div className="anim-fade-up-3 mt-16 pt-8 border-t border-cocoa/15 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div className="font-display text-2xl font-bold text-espresso">10+</div>
                <div className="text-[10px] uppercase tracking-widest text-cocoa/60 mt-1">
                  Anos no mercado
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-espresso">1.500</div>
                <div className="text-[10px] uppercase tracking-widest text-cocoa/60 mt-1">
                  Produtos
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-espresso">500+</div>
                <div className="text-[10px] uppercase tracking-widest text-cocoa/60 mt-1">
                  Confeiteiros
                </div>
              </div>
            </div>
          </div>

          {/* Lado direito — Fotografia dominante */}
          <div className="lg:col-span-7 relative">
            <div className="anim-fade relative h-full min-h-[400px] lg:min-h-[680px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600&q=85"
                alt="Doces premium artesanais"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              {/* Overlay sutil cocoa nas bordas */}
              <div className="absolute inset-0 bg-gradient-to-r from-cream-soft via-transparent to-transparent lg:via-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent" />

              {/* Card de produto destaque sobreposto — sutil */}
              <div className="absolute bottom-8 right-8 lg:bottom-12 lg:right-12 max-w-[280px] anim-fade-up-2">
                <div className="bg-cream/95 backdrop-blur-md p-5 border border-cream/40 shadow-2xl">
                  <div className="eyebrow text-caramel mb-2">Em destaque</div>
                  <div className="font-display font-bold text-espresso text-base leading-tight mb-1">
                    Chocolate ao Leite Premium
                  </div>
                  <div className="text-cocoa/60 text-xs mb-3">Embalagem 1kg</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-cocoa/40 line-through">R$ 69,90</div>
                      <div className="font-display text-xl font-bold text-espresso leading-none">
                        R$ 49,90
                      </div>
                    </div>
                    <Link
                      href="/produtos/chocolate-ao-leite-premium-1kg"
                      className="text-espresso text-[10px] font-medium uppercase tracking-[0.15em] border-b border-espresso pb-0.5 hover:text-caramel hover:border-caramel transition"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
