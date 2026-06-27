import Link from "next/link";
import { Crown, Truck, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export const metadata = {
  title: "Quem Somos",
  description:
    "A MM Distribuidora é uma distribuidora de doces, chocolates e embalagens para confeitaria no Vale do Paraíba e Litoral Norte.",
};

const valores = [
  { Icon: Heart, title: "Qualidade que encanta", desc: "Seleção de produtos premium para confeitarias, festas e revenda." },
  { Icon: Truck, title: "Entrega na região", desc: "Atendemos o Vale do Paraíba e o Litoral Norte com agilidade." },
  { Icon: ShieldCheck, title: "Compra segura", desc: "Pagamento protegido e atendimento próximo de verdade." },
];

export default function SobrePage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream py-16 lg:py-20">
        <div className="container-default text-center">
          <span className="eyebrow text-gold">Quem somos</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gold mt-3 mb-4">
            MM Distribuidora
          </h1>
          <p className="text-cream/85 max-w-2xl mx-auto text-lg">
            Distribuidora de doces, chocolates e embalagens para confeitaria — feita
            para quem trabalha com amor pelos detalhes.
          </p>
        </div>
      </section>

      <main className="container-default py-12 lg:py-16">
        <div className="max-w-3xl mx-auto space-y-5 text-cocoa/80 leading-relaxed">
          <p>
            A <strong className="text-cocoa">MM Distribuidora</strong> nasceu para facilitar a vida de
            confeiteiras, doceiras, buffets e lojistas do <strong className="text-cocoa">Vale do
            Paraíba e Litoral Norte</strong>. Reunimos em um só lugar chocolates, insumos de
            confeitaria, embalagens e doces prontos — com preço justo e variedade.
          </p>
          <p>
            Trabalhamos com seleção de produtos de qualidade, atendimento próximo e entrega na
            região. Para quem compra em volume, temos{" "}
            <Link href="/produtos" className="text-rose-brand font-semibold hover:underline">
              preços de atacado
            </Link>{" "}
            o ano inteiro.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto mt-12">
          {valores.map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-cocoa/10 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-brand/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-rose-brand" />
              </div>
              <h3 className="font-bold text-cocoa">{title}</h3>
              <p className="text-cocoa/60 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-12 rounded-2xl bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream p-8 text-center">
          <Crown className="inline-block text-gold mb-2" size={28} fill="currentColor" />
          <h2 className="font-display text-2xl font-bold text-gold mb-2">Vamos fazer doces juntos?</h2>
          <p className="text-cream/80 mb-5">Conheça o catálogo ou fale com a gente.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/produtos" className="btn-pink">
              Ver catálogo <ArrowRight size={16} />
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 border border-cream/30 text-cream font-bold px-5 py-3 rounded-full hover:bg-cream/10 transition"
            >
              Falar conosco
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
