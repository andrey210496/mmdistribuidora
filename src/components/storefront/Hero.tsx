import Link from "next/link";
import { ArrowRight, Truck, Package, Percent, Store } from "lucide-react";
import { COMPANY } from "@/lib/company";

// Hero comercial "atacadao": alto contraste, proposta direta, CTAs fortes
// e um bloco de atacado em destaque (dourado). Sem gradiente/blur.
export function Hero() {
  return (
    <section className="bg-ink text-white relative overflow-hidden border-b-4 border-gold">
      {/* Bloco geometrico solido */}
      <div
        className="absolute inset-y-0 right-0 w-2/5 bg-rose-brand/90 hidden lg:block"
        style={{ clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0% 100%)" }}
        aria-hidden
      />

      <div className="container-wide relative grid lg:grid-cols-12 gap-8 items-center py-9 lg:py-12">
        {/* Texto */}
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 bg-gold text-ink text-[12px] font-extrabold uppercase tracking-wider px-3 py-1.5">
            <Package size={14} /> Atacado &amp; Varejo · Entrega rápida
          </span>

          <h1 className="font-display font-bold uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-[64px] mt-5">
            Preço de <span className="text-gold">distribuidora</span>
            <br />
            pra abastecer seu negócio
          </h1>

          <p className="text-white/70 text-base lg:text-lg max-w-xl mt-5 leading-relaxed">
            Doces, embalagens e insumos com <strong className="text-white">preço de atacado e varejo</strong> no
            mesmo lugar. Confeitaria, mercado, lanchonete ou festa — a gente entrega rápido e cobra justo.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <Link
              href="/produtos"
              className="group inline-flex items-center gap-2 bg-gold hover:bg-[#e0a230] text-ink font-extrabold uppercase tracking-wide text-sm px-7 py-4 transition"
            >
              Ver catálogo
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              className="inline-flex items-center gap-2 border-2 border-white/30 hover:border-white text-white font-extrabold uppercase tracking-wide text-sm px-7 py-4 transition"
            >
              Pedir no WhatsApp
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-white/70 text-[13px] font-semibold">
            <span className="flex items-center gap-1.5"><Truck size={16} className="text-gold" /> Entrega na região</span>
            <span className="flex items-center gap-1.5"><Store size={16} className="text-gold" /> Atacado sem valor mínimo</span>
            <span className="flex items-center gap-1.5"><Percent size={16} className="text-gold" /> Preço por quantidade</span>
          </div>
        </div>

        {/* Card de atacado */}
        <div className="lg:col-span-5 relative">
          <div className="bg-white text-ink border-l-8 border-gold shadow-2xl p-7 lg:p-8">
            <div className="flex items-center gap-2 text-rose-brand text-[11px] font-extrabold uppercase tracking-widest mb-2">
              <Percent size={16} /> Comprou mais, pagou menos
            </div>
            <h3 className="font-display font-bold uppercase text-2xl leading-tight mb-3">
              Preço de atacado por quantidade
            </h3>
            <p className="text-sm text-ink/65 leading-relaxed mb-5">
              Bateu a quantidade mínima do produto, o preço de atacado entra sozinho no carrinho.
              Atacadista cadastrado leva o desconto em qualquer volume.
            </p>
            <ul className="space-y-2 mb-6">
              {["Sem pedido mínimo de valor", "Mistura itens no mesmo pedido", "Atendimento por WhatsApp"].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm font-semibold text-ink/80">
                  <span className="w-5 h-5 bg-olive text-white flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/produtos"
              className="w-full bg-ink hover:bg-graphite text-white font-extrabold uppercase tracking-wide text-sm h-12 flex items-center justify-center gap-2 transition"
            >
              Começar a comprar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
