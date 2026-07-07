import { Truck, Tag, CreditCard, MessageCircle } from "lucide-react";

const items = [
  { Icon: Truck, t: "Entrega na região", d: "Vale do Paraíba e Litoral Norte" },
  { Icon: Tag, t: "Atacado sem mínimo", d: "Preço por quantidade, automático" },
  { Icon: CreditCard, t: "Pague do seu jeito", d: "Pix, cartão ou dinheiro" },
  { Icon: MessageCircle, t: "Atendimento humano", d: "Fale com quem entende do ramo" },
];

// Faixa de confiança premium — discreta, com filetes e ícones em latão.
export function BenefitsBar() {
  return (
    <section className="bg-sand border-y border-line">
      <div className="container-wide">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-line">
          {items.map(({ Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3.5 px-5 py-6">
              <Icon size={22} strokeWidth={1.5} className="text-brass shrink-0" />
              <div className="min-w-0">
                <div className="font-serif text-[15px] text-ink leading-tight">{t}</div>
                <div className="text-[12px] text-clay leading-snug mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
