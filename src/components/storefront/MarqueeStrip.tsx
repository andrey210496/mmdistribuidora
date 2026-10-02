import { Star } from "lucide-react";

const phrases = [
  "Atacado sem pedido mínimo",
  "Entrega no Vale do Paraíba",
  "Preço que cai por quantidade",
  "Pix, cartão, dinheiro ou fiado",
  "+3.000 produtos pro seu balcão",
  "Despacho rápido",
  "Atendimento humano no WhatsApp",
];

// Faixa de ofertas rolando — energia de atacadao, vermelho MM com estrelas douradas.
export function MarqueeStrip() {
  return (
    <section className="bg-rose-brand text-white py-3.5 overflow-hidden tex-diag">
      <div className="anim-marquee marquee-track">
        {[...Array(2)].map((_, dup) => (
          <div key={dup} className="flex items-center gap-8 shrink-0 pr-8" aria-hidden={dup === 1}>
            {phrases.map((p, i) => (
              <div key={`${dup}-${i}`} className="flex items-center gap-8 shrink-0">
                <span className="font-display font-extrabold text-[15px] lg:text-[17px] uppercase tracking-[0.04em] whitespace-nowrap">
                  {p}
                </span>
                <Star size={15} className="text-gold fill-gold shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
