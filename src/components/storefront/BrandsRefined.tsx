// Wordmarks sóbrios — sem cores berrantes
const brands = [
  "Nestlé",
  "Cacau Show",
  "Garoto",
  "Harald",
  "Sicao",
  "Callebaut",
  "Arcor",
  "Lacta",
];

export function BrandsRefined() {
  return (
    <section className="py-16 lg:py-20 bg-cream border-y border-cocoa/10">
      <div className="container-wide">
        <div className="text-center mb-10">
          <span className="eyebrow text-cocoa/60 mb-3">Distribuidor oficial</span>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-espresso mt-3 max-w-2xl mx-auto">
            As marcas que <span className="font-serif italic font-medium text-caramel">você confia</span>, no preço da distribuidora.
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-12 lg:gap-x-16 gap-y-6">
          {brands.map((brand) => (
            <span
              key={brand}
              className="font-display text-xl lg:text-2xl font-bold text-espresso/40 hover:text-espresso transition tracking-tight"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
