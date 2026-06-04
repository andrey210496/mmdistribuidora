import Link from "next/link";

// Categorias temáticas do nicho com imagem circular (estilo stories Instagram)
const circles = [
  {
    label: "Brigadeiro",
    href: "/produtos?categoria=doces-finos",
    image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200&q=80",
    bg: "from-cocoa to-espresso",
  },
  {
    label: "Chocolate",
    href: "/produtos?categoria=chocolates",
    image: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=200&q=80",
    bg: "from-[#3d1c0e] to-cocoa",
  },
  {
    label: "Forminhas",
    href: "/produtos?categoria=embalagens",
    image: "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=200&q=80",
    bg: "from-rose-brand to-[#b06b80]",
  },
  {
    label: "Embalagens",
    href: "/produtos?categoria=embalagens",
    image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=200&q=80",
    bg: "from-olive to-[#6b7340]",
  },
  {
    label: "Mesa de Doces",
    href: "/produtos?categoria=festas",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=200&q=80",
    bg: "from-[#e8a2b6] to-rose-brand",
  },
  {
    label: "Granulado",
    href: "/produtos?q=granulado",
    image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=200&q=80",
    bg: "from-caramel to-[#8a4a1c]",
  },
  {
    label: "Cobertura",
    href: "/produtos?q=cobertura",
    image: "https://images.unsplash.com/photo-1623660053975-e30d6e2403da?w=200&q=80",
    bg: "from-cocoa to-[#2a0d05]",
  },
  {
    label: "Trufas",
    href: "/produtos?q=trufa",
    image: "https://images.unsplash.com/photo-1548907040-4d42bea7ed94?w=200&q=80",
    bg: "from-[#5a2b17] to-[#1a0703]",
  },
  {
    label: "Beijinho",
    href: "/produtos?q=beijinho",
    image: "https://images.unsplash.com/photo-1600715502746-1cb6f54d27ba?w=200&q=80",
    bg: "from-[#f4e6d0] to-cream",
  },
  {
    label: "Pão de Mel",
    href: "/produtos?q=pao+de+mel",
    image: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=200&q=80",
    bg: "from-caramel to-cocoa",
  },
  {
    label: "Cacau",
    href: "/produtos?q=cacau",
    image: "https://images.unsplash.com/photo-1517093602195-b40af9688b46?w=200&q=80",
    bg: "from-[#3d1c0e] to-[#1a0703]",
  },
  {
    label: "Páscoa",
    href: "/produtos?categoria=festas",
    image: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=200&q=80",
    bg: "from-rose-brand to-caramel",
  },
];

export function CategoryCircles() {
  return (
    <section className="py-6 lg:py-8 bg-white border-b border-cocoa/10">
      <div className="container-default">
        <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          {circles.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group flex flex-col items-center gap-2 shrink-0 w-[88px] lg:w-[100px]"
            >
              {/* Anel gradiente estilo stories */}
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-caramel via-gold to-rose-brand group-hover:scale-105 transition-transform">
                <div className="rounded-full p-[2px] bg-white">
                  <div className="w-[68px] h-[68px] lg:w-[78px] lg:h-[78px] rounded-full overflow-hidden bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image}
                      alt={c.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-cocoa group-hover:text-caramel transition text-center leading-tight">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
