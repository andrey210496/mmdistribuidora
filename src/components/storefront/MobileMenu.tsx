"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Search, User, Crown, Phone, ChevronRight } from "lucide-react";
import type { NavItem } from "./CategoryNav";
import { COMPANY } from "@/lib/company";

export function MobileMenu({
  items,
  customerName,
  isMember,
}: {
  items: NavItem[];
  customerName?: string;
  isMember?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-cocoa"
      >
        <Menu size={24} strokeWidth={1.75} />
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[90] bg-espresso/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      {/* Painel */}
      <aside
        className={`fixed top-0 left-0 z-[95] h-full w-[85%] max-w-sm bg-cream shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Menu"
      >
        {/* Topo */}
        <div className="flex items-center justify-between px-5 py-4 bg-espresso text-cream">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-gold">MM Distribuidora</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar" className="p-1.5 text-cream/80 hover:text-cream">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Busca */}
          <form action="/produtos" method="get" className="p-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" />
              <input
                type="search"
                name="q"
                placeholder="O que você procura?"
                maxLength={100}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
              />
            </div>
          </form>

          {/* Conta */}
          <Link
            href={customerName ? "/conta" : "/entrar"}
            onClick={() => setOpen(false)}
            className="mx-4 mb-3 flex items-center gap-3 bg-white rounded-xl px-4 py-3 ring-1 ring-cocoa/10"
          >
            <div className="relative">
              <User size={22} className="text-cocoa" />
              {isMember && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-[#f4d8a8] to-[#a07640] flex items-center justify-center">
                  <Crown size={9} className="text-[#5a2b17]" fill="currentColor" />
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-cocoa text-sm">{customerName ?? "Entrar"}</div>
              <div className="text-[11px] text-cocoa/60">
                {customerName ? (isMember ? "Membro do Clube" : "Minha conta") : "ou cadastrar"}
              </div>
            </div>
            <ChevronRight size={16} className="text-cocoa/40" />
          </Link>

          {/* Clube */}
          <Link
            href="/clube"
            onClick={() => setOpen(false)}
            className="mx-4 mb-4 flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] text-cream"
          >
            <Crown size={20} className="text-gold" fill="currentColor" />
            <div className="flex-1">
              <div className="font-bold text-gold text-sm">Clube MM Distribuidora</div>
              <div className="text-[11px] text-cream/70">Preços exclusivos de membro</div>
            </div>
            <ChevronRight size={16} className="text-cream/50" />
          </Link>

          {/* Categorias */}
          <div className="px-4 pb-4">
            <div className="text-[11px] uppercase tracking-widest text-cocoa/45 font-bold px-1 mb-1">
              Navegar
            </div>
            <div className="bg-white rounded-xl ring-1 ring-cocoa/10 overflow-hidden divide-y divide-cocoa/8">
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium text-cocoa hover:bg-cream transition"
                >
                  {item.label}
                  <ChevronRight size={15} className="text-cocoa/30" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <a
          href={`https://wa.me/${COMPANY.whatsapp}`}
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 text-sm"
        >
          <Phone size={16} /> Falar no WhatsApp
        </a>
      </aside>
    </>
  );
}
