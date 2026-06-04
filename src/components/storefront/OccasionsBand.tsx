import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import { Bonbon, Sprinkle, GoldStar } from "./Decorations";

const occasions = [
  {
    name: "Aniversário",
    icon: "🎂",
    desc: "Bolos, doces finos, embalagens personalizadas",
    href: "/produtos?categoria=festas",
  },
  {
    name: "Casamento",
    icon: "💍",
    desc: "Mesa de doces, lembrancinhas elegantes",
    href: "/produtos?categoria=festas",
  },
  {
    name: "Páscoa",
    icon: "🐰",
    desc: "Chocolates premium, embalagens de ovos",
    href: "/produtos?categoria=chocolates",
  },
  {
    name: "Chá de bebê",
    icon: "👶",
    desc: "Bem-casados, bombons, decoração",
    href: "/produtos?categoria=doces-finos",
  },
];

export function OccasionsBand() {
  return (
    <section
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f5d4dd 0%, #f4e6d0 50%, #e8a2b6 100%)",
      }}
    >
      {/* Decorações */}
      <Bonbon
        color="rose"
        className="absolute top-12 left-[6%] w-20 h-20 anim-float-medium opacity-90 drop-shadow-[0_8px_20px_rgba(232,162,182,0.5)]"
      />
      <Bonbon
        color="cocoa"
        className="absolute bottom-12 right-[8%] w-16 h-16 anim-float-counter opacity-80 drop-shadow-[0_8px_20px_rgba(90,43,23,0.4)]"
      />
      <Bonbon
        color="caramel"
        className="absolute top-[35%] right-[12%] w-12 h-12 anim-wobble opacity-80 hidden lg:block"
      />

      {/* Granulado caindo */}
      <div className="absolute top-0 left-[20%] anim-sprinkle pointer-events-none">
        <Sprinkle className="w-3" color="#5a2b17" />
      </div>
      <div className="absolute top-0 left-[40%] anim-sprinkle pointer-events-none" style={{ animationDelay: "1s" }}>
        <Sprinkle className="w-3" color="#bf6e27" />
      </div>
      <div className="absolute top-0 left-[60%] anim-sprinkle pointer-events-none" style={{ animationDelay: "2s" }}>
        <Sprinkle className="w-3" color="#a5aa66" />
      </div>
      <div className="absolute top-0 left-[80%] anim-sprinkle pointer-events-none" style={{ animationDelay: "0.5s" }}>
        <Sprinkle className="w-3" color="#5a2b17" />
      </div>

      {/* Estrelas */}
      <GoldStar className="absolute top-20 right-[30%] w-5 h-5 text-cocoa/30 anim-sparkle" />
      <GoldStar className="absolute bottom-20 left-[35%] w-4 h-4 text-cocoa/30 anim-sparkle" style={{ animationDelay: "1.2s" }} />

      <div className="container-default relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="eyebrow text-[#8a4a5c] mb-4">
              <Heart size={12} className="fill-[#8a4a5c]" />
              Para cada momento
            </span>
            <h2 className="display-lg text-cocoa mt-4 mb-5">
              Doce em cada <em className="font-serif italic font-medium" style={{ color: "#8a4a5c" }}>celebração</em>.
            </h2>
            <p className="text-cocoa/75 text-lg leading-relaxed mb-8">
              Aniversário, casamento, chá de bebê, Páscoa… A gente tem tudo
              que sua confeitaria precisa pra eternizar cada momento.
            </p>
            <Link
              href="/produtos?categoria=festas"
              className="inline-flex items-center gap-2 text-cocoa font-semibold hover:text-[#8a4a5c] group transition"
            >
              Ver coleção de festas
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-4">
              {occasions.map((o, i) => (
                <Link
                  key={o.name}
                  href={o.href}
                  className={`group bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white hover:bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(138,74,92,0.3)] ${
                    i % 2 === 1 ? "lg:translate-y-8" : ""
                  }`}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    {o.icon}
                  </div>
                  <h3 className="font-display font-bold text-lg text-cocoa mb-1">
                    {o.name}
                  </h3>
                  <p className="text-cocoa/70 text-sm leading-snug">{o.desc}</p>
                  <ArrowUpRight
                    size={16}
                    className="mt-3 text-cocoa/40 group-hover:text-[#8a4a5c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
