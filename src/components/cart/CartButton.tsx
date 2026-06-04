"use client";

import { ShoppingBag } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { cart, open } = useCart();
  const count = cart?.totalItems ?? 0;
  const total = cart?.subtotalCents ?? 0;

  return (
    <button
      onClick={open}
      className="flex items-center gap-2.5 hover:text-rose-brand transition group relative"
      aria-label="Abrir carrinho"
    >
      <div className="relative">
        <ShoppingBag size={26} strokeWidth={1.5} className="text-cocoa" />
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-brand text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      </div>
      <div className="hidden lg:block text-cocoa text-left">
        <div className="text-[10px] uppercase tracking-widest text-cocoa/60">Carrinho</div>
        <div className="font-bold text-[13px]">{centsToBRL(total)}</div>
      </div>
    </button>
  );
}
