import Link from "next/link";
import { Package, Cake, Truck, Tag, Award, MapPin, Heart } from "lucide-react";
import { GoldCurveTopLeft, GoldCurveBottomRight } from "./Decorations";

const features = [
  { Icon: Package, label: "Embalagens e\nDescartáveis", color: "bg-rose-brand" },
  { Icon: Cake, label: "Insumos para\nConfeitaria", color: "bg-caramel" },
  { Icon: Truck, label: "Entrega\nRápida", color: "bg-olive" },
  { Icon: Tag, label: "Atacado e\nVarejo", color: "bg-cocoa" },
  { Icon: Award, label: "Atendimento\nEspecializado", color: "bg-[#d4a574]" },
];

export function HeroBanner() {
  return (
    <section className="relative bg-pink-soft overflow-hidden">
      {/* Curvas douradas decorativas */}
      <GoldCurveTopLeft className="absolute -top-2 -left-4 w-[300px] lg:w-[400px] h-auto opacity-90 pointer-events-none" />
      <GoldCurveBottomRight className="absolute -bottom-2 -right-4 w-[300px] lg:w-[400px] h-auto opacity-90 pointer-events-none" />

      {/* Glow rosa decorativo */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full bg-rose-brand/15 blur-[100px] pointer-events-none" />

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center py-10 lg:py-14 min-h-[480px]">
          {/* Lado esquerdo — Logo + headline + ícones */}
          <div className="lg:col-span-7 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* Logo grande lateral */}
              <div className="shrink-0 anim-fade">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Doce Encanto"
                  className="w-28 h-28 lg:w-40 lg:h-40 object-contain drop-shadow-xl"
                />
              </div>

              {/* Headline + ícones */}
              <div className="flex-1 lg:pt-2">
                <p className="anim-fade-up text-rose-brand font-bold text-xs lg:text-sm uppercase tracking-[0.15em] mb-2">
                  A distribuidora parceira de quem precisa de
                </p>
                <h1 className="anim-fade-up-1 display-hero text-cocoa mb-3">
                  EMBALAGENS E PRODUTOS
                  <br />
                  <span className="text-olive">PARA VENDER MAIS!</span>
                </h1>
                <p className="anim-fade-up-2 text-cocoa/75 text-sm lg:text-base mb-5 max-w-md">
                  Tudo para confeitaria, docerias, lanchonetes, restaurantes
                  <br />
                  e o seu negócio{" "}
                  <span className="font-serif italic font-medium text-rose-brand text-lg">
                    crescer!
                  </span>{" "}
                  <Heart size={14} className="inline-block fill-rose-brand text-rose-brand" />
                </p>

                {/* Ícones de features */}
                <div className="anim-fade-up-3 grid grid-cols-3 sm:grid-cols-5 gap-3 lg:gap-4 mb-6 max-w-2xl">
                  {features.map(({ Icon, label, color }) => (
                    <div key={label} className="flex flex-col items-center text-center">
                      <div
                        className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full ${color} flex items-center justify-center mb-2 shadow-md`}
                      >
                        <Icon size={20} className="text-white" strokeWidth={1.8} />
                      </div>
                      <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-cocoa whitespace-pre-line leading-tight">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="https://wa.me/5512997347896"
                  className="btn-whatsapp anim-fade-up-3"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  FALE COM A GENTE!
                </Link>
              </div>
            </div>
          </div>

          {/* Lado direito — Composição de produtos */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] lg:aspect-square max-w-[520px] mx-auto anim-fade">
              {/* Imagem dos produtos */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=900&q=85"
                  alt="Produtos para confeitaria"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge circular rosa "TUDO PARA ADOÇAR" */}
              <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 anim-wobble-soft">
                <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-rose-brand text-white flex flex-col items-center justify-center shadow-2xl border-4 border-white">
                  <div className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider leading-tight">
                    TUDO PARA
                  </div>
                  <div className="font-display font-bold text-sm lg:text-lg leading-tight">
                    ADOÇAR
                  </div>
                  <div className="text-[8px] lg:text-[10px] font-bold uppercase tracking-wider leading-tight">
                    SEU NEGÓCIO
                  </div>
                  <Heart size={12} className="fill-white mt-1" />
                </div>
              </div>

              {/* Tag flutuante "Embalagens" */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg rotate-[-4deg] anim-float-soft hidden md:block">
                <div className="text-[9px] uppercase tracking-widest text-cocoa/60 font-bold">
                  Embalagens
                </div>
                <div className="font-display font-bold text-cocoa text-sm">
                  que valorizam
                </div>
                <div className="text-[10px] text-cocoa/60">o seu produto!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ribbon entrega */}
        <div className="pb-6 lg:pb-8">
          <div className="inline-flex items-center gap-3 bg-olive/95 text-white rounded-full px-6 py-2.5 shadow-md">
            <MapPin size={16} className="text-cream" />
            <span className="font-bold text-sm uppercase tracking-wider">
              Entregamos em todo Vale do Paraíba e Litoral Norte
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
