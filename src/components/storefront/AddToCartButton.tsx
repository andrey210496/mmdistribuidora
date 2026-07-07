"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Check, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  productId: string;
  outOfStock?: boolean;
  variant?: "card" | "page" | "mini";
  initialQuantity?: number;
};

export function AddToCartButton({
  productId,
  outOfStock,
  variant = "card",
  initialQuantity = 1,
}: Props) {
  const { addItem } = useCart();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(initialQuantity);
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    startTransition(async () => {
      // addItem adiciona, atualiza o carrinho e ABRE a gaveta lateral
      const res = await addItem(productId, qty);
      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
      } else {
        setError(res.error ?? "Erro ao adicionar");
      }
    });
  };

  if (outOfStock) {
    if (variant === "mini") {
      return (
        <span className="w-10 h-10 rounded-full bg-white/80 text-ink/30 flex items-center justify-center shadow-md cursor-not-allowed" aria-label="Esgotado">
          <Plus size={18} />
        </span>
      );
    }
    return (
      <button
        disabled
        className={
          variant === "page"
            ? "btn-pink w-full opacity-50 cursor-not-allowed"
            : "mt-2.5 w-full bg-smoke text-ink/40 h-10 rounded-md font-bold text-[12px] uppercase tracking-wider cursor-not-allowed"
        }
      >
        Esgotado
      </button>
    );
  }

  // Circulo "+" (usado sobreposto na imagem do card)
  if (variant === "mini") {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handle(); }}
        disabled={pending}
        aria-label="Adicionar ao carrinho"
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-60 ${
          added ? "bg-olive text-white" : "bg-rose-brand hover:bg-redDeep text-white"
        }`}
      >
        {added ? <Check size={18} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
      </button>
    );
  }

  if (variant === "page") {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="flex gap-3">
          {/* Seletor de quantidade */}
          <div className="flex items-center border border-cocoa/15 rounded-full overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-12 h-12 hover:bg-cocoa/5 transition flex items-center justify-center"
              aria-label="Diminuir"
            >
              <Minus size={16} />
            </button>
            <span className="w-12 text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="w-12 h-12 hover:bg-cocoa/5 transition flex items-center justify-center"
              aria-label="Aumentar"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={handle}
            disabled={pending}
            className="btn-pink flex-1"
          >
            {pending ? (
              "Adicionando..."
            ) : added ? (
              <>
                <Check size={16} strokeWidth={2.5} /> Adicionado!
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Adicionar ao carrinho
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handle();
      }}
      disabled={pending}
      className={`mt-3 w-full h-11 border text-[12px] font-semibold uppercase tracking-[0.09em] flex items-center justify-center gap-2 transition disabled:opacity-50 ${
        added ? "bg-olive border-olive text-white" : "border-ink text-ink hover:bg-ink hover:text-paper"
      }`}
    >
      {pending ? (
        "..."
      ) : added ? (
        <>
          <Check size={14} strokeWidth={2.5} /> Adicionado
        </>
      ) : (
        <>
          <ShoppingBag size={14} strokeWidth={2} /> Adicionar
        </>
      )}
    </button>
  );
}
