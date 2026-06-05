"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type NavItem = { label: string; href: string; active?: boolean };

// Barra de categorias responsiva: mostra quantos itens couberem na largura
// disponível e move o restante para um menu "⋯ Mais" (overflow).
export function CategoryNav({ items }: { items: NavItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const moreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [openMore, setOpenMore] = useState(false);

  // Calcula quantos itens cabem
  useEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const RESERVED = 96; // espaço reservado para o botão "Mais"
      const available = container.offsetWidth;
      let used = 0;
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const el = measureRefs.current[i];
        if (!el) break;
        used += el.offsetWidth;
        if (used > available - RESERVED) break;
        count++;
      }
      setVisibleCount(used <= available ? items.length : Math.max(1, count));
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [items]);

  // Fecha o "Mais" ao clicar fora
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
    `relative px-3.5 py-2 whitespace-nowrap rounded-full text-[13px] font-semibold transition ${
      active ? "text-rose-brand" : "text-cocoa hover:text-rose-brand hover:bg-cocoa/5"
    }`;

  return (
    <div ref={containerRef} className="relative flex items-center h-12 gap-0.5">
      {/* Linha de medição (invisível) — mede a largura real de cada item */}
      <div
        aria-hidden
        className="absolute -z-10 opacity-0 pointer-events-none flex"
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

      {/* Itens visíveis */}
      {visible.map((item) => (
        <Link key={item.label} href={item.href} className={linkClass(item.active)}>
          {item.label}
          {item.active && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-rose-brand rounded-full" />
          )}
        </Link>
      ))}

      {/* Botão "Mais" com overflow */}
      {overflow.length > 0 && (
        <div ref={moreRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpenMore((v) => !v)}
            aria-label="Mais categorias"
            aria-expanded={openMore}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-semibold text-cocoa hover:text-rose-brand hover:bg-cocoa/5 transition"
          >
            <MoreHorizontal size={18} />
          </button>

          {openMore && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-white rounded-xl shadow-xl ring-1 ring-cocoa/10 py-2">
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
