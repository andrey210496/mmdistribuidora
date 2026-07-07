"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type NavItem = { label: string; href: string; active?: boolean };

// Barra de categorias responsiva: mostra quantos itens couberem na largura
// disponível e move o restante para um menu "⋯ Mais" (overflow).
// Nunca causa scroll horizontal da página — as linhas são clipadas.
export function CategoryNav({ items, dark = false }: { items: NavItem[]; dark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const moreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [openMore, setOpenMore] = useState(false);

  useEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const available = container.offsetWidth;

      // Tudo cabe sem precisar do botão "Mais"?
      const total = items.reduce(
        (sum, _, i) => sum + (measureRefs.current[i]?.offsetWidth ?? 0),
        0
      );
      if (total <= available) {
        setVisibleCount(items.length);
        return;
      }

      // Não cabe tudo: reserva espaço pro botão "Mais" e conta quantos cabem
      const RESERVED = 56;
      let used = 0;
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const w = measureRefs.current[i]?.offsetWidth ?? 0;
        if (used + w > available - RESERVED) break;
        used += w;
        count++;
      }
      setVisibleCount(Math.max(1, count));
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items]);

  useEffect(() => {
    if (!openMore) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setOpenMore(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMore]);

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  const linkClass = (active?: boolean) =>
    `relative shrink-0 px-3.5 py-3 whitespace-nowrap text-[13.5px] tracking-wide transition ${
      dark
        ? active
          ? "text-gold font-extrabold uppercase"
          : "text-white/85 hover:text-white hover:bg-white/10 font-extrabold uppercase"
        : active
          ? "text-ink font-semibold"
          : "text-clay hover:text-wine font-medium"
    }`;

  return (
    <div ref={containerRef} className="relative flex items-center h-12 min-w-0 w-full">
      {/* Linha de medição — clipada (h-0/overflow-hidden) para nunca gerar scroll */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0 overflow-hidden opacity-0 pointer-events-none flex whitespace-nowrap"
      >
        {items.map((item, i) => (
          <span
            key={item.label}
            ref={(el) => {
              measureRefs.current[i] = el;
            }}
            className={linkClass(item.active)}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Itens visíveis — clipados para nunca vazar a largura */}
      <div className="flex items-center gap-0.5 overflow-hidden flex-1 min-w-0">
        {visible.map((item) => (
          <Link key={item.label} href={item.href} className={linkClass(item.active)}>
            {item.label}
            {item.active && (
              <span className={`absolute left-1/2 -translate-x-1/2 bottom-1 h-0.5 w-5 ${dark ? "bg-gold" : "bg-wine"}`} />
            )}
          </Link>
        ))}
      </div>

      {/* Botão "Mais" + dropdown (fora da área clipada) */}
      {overflow.length > 0 && (
        <div ref={moreRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpenMore((v) => !v)}
            aria-label="Mais categorias"
            aria-expanded={openMore}
            className={`flex items-center px-3 py-3 transition ${dark ? "text-white/85 hover:text-white hover:bg-white/10" : "text-cocoa hover:text-rose-brand hover:bg-cocoa/5"}`}
          >
            <MoreHorizontal size={18} />
          </button>

          {openMore && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-xl ring-1 ring-cocoa/10 py-2">
              {overflow.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpenMore(false)}
                  className={`block px-4 py-2.5 text-sm font-medium transition ${
                    item.active
                      ? "text-rose-brand bg-rose-brand/5"
                      : "text-cocoa hover:bg-cream hover:text-rose-brand"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
