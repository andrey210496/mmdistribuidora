import Link from "next/link";
import { LayoutGrid } from "lucide-react";

type Category = { id: string; name: string; slug: string };

// Faixa horizontal de categorias — atalho rápido de navegação (estilo marketplace).
export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav className="bg-white border-b border-cocoa/10">
      <div className="container-wide">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          <Link
            href="/produtos"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-espresso text-cream text-sm font-semibold hover:bg-cocoa transition"
          >
            <LayoutGrid size={15} />
            Tudo
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className="shrink-0 px-4 py-2 rounded-full bg-cream text-cocoa text-sm font-medium hover:bg-rose-brand hover:text-white transition whitespace-nowrap"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/produtos?ofertas=1"
            className="shrink-0 px-4 py-2 rounded-full bg-rose-brand/10 text-rose-brand text-sm font-bold hover:bg-rose-brand hover:text-white transition whitespace-nowrap"
          >
            ✦ Ofertas
          </Link>
        </div>
      </div>
    </nav>
  );
}
