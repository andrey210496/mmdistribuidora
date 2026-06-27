import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Package, BadgePercent } from "lucide-react";
import { COMPANY } from "@/lib/company";

// Hero codado (sem foto de stock): proposta de valor da distribuidora,
// CTAs e um card destacando o atacado.
export function Hero() {
  return (
    <section className="bg-cocoa-deep text-cream relative overflow-hidden">
      {/* Glows da paleta */}
      <div className="absolute top-1/2 -right-32 w-[480px] h-[480px] rounded-full bg-rose-brand/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full bg-gold/10 blur-[120px] pointer-events-none" />

      <div className="container-wide relative grid lg:grid-cols-12 gap-10 items-center py-14 lg:py-20">
        {/* Texto */}
        <div className="lg:col-span-7 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-brand text-white text-xs font-bold uppercase tracking-wider mb-5">
            <Truck size={13} /> Entrega no Vale do Paraíba e Litoral Norte
          </div>

          <h1 className="font-display font-bold leading-[0.98] tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-5">
            <span className="block">Sua distribuidora de</span>
            <span className="block text-gold">doces, embalagens e insumos</span>
          </h1>

          <p className="text-cream/75 text-base lg:text-lg max-w-xl mb-7 leading-relaxed">
            Preço de <strong className="text-cream">atacado e varejo</strong> no mesmo lugar.
            Abasteça sua confeitaria, mercado ou festa com quem entrega rápido e cobra justo.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link href="/produtos" className="btn-gold group">
              Ver catálogo
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              className="btn-outline-gold"
            >
              Falar no WhatsApp
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-cream/80 text-sm">
            <span className="flex items-center gap-1.5">
              <Package size={15} className="text-gold" /> Atacado e varejo
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={15} className="text-gold" /> Entrega rápida
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-gold" /> Compra segura
            </span>
          </div>
        </div>

        {/* Card de atacado */}
        <div className="lg:col-span-5 relative">
          <div className="relative bg-cream text-cocoa rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-7 lg:p-8 overflow-hidden">
            <div className="absolute -top-3 -right-3 bg-caramel text-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-2xl rotate-12">
              <BadgePercent size={18} />
              <div className="text-[9px] uppercase font-bold tracking-wider leading-none mt-0.5">atacado</div>
            </div>

            <div className="text-[10px] font-bold text-caramel uppercase tracking-widest mb-2">
              Comprou mais, pagou menos
            </div>
            <h3 className="font-display font-bold text-2xl mb-3 leading-tight">
              Preço de atacado por quantidade
            </h3>
            <p className="text-sm text-cocoa/70 leading-relaxed mb-5">
              Acima da quantidade mínima de cada produto, o preço de atacado entra
              automaticamente no carrinho. Atacadista cadastrado leva o desconto em qualquer volume.
            </p>

            <ul className="space-y-2.5 mb-6">
              {[
                "Sem pedido mínimo de valor",
                "Mistura de itens no mesmo pedido",
                "Atendimento por WhatsApp",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-cocoa/80">
                  <span className="w-5 h-5 rounded-full bg-olive/20 text-olive flex items-center justify-center shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>

            <Link
              href="/produtos"
              className="w-full bg-espresso hover:bg-cocoa text-cream font-bold text-sm px-4 py-3 rounded-full flex items-center justify-center gap-1.5 transition"
            >
              Começar a comprar
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
