import { Headphones, Grid3x3, Tag, CreditCard, ShieldCheck } from "lucide-react";

const benefits = [
  {
    Icon: Headphones,
    title: "Atendimento",
    titleBold: "Rápido e Humanizado",
    desc: "Fale com quem entende do seu negócio",
  },
  {
    Icon: Grid3x3,
    title: "Variedade",
    titleBold: "Completa",
    desc: "Mais de 3.000 produtos para você escolher",
  },
  {
    Icon: Tag,
    title: "Preços Justos",
    titleBold: "e Competitivos",
    desc: "Condições especiais para atacado e revenda",
  },
  {
    Icon: CreditCard,
    title: "Pagamento",
    titleBold: "Facilitado",
    desc: "Parcele em até 6x no cartão para atacado",
  },
  {
    Icon: ShieldCheck,
    title: "Compra Segura",
    titleBold: "e Confiável",
    desc: "Seus dados e pedidos sempre protegidos",
  },
];

export function BenefitsBar() {
  return (
    <section className="py-8 lg:py-10 bg-cream">
      <div className="container-wide">
        <div className="bg-[#f4e6d0]/60 rounded-2xl px-4 lg:px-8 py-6 lg:py-8 border border-cocoa/10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-6 lg:divide-x lg:divide-cocoa/10">
            {benefits.map(({ Icon, title, titleBold, desc }, i) => (
              <div key={title} className={`flex items-start gap-3 ${i > 0 ? "lg:pl-6" : ""}`}>
                <div className="w-12 h-12 rounded-xl bg-white text-cocoa flex items-center justify-center shrink-0 border border-cocoa/10">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase tracking-wider text-cocoa/70 leading-tight">
                    {title}
                  </div>
                  <div className="font-bold text-cocoa text-[13px] uppercase tracking-wider leading-tight mb-1">
                    {titleBold}
                  </div>
                  <div className="text-[11px] text-cocoa/60 leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
