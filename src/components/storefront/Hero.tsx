import Link from "next/link";
import { ArrowRight, Star, Zap, ShieldCheck } from "lucide-react";
import { GoldStar, Sprinkle, Bonbon } from "./Decorations";

export function Hero() {
  return (
    <section className="bg-cocoa-gradient text-cream relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-caramel/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-rose-brand/10 blur-[120px] pointer-events-none" />

      {/* Sprinkles caindo do topo */}
      <div className="absolute top-0 left-[20%] anim-sprinkle pointer-events-none">
        <Sprinkle className="w-3" color="#D12B2B" />
      </div>
      <div className="absolute top-0 left-[45%] anim-sprinkle pointer-events-none" style={{ animationDelay: "1s" }}>
        <Sprinkle className="w-3" color="#d4a574" />
      </div>
      <div className="absolute top-0 left-[70%] anim-sprinkle pointer-events-none" style={{ animationDelay: "2s" }}>
        <Sprinkle className="w-3" color="#a5aa66" />
      </div>

      {/* Estrelas */}
      <GoldStar className="absolute top-12 left-[8%] w-4 h-4 text-gold anim-sparkle" />
      <GoldStar className="absolute bottom-12 right-[10%] w-4 h-4 text-gold anim-sparkle" style={{ animationDelay: "1s" }} />

      <div className="container-default relative grid lg:grid-cols-12 gap-8 items-center py-10 lg:py-16">
        {/* Conteúdo da promoção */}
        <div className="lg:col-span-7 relative z-10">
          {/* Tag de promoção */}
          <div className="anim-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-wider mb-5 shadow-lg">
            <Zap size={12} className="fill-white" />
            Ofertas da semana · até quinta
          </div>

          <h1 className="anim-fade-up-delay-1 font-display font-bold leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-5">
            <span className="block text-cream">Chocolate premium</span>
            <span className="block">
              <span className="text-shimmer-gold">com até 30% OFF</span>
            </span>
          </h1>

          <p className="anim-fade-up-delay-2 text-cream/75 text-base lg:text-lg max-w-xl mb-7 leading-relaxed">
            Aproveite as ofertas em chocolates, embalagens e ingredientes pra confeitaria.
            <strong className="text-gold"> Frete grátis</strong> em pedidos acima de R$ 200.
          </p>

          <div className="anim-fade-up-delay-3 flex flex-wrap items-center gap-3 mb-8">
            <Link href="/produtos?ofertas=1" className="btn-gold group">
              Ver ofertas agora
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link href="/produtos" className="btn-outline-gold">
              Catálogo completo
            </Link>
          </div>

          {/* Trust strip */}
          <div className="anim-fade-up-delay-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-cream/80 text-sm">
            <div className="flex items-center gap-2">
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} className="fill-gold text-gold" />
                ))}
              </span>
              <span><strong className="text-gold">4.9/5</strong> · +500 confeiteiros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-gold" />
              <span>Compra 100% segura</span>
            </div>
          </div>
        </div>

        {/* Card de oferta destaque (lado direito) */}
        <div className="lg:col-span-5 relative">
          <div className="relative">
            {/* Card principal — produto em destaque */}
            <div className="relative bg-cream rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-6 lg:p-8 overflow-hidden anim-fade-up-delay-1 z-10">
              {/* Badge de oferta */}
              <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-2xl rotate-12 z-20 anim-pulse-soft">
                <div className="text-[9px] uppercase font-bold tracking-wider leading-none">OFF</div>
                <div className="font-display font-bold text-2xl leading-none">30%</div>
              </div>

              <div className="relative aspect-[4/3] bg-gradient-to-br from-cocoa to-espresso rounded-2xl mb-5 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80"
                  alt="Chocolate premium em oferta"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-caramel text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  Mais vendido
                </div>
              </div>

              <div className="text-cocoa">
                <div className="text-[10px] font-bold text-caramel uppercase tracking-widest mb-1">Destaque da semana</div>
                <h3 className="font-display font-bold text-xl mb-2 leading-tight">
                  Chocolate ao Leite Premium 1kg
                </h3>
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} className="fill-gold text-gold" />
                  ))}
                  <span className="text-xs text-cocoa/60 ml-1">(127 avaliações)</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-cocoa/40 line-through">De R$ 69,90</div>
                    <div className="font-display text-3xl font-bold text-espresso">R$ 49,90</div>
                    <div className="text-xs text-olive font-bold">6x sem juros</div>
                  </div>
                  <Link
                    href="/produtos/chocolate-ao-leite-premium-1kg"
                    className="bg-espresso hover:bg-cocoa text-cream font-bold text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5 transition"
                  >
                    Comprar
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bombons decorativos atrás */}
            <Bonbon
              color="rose"
              className="absolute -top-6 -left-8 w-16 h-16 anim-float-medium opacity-90 drop-shadow-2xl hidden md:block"
            />
            <Bonbon
              color="caramel"
              className="absolute -bottom-4 -right-8 w-14 h-14 anim-float-counter opacity-90 drop-shadow-2xl hidden md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
