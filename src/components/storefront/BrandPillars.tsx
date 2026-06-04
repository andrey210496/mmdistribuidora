import {
  CircleDollarSign,
  Boxes,
  ShieldCheck,
  Award,
  Zap,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Whisk, GoldStar } from "./Decorations";

const pillars = [
  {
    icon: CircleDollarSign,
    title: "Preço justo",
    desc: "Compre direto da distribuidora, sem atravessador inflando.",
    accent: "caramel",
  },
  {
    icon: Boxes,
    title: "Variedade",
    desc: "Mais de 1.500 produtos para todo tipo de receita.",
    accent: "rose",
  },
  {
    icon: ShieldCheck,
    title: "Confiança",
    desc: "+500 confeiteiros já compram com a gente todo mês.",
    accent: "olive",
  },
  {
    icon: Award,
    title: "Qualidade",
    desc: "Marcas premium e produtos selecionados a dedo.",
    accent: "cocoa",
  },
  {
    icon: Zap,
    title: "Facilidade",
    desc: "Site rápido, checkout simples, despacho em 24h.",
    accent: "caramel",
  },
  {
    icon: HeartHandshake,
    title: "Atendimento humano",
    desc: "Time pronto pra te ouvir, não só um robô.",
    accent: "rose",
  },
] as const;

// Classes estáticas — Tailwind precisa do nome completo em texto pra gerar
const accents = {
  caramel: {
    iconIdle: "bg-caramel/10",
    iconHover: "group-hover:bg-caramel group-hover:text-white",
    barColor: "bg-caramel",
  },
  rose: {
    iconIdle: "bg-rose-brand/15",
    iconHover: "group-hover:bg-rose-brand group-hover:text-white",
    barColor: "bg-rose-brand",
  },
  olive: {
    iconIdle: "bg-olive/15",
    iconHover: "group-hover:bg-olive group-hover:text-white",
    barColor: "bg-olive",
  },
  cocoa: {
    iconIdle: "bg-cocoa/10",
    iconHover: "group-hover:bg-cocoa group-hover:text-white",
    barColor: "bg-cocoa",
  },
};

export function BrandPillars() {
  return (
    <section className="py-20 lg:py-28 bg-cream-gradient relative overflow-hidden">
      {/* Whisk gigante decorativo */}
      <Whisk className="absolute top-20 right-[5%] w-32 h-32 text-cocoa/10 anim-spin-slow pointer-events-none hidden lg:block" />
      <Whisk className="absolute bottom-20 left-[5%] w-24 h-24 text-rose-brand/15 anim-spin-reverse pointer-events-none hidden lg:block" />

      {/* Estrelas decorativas */}
      <GoldStar className="absolute top-32 left-[15%] w-4 h-4 text-gold/40 anim-sparkle pointer-events-none" />
      <GoldStar className="absolute top-1/2 right-[20%] w-3 h-3 text-rose-brand/60 anim-sparkle pointer-events-none" style={{ animationDelay: "1s" }} />
      <GoldStar className="absolute bottom-32 left-[35%] w-3 h-3 text-olive/60 anim-sparkle pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Decoração de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gold/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/10 pointer-events-none" />

      <div className="container-default relative">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="eyebrow mb-4">Nosso compromisso</span>
          <h2 className="display-lg text-cocoa mt-4 mb-5">
            Resolvemos a vida de quem <em className="text-caramel font-serif italic font-medium">vende doces</em>.
          </h2>
          <p className="text-cocoa/70 text-lg leading-relaxed">
            Não é só vender ingrediente. É ser parceira de quem acorda cedo,
            quem entrega encomenda, quem leva a confeitaria a sério.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-cocoa/10 rounded-3xl overflow-hidden border border-cocoa/10">
          {pillars.map(({ icon: Icon, title, desc, accent }, i) => {
            const a = accents[accent];
            return (
              <div
                key={title}
                className="bg-cream p-8 lg:p-10 hover:bg-white transition group relative"
              >
                <div className="absolute top-6 right-6 font-display text-5xl text-cocoa/[0.06] font-bold leading-none transition group-hover:text-cocoa/10">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${a.iconIdle} ${a.iconHover} text-cocoa flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`}
                >
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-bold text-cocoa mb-2">
                  {title}
                </h3>
                <p className="text-cocoa/70 text-[15px] leading-relaxed">{desc}</p>

                {/* Linha de accent crescendo no hover */}
                <span
                  className={`absolute bottom-0 left-0 h-1 w-0 ${a.barColor} group-hover:w-full transition-all duration-500`}
                />
              </div>
            );
          })}
        </div>

        {/* Frase de fechamento */}
        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-3 text-caramel font-semibold">
            <Sparkles size={16} className="text-gold anim-sparkle" />
            <span className="font-serif italic text-lg">
              Tudo isso, no preço de quem entende do mercado.
            </span>
            <Sparkles size={16} className="text-gold anim-sparkle" style={{ animationDelay: "0.6s" }} />
          </p>
        </div>
      </div>
    </section>
  );
}
