import { Truck, BadgePercent, CreditCard, Headset } from "lucide-react";

const items = [
  { Icon: BadgePercent, t: "Atacado sem mínimo", d: "O preço cai por quantidade, automático" },
  { Icon: Truck, t: "Entrega na região", d: "Vale do Paraíba e Litoral Norte" },
  { Icon: CreditCard, t: "Pague do seu jeito", d: "Pix, cartão, dinheiro ou fiado" },
  { Icon: Headset, t: "Atendimento humano", d: "Fale com quem entende do ramo" },
];

// Faixa de confianca — cards creme com icone em circulo dourado/vermelho.
export function BenefitsBar() {
  return (
    <section className="bg-cream">
      <div className="container-wide py-8 lg:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {items.map(({ Icon, t, d }) => (
            <div
              key={t}
              className="group flex items-center gap-3.5 bg-white rounded-2xl border border-line px-4 lg:px-5 py-4 hover:border-rose-brand/40 hover:shadow-[0_14px_30px_-20px_rgba(168,30,30,0.5)] transition-all"
            >
              <span className="shrink-0 w-12 h-12 rounded-full bg-rose-brand text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon size={21} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="font-display font-bold text-[15px] text-ink leading-tight">{t}</div>
                <div className="text-[12px] text-clay leading-snug mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
