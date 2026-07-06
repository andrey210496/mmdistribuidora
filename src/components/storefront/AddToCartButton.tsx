"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Check, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  productId: string;
  outOfStock?: boolean;
  variant?: "card" | "page";
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
      className="mt-2.5 w-full bg-rose-brand hover:bg-redDeep disabled:opacity-50 text-white h-10 rounded-md font-extrabold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 transition"
    >
      {pending ? (
        "..."
      ) : added ? (
        <>
          <Check size={14} strokeWidth={2.5} /> Adicionado
        </>
      ) : (
        <>
          <ShoppingBag size={14} strokeWidth={2.2} /> Adicionar
        </>
      )}
    </button>
  );
}
