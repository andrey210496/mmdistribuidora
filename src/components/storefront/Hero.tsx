import Link from "next/link";
import { ArrowRight, Star, ShieldCheck, Truck, Clock } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { Price } from "./Price";

// Hero do rebrand "atacado apetitoso": tipografia gigante, canvas creme com
// textura dourada, selo-explosao de desconto e cartao de oferta estilo etiqueta.
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream tex-dots">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-20 w-[620px] h-[620px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(242,178,62,.55), transparent 70%)" }}
      />
      <div className="container-wide relative grid lg:grid-cols-12 gap-10 lg:gap-8 items-center py-12 lg:py-20">
        {/* Texto */}
        <div className="lg:col-span-6 anim-fade-up">
          <span className="inline-flex items-center gap-2 bg-ink text-white text-[11px] font-extrabold tracking-[0.16em] uppercase pl-2 pr-3.5 py-2 rounded-full">
            <span className="bg-gold text-espressoDark rounded-full px-2 py-0.5 text-[10px]">NOVO</span>
            Distribuidora para food service
          </span>

          <h1 className="display-mega text-ink mt-6">
            Sua lanchonete<br />
            abastecida no{" "}
            <span className="relative inline-block text-rose-brand">
              atacado
              <svg aria-hidden viewBox="0 0 200 18" className="absolute left-0 -bottom-2 w-full h-3 text-gold" preserveAspectRatio="none">
                <path d="M2 13 C 50 4, 150 4, 198 11" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-[18px] text-cocoa/90 leading-relaxed max-w-lg mt-7">
            Hambúrguer, queijo, frios, bebidas e descartáveis com preço de
            distribuidora. <b className="text-ink">Sem pedido mínimo</b> e entrega na região.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-9">
            <Link href="/produtos" className="btn-pink group text-[15px] px-9 py-4 shadow-[0_16px_34px_-14px_rgba(209,43,43,0.75)]">
              Comprar no atacado
              <ArrowRight size={19} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" className="btn-whatsapp text-[15px] px-9 py-4">
              Pedir no WhatsApp
            </Link>
          </div>

          {/* prova social */}
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-10">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={17} className="text-gold fill-gold" />
                ))}
              </div>
              <span className="text-[13.5px] font-bold text-ink">+500 negócios atendidos</span>
            </div>
            <span className="hidden sm:inline text-line">|</span>
            <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-cocoa">
              <ShieldCheck size={18} className="text-rose-brand" strokeWidth={2.4} /> +3.000 produtos
            </span>
          </div>
        </div>

        {/* Painel de oferta */}
        <div className="lg:col-span-6 anim-fade-up-1">
          <div className="relative">
            {/* cartao vermelho com textura */}
            <div
              className="relative rounded-[28px] overflow-hidden tex-diag p-7 sm:p-9 shadow-[0_40px_80px_-30px_rgba(168,30,30,0.6)]"
              style={{ background: "linear-gradient(150deg,#D12B2B 0%, #A81E1E 58%, #7d1414 100%)" }}
            >
              <span className="kicker kicker-light">Oferta da semana</span>
              <div className="font-display font-extrabold text-white text-[30px] sm:text-[38px] leading-[1.02] mt-3">
                Comprou mais,<br />pagou menos.
              </div>

              {/* cartao de produto branco dentro */}
              <div className="mt-7 bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 bg-rose-brand/10 text-rose-brand text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full">
                    <Clock size={13} /> Preço por quantidade
                  </span>
                  <span className="text-[12px] font-bold text-clay">Queijo Mussarela 1kg</span>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <span className="block text-[13px] text-clay line-through leading-none">R$ 42,90</span>
                    <Price cents={2990} className="text-[42px] text-rose-brand mt-1" />
                  </div>
                  <span className="text-[13px] font-extrabold text-ink pb-1">/un</span>
                </div>
                <div className="rule-dashed mt-4 pt-3 flex items-center gap-2 text-[12px] text-cocoa/80">
                  <Truck size={15} className="text-rose-brand" /> Entrega no Vale do Paraíba
                </div>
              </div>
            </div>

            {/* selo-explosao de desconto */}
            <div className="absolute -top-5 -right-3 sm:-right-5 rotate-[8deg] anim-float-soft">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-gold drop-shadow-lg" aria-hidden>
                  <path fill="currentColor" d="M50 2l9 11 14-6 3 15 15 3-6 14 11 9-11 9 6 14-15 3-3 15-14-6-9 11-9-11-14 6-3-15-15-3 6-14L2 50l11-9-6-14 15-3 3-15 14 6z" />
                </svg>
                <div className="relative text-center text-espressoDark">
                  <span className="block text-[10px] font-extrabold uppercase leading-none">até</span>
                  <span className="block font-display font-extrabold text-[30px] sm:text-[34px] leading-none">30%</span>
                  <span className="block text-[10px] font-extrabold uppercase leading-none">off</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
