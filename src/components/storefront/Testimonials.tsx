import { Star, Quote } from "lucide-react";
import { Bonbon, GoldStar } from "./Decorations";

const testimonials = [
  {
    name: "Mariana Lopes",
    role: "Confeitaria Doce Casa · São Paulo, SP",
    quote: "Mudei pra MM Distribuidora faz 6 meses e o lucro da confeitaria subiu 22%. Preço justo de verdade e o atendimento é outro nível.",
    rating: 5,
    avatar: "ML",
    color: "from-rose-brand to-[#A81E1E]",
    quoteColor: "text-rose-brand/40",
    barColor: "bg-rose-brand",
    bonbonColor: "rose" as const,
  },
  {
    name: "Roberto Mendes",
    role: "Brigadeiros do Beto · Curitiba, PR",
    quote: "Compro chocolate, embalagem e ingrediente tudo aqui. Chegou no dia seguinte, embalado certinho. Não preciso de outro fornecedor.",
    rating: 5,
    avatar: "RM",
    color: "from-caramel to-cocoa",
    quoteColor: "text-caramel/40",
    barColor: "bg-caramel",
    bonbonColor: "caramel" as const,
  },
  {
    name: "Carla Vieira",
    role: "Encantos da Carla · Belo Horizonte, MG",
    quote: "O Clube Ouro pagou o investimento no primeiro mês. Frete grátis sempre + 15% off = economia absurda. Recomendo demais.",
    rating: 5,
    avatar: "CV",
    color: "from-olive to-[#6b7340]",
    quoteColor: "text-olive/50",
    barColor: "bg-olive",
    bonbonColor: "cocoa" as const,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-cream relative overflow-hidden">
      {/* Decorações */}
      <GoldStar className="absolute top-16 left-[10%] w-4 h-4 text-gold/40 anim-sparkle" />
      <GoldStar className="absolute top-1/3 right-[8%] w-5 h-5 text-rose-brand/50 anim-sparkle" style={{ animationDelay: "1s" }} />
      <GoldStar className="absolute bottom-40 left-[40%] w-3 h-3 text-olive/50 anim-sparkle" style={{ animationDelay: "2s" }} />

      <Bonbon color="rose" className="absolute top-32 right-[5%] w-14 h-14 anim-float-counter opacity-30 hidden lg:block" />
      <Bonbon color="caramel" className="absolute bottom-20 left-[3%] w-12 h-12 anim-float-medium opacity-30 hidden lg:block" />

      <div className="container-default relative">
        <div className="max-w-2xl mb-16">
          <span className="eyebrow mb-4">Quem já confia</span>
          <h2 className="display-lg text-cocoa mt-4">
            Mais de <em className="text-caramel font-serif italic font-medium">500 confeiteiros</em> compram com a gente todo mês.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <article
              key={t.name}
              className="card p-8 relative card-lift flex flex-col group overflow-hidden"
            >
              {/* Bombom decorativo no canto */}
              <Bonbon
                color={t.bonbonColor}
                className="absolute -top-6 -right-6 w-20 h-20 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500"
              />

              <Quote
                size={36}
                className={`${t.quoteColor} absolute top-6 right-6 z-10`}
                strokeWidth={1.5}
              />

              <div className="flex gap-0.5 mb-5 relative">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} size={15} className="fill-gold text-gold" />
                ))}
              </div>

              <p className="text-cocoa font-serif text-[19px] leading-snug mb-8 flex-1 italic relative">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-5 border-t border-cocoa/10 relative">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-display font-bold shadow-lg ring-2 ring-white`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-cocoa text-sm">{t.name}</div>
                  <div className="text-cocoa/60 text-xs">{t.role}</div>
                </div>
              </div>

              {/* Linha de accent crescendo */}
              <span className={`absolute bottom-0 left-0 h-1 w-0 ${t.barColor} group-hover:w-full transition-all duration-500`} />
            </article>
          ))}
        </div>

        {/* Logos de confiança */}
        <div className="mt-20 pt-12 border-t border-cocoa/10">
          <p className="text-center text-[11px] uppercase tracking-[0.25em] text-cocoa/50 mb-6">
            Trabalhamos com as melhores marcas
          </p>
          <div className="overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />
            <div className="anim-marquee marquee-track opacity-60">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex items-center gap-12 shrink-0">
                  {["Nestlé", "Cacau Show", "Harald", "Garoto", "Sicao", "Callebaut", "Arcor", "Lacta"].map(
                    (brand) => (
                      <span key={`${dup}-${brand}`} className="font-display font-bold text-cocoa/70 text-xl whitespace-nowrap">
                        {brand}
                      </span>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
