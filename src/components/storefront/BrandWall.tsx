import { ShieldCheck } from "lucide-react";

const brands = [
  { name: "Nestlé", color: "#0070C5" },
  { name: "Cacau Show", color: "#A82C2C" },
  { name: "Garoto", color: "#E32E1E" },
  { name: "Harald", color: "#003D6B" },
  { name: "Sicao", color: "#D4A574" },
  { name: "Callebaut", color: "#0F4C2E" },
  { name: "Arcor", color: "#F39200" },
  { name: "Lacta", color: "#2B0067" },
];

export function BrandWall() {
  return (
    <section className="py-10 lg:py-14 bg-cream/40 border-y border-cocoa/10">
      <div className="container-default">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cocoa/70 mb-2">
            <ShieldCheck size={13} className="text-olive" />
            Distribuidor oficial
          </span>
          <h2 className="font-display text-xl lg:text-2xl font-bold text-cocoa">
            Trabalhamos com as <span className="text-caramel">melhores marcas</span> do mercado
          </h2>
        </div>

        {/* Grid de marcas — placeholders estilizados (nomes em fontes premium) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {brands.map((b) => (
            <div
              key={b.name}
              className="bg-white rounded-xl border border-cocoa/10 px-4 py-5 flex items-center justify-center hover:border-caramel/40 hover:shadow-md transition group"
            >
              <span
                className="font-display font-black text-base lg:text-lg tracking-tight transition-all duration-300 group-hover:scale-110"
                style={{ color: b.color }}
              >
                {b.name}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-cocoa/50 mt-6">
          + outras 30 marcas selecionadas no nosso catálogo
        </p>
      </div>
    </section>
  );
}
