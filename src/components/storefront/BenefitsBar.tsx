import { Truck, Tag, Boxes, CreditCard, MessageCircle, Percent, Store } from "lucide-react";

const items = [
  { Icon: Truck, t: "Entrega rápida na região" },
  { Icon: Tag, t: "Atacado e varejo" },
  { Icon: Percent, t: "Preço por quantidade" },
  { Icon: Boxes, t: "+3.000 produtos" },
  { Icon: CreditCard, t: "Pix, cartão e dinheiro" },
  { Icon: Store, t: "Sem valor mínimo" },
  { Icon: MessageCircle, t: "Atende no WhatsApp" },
];

// Ticker vermelho rolante — assinatura "atacadao", diferente do bloco de cards.
export function BenefitsBar() {
  const row = [...items, ...items];
  return (
    <section className="bg-rose-brand text-white overflow-hidden select-none">
      <div className="flex whitespace-nowrap anim-marquee hover:[animation-play-state:paused]">
        {row.map(({ Icon, t }, i) => (
          <span key={i} className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-extrabold uppercase tracking-wide">
            <Icon size={16} className="text-gold" strokeWidth={2.4} />
            {t}
            <span className="text-gold ml-4">◆</span>
          </span>
        ))}
      </div>
    </section>
  );
}
