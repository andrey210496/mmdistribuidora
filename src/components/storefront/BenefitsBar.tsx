import { Truck, Boxes, Tag, CreditCard, MessageCircle } from "lucide-react";

const benefits = [
  { Icon: Truck, title: "Entrega rápida", desc: "Vale do Paraíba e Litoral Norte" },
  { Icon: Tag, title: "Atacado e varejo", desc: "Preço por quantidade, sem mínimo" },
  { Icon: Boxes, title: "+3.000 produtos", desc: "Doces, embalagens e insumos" },
  { Icon: CreditCard, title: "Pix, cartão e dinheiro", desc: "Pague do seu jeito" },
  { Icon: MessageCircle, title: "Atende no WhatsApp", desc: "Fala com gente de verdade" },
];

// Faixa de confiança comercial — flat, borda forte, ícones vermelhos.
export function BenefitsBar() {
  return (
    <section className="bg-white border-y-2 border-line">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-line">
          {benefits.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-4 lg:px-5 py-5">
              <span className="w-11 h-11 shrink-0 bg-smoke text-rose-brand flex items-center justify-center">
                <Icon size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="font-extrabold text-ink text-[13px] uppercase tracking-wide leading-tight">
                  {title}
                </div>
                <div className="text-[11.5px] text-ink/55 leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
