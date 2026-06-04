import { CacaoLeaf } from "./Decorations";

const phrases = [
  "Chocolate premium",
  "Embalagens lindas",
  "Ingredientes frescos",
  "Granulado artesanal",
  "Forminhas pra brigadeiro",
  "Marcas de confiança",
  "Despacho em 24h",
  "Frete pra todo Brasil",
];

export function MarqueeStrip() {
  return (
    <section
      className="bg-caramel text-cream py-5 overflow-hidden border-y border-cocoa/20 relative"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #bf6e27 0%, #a85e1e 50%, #bf6e27 100%)",
      }}
    >
      {/* gradients laterais para fade */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-caramel to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-caramel to-transparent z-10 pointer-events-none" />

      <div className="anim-marquee marquee-track">
        {[...Array(2)].map((_, dup) => (
          <div key={dup} className="flex items-center gap-10 shrink-0">
            {phrases.map((p, i) => (
              <div key={`${dup}-${i}`} className="flex items-center gap-10 shrink-0">
                <span className="font-display font-bold text-2xl lg:text-3xl tracking-tight whitespace-nowrap italic">
                  <span className="font-serif">{p}</span>
                </span>
                <CacaoLeaf className="w-5 h-5 text-cream/70 anim-spin-slow shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
