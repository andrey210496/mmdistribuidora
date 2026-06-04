"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import type { CartSummary } from "@/lib/cart";
import {
  getCartSummary,
  addToCart as addToCartAction,
  updateCartQuantity,
  removeFromCart as removeFromCartAction,
} from "@/app/actions/cart";

type CartContextValue = {
  cart: CartSummary | null;
  isOpen: boolean;
  pending: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  /** Adiciona item, atualiza o carrinho e abre a gaveta */
  addItem: (productId: string, qty?: number) => Promise<{ ok: boolean; error?: string }>;
  setQty: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const data = await getCartSummary();
      setCart(data);
    } catch {
      /* silencioso — mantém estado anterior */
    }
  }, []);

  // Carrega o carrinho no primeiro render
  useEffect(() => {
    refresh();
  }, [refresh]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    async (productId: string, qty = 1) => {
      const res = await addToCartAction(productId, qty);
      if (res.ok) {
        await refresh();
        setIsOpen(true);
      }
      return res;
    },
    [refresh]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      return new Promise<void>((resolve) => {
        startTransition(async () => {
          await updateCartQuantity(productId, qty);
          await refresh();
          resolve();
        });
      });
    },
    [refresh]
  );

  const removeItem = useCallback(
    (productId: string) => {
      return new Promise<void>((resolve) => {
        startTransition(async () => {
          await removeFromCartAction(productId);
          await refresh();
          resolve();
        });
      });
    },
    [refresh]
  );

  return (
    <CartContext.Provider
      value={{ cart, isOpen, pending, open, close, refresh, addItem, setQty, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}
