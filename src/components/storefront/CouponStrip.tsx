"use client";

import { useState } from "react";
import { Copy, Check, Tag, Sparkles } from "lucide-react";

const coupons = [
  {
    code: "BRIGADEIRO10",
    discount: "10% OFF",
    desc: "1ª compra acima de R$ 100",
    color: "from-caramel to-[#8a4a1c]",
  },
  {
    code: "FRETE50",
    discount: "Frete R$ 5,90",
    desc: "Em pedidos acima de R$ 150",
    color: "from-rose-brand to-[#A81E1E]",
  },
  {
    code: "PASCOA15",
    discount: "15% OFF",
    desc: "Coleção Páscoa 2026",
    color: "from-olive to-[#6b7340]",
  },
];

export function CouponStrip() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="py-8 bg-cream/40 border-y border-cocoa/10">
      <div className="container-default">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-lg lg:text-xl font-bold text-cocoa flex items-center gap-2">
            <Sparkles size={18} className="text-caramel" />
            Cupons ativos
          </h2>
          <span className="text-xs text-cocoa/60">Use na finalização da compra</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {coupons.map((c) => (
            <div
              key={c.code}
              className={`relative bg-gradient-to-r ${c.color} text-white rounded-xl p-4 overflow-hidden flex items-center gap-4 shadow-md hover:shadow-lg transition`}
            >
              <Tag size={28} className="text-white/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-2xl leading-none">
                  {c.discount}
                </div>
                <div className="text-white/85 text-xs mt-1">{c.desc}</div>
              </div>
              <button
                onClick={() => copy(c.code)}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 flex items-center gap-1.5 text-xs font-bold transition shrink-0"
                aria-label={`Copiar cupom ${c.code}`}
              >
                {copied === c.code ? (
                  <>
                    <Check size={14} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    {c.code}
                  </>
                )}
              </button>

              {/* Borda picotada estilo cupom */}
              <span className="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-0.5 border-l-2 border-dashed border-white/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
