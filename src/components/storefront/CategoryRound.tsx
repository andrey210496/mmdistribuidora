import Link from "next/link";
import {
  Package,
  Cake,
  Cookie,
  Coffee,
  UtensilsCrossed,
  ShoppingCart,
  Tag,
} from "lucide-react";

const cats = [
  { label: "Embalagens", href: "/produtos?categoria=embalagens", color: "bg-rose-brand", Icon: Package },
  { label: "Insumos para Confeitaria", href: "/produtos?categoria=confeitaria", color: "bg-caramel", Icon: Cake },
  { label: "Confeitaria e Decoração", href: "/produtos?categoria=doces-finos", color: "bg-olive", Icon: Cookie },
  { label: "Descartáveis", href: "/produtos?categoria=embalagens", color: "bg-[#d4a574]", Icon: Coffee },
  { label: "Food Service", href: "/produtos?categoria=festas", color: "bg-[#c97d92]", Icon: UtensilsCrossed },
  { label: "Limpeza e Utilidades", href: "/produtos?q=limpeza", color: "bg-[#7d8550]", Icon: ShoppingCart },
  { label: "Promoções", href: "/produtos?ofertas=1", color: "bg-[#e8a2b6]", Icon: Tag },
];

export function CategoryRound() {
  return (
    <section className="pt-10 lg:pt-12 pb-4 bg-cream">
      <div className="container-wide">
        <div className="text-center mb-7">
          <span className="eyebrow text-cocoa/60">Navegue por categoria</span>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-cocoa mt-2">
            O que você procura hoje?
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-4">
          {cats.map(({ label, href, color, Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center text-center gap-3"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl ${color} flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:-translate-y-1 group-hover:rotate-[-4deg] transition-all duration-300`}
              >
                <Icon size={32} className="text-white" strokeWidth={1.7} />
              </div>
              <span className="text-[12px] lg:text-[13px] font-bold text-cocoa group-hover:text-rose-brand transition leading-tight max-w-[110px]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
