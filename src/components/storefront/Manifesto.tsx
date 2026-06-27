import Link from "next/link";
import { Quote } from "lucide-react";
import { GoldCurveTopLeft, ChocolateDripDivider, Bonbon, GoldStar, Whisk } from "./Decorations";

export function Manifesto() {
  return (
    <section className="py-28 lg:py-36 bg-cocoa-gradient text-cream relative overflow-hidden">
      <GoldCurveTopLeft className="absolute top-0 right-0 w-[400px] h-auto opacity-50 pointer-events-none rotate-180" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Decorações flutuantes */}
      <Bonbon color="caramel" className="absolute top-20 right-[10%] w-16 h-16 anim-float-medium opacity-70 hidden md:block" />
      <Bonbon color="rose" className="absolute bottom-32 left-[8%] w-12 h-12 anim-float-counter opacity-60 hidden md:block" />
      <Whisk className="absolute bottom-12 right-[15%] w-20 h-20 text-gold/20 anim-spin-slow hidden lg:block" />

      <GoldStar className="absolute top-32 left-[20%] w-4 h-4 text-gold anim-sparkle" />
      <GoldStar className="absolute bottom-40 right-[28%] w-3 h-3 text-gold anim-sparkle" style={{ animationDelay: "1s" }} />

      <div className="container-narrow relative grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-1 hidden lg:flex justify-center">
          <Quote size={48} className="text-gold/50" />
        </div>

        <div className="lg:col-span-11">
          <span className="eyebrow-gold mb-6">Manifesto</span>
          <blockquote className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.15] tracking-tight font-medium mb-10">
            Aqui não vendemos só ingrediente.{" "}
            <span className="text-shimmer-gold font-serif italic font-medium">Vendemos a vontade</span>{" "}
            de quem acorda cedo, abre a confeitaria e faz o doce que vai marcar uma festa, um casamento, um aniversário inesquecível.
          </blockquote>

          <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-cream/10">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-caramel to-cocoa ring-2 ring-gold/30 flex items-center justify-center font-display font-bold text-cream">
              DE
            </div>
            <div>
              <div className="font-semibold text-gold">Equipe MM Distribuidora</div>
              <div className="text-cream/60 text-sm">Há mais de 10 anos no mercado</div>
            </div>

            {/* Badge de destaque oliva */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive/20 border border-olive/40 text-olive text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-olive anim-pulse-soft" />
                Empresa nacional
              </span>
              <Link href="/produtos" className="btn-outline-gold">
                Comece pelo catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Drip transitando pra cor da próxima seção */}
      <ChocolateDripDivider
        className="absolute bottom-0 left-0 right-0 w-full h-12"
        fill="#fbf6ee"
      />
    </section>
  );
}
