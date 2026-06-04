"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Check, Plus, Minus } from "lucide-react";
import { addToCart } from "@/app/actions/cart";

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
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(initialQuantity);
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    startTransition(async () => {
      const res = await addToCart(productId, qty);
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
            : "mt-3 w-full bg-cocoa/10 text-cocoa/40 py-2.5 rounded-full font-bold text-[12px] uppercase tracking-wider cursor-not-allowed"
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
      className="mt-3 w-full bg-rose-brand hover:bg-[#c97d92] disabled:opacity-50 text-white py-2.5 rounded-full font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md"
    >
      {pending ? (
        "..."
      ) : added ? (
        <>
          <Check size={13} strokeWidth={2.5} /> Adicionado
        </>
      ) : (
        <>
          <ShoppingBag size={13} strokeWidth={2.2} /> Comprar
        </>
      )}
    </button>
  );
}
