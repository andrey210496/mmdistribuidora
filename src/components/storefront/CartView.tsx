"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import {
  updateCartQuantity,
  removeFromCart,
  setCartZip,
} from "@/app/actions/cart";
import type { CartSummary } from "@/lib/cart";

export function CartView({ cart }: { cart: CartSummary }) {
  const [pending, startTransition] = useTransition();
  const [zip, setZip] = useState(cart.shippingZip ?? "");

  const updateQty = (productId: string, q: number) => {
    startTransition(async () => {
      await updateCartQuantity(productId, q);
    });
  };

  const remove = (productId: string) => {
    startTransition(async () => {
      await removeFromCart(productId);
    });
  };

  const applyZip = () => {
    startTransition(async () => {
      await setCartZip(zip);
    });
  };

  const remainingForFreeShipping =
    cart.subtotalCents > 0 && cart.subtotalCents < cart.freeShippingThresholdCents
      ? cart.freeShippingThresholdCents - cart.subtotalCents
      : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      {/* Itens */}
      <div>
        {/* Faixa de incentivo de frete grátis */}
        {remainingForFreeShipping > 0 ? (
          <div className="bg-rose-brand/10 border border-rose-brand/30 rounded-xl px-4 py-3 mb-4 text-sm text-cocoa flex items-center gap-3">
            <Truck size={18} className="text-rose-brand shrink-0" />
            <span>
              Faltam <strong className="text-rose-brand">{centsToBRL(remainingForFreeShipping)}</strong> para você ganhar <strong>frete grátis</strong>!
            </span>
          </div>
        ) : cart.subtotalCents > 0 ? (
          <div className="bg-olive/15 border border-olive/40 rounded-xl px-4 py-3 mb-4 text-sm text-cocoa flex items-center gap-3">
            <Truck size={18} className="text-olive shrink-0" />
            <span>
              <strong className="text-olive">Você ganhou frete grátis!</strong> Despachamos em 24h pra todo Vale do Paraíba.
            </span>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_40px] gap-4 px-6 py-3 border-b border-cocoa/10 text-[11px] uppercase tracking-widest text-cocoa/60 font-bold">
            <span>Produto</span>
            <span className="text-center">Quantidade</span>
            <span className="text-right">Total</span>
            <span></span>
          </div>

          {cart.lines.map((line) => (
            <div
              key={line.productId}
              className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_40px] gap-4 items-center px-6 py-5 border-b border-cocoa/10 last:border-b-0"
            >
              {/* Produto */}
              <div className="flex gap-4 items-center min-w-0">
                <Link
                  href={`/produtos/${line.productSlug}`}
                  className="w-20 h-20 rounded-xl bg-cream overflow-hidden shrink-0 border border-cocoa/10"
                >
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cocoa/20 font-display font-bold">DE</div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/produtos/${line.productSlug}`}
                    className="text-cocoa font-medium text-sm hover:text-rose-brand line-clamp-2"
                  >
                    {line.productName}
                  </Link>
                  <div className="text-cocoa/60 text-xs mt-1">
                    Unidade: {centsToBRL(line.unitPriceCents)}
                  </div>
                  {line.quantity >= line.stock && (
                    <div className="text-orange-600 text-xs mt-1">
                      Quantidade máxima em estoque
                    </div>
                  )}
                </div>
              </div>

              {/* Quantidade */}
              <div className="flex items-center justify-center md:justify-center">
                <div className="flex items-center border border-cocoa/15 rounded-full">
                  <button
                    type="button"
                    onClick={() => updateQty(line.productId, line.quantity - 1)}
                    disabled={pending || line.quantity <= 1}
                    className="w-9 h-9 hover:bg-cocoa/5 disabled:opacity-30 transition flex items-center justify-center"
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center font-bold text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.productId, line.quantity + 1)}
                    disabled={pending || line.quantity >= line.stock}
                    className="w-9 h-9 hover:bg-cocoa/5 disabled:opacity-30 transition flex items-center justify-center"
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <div className="font-display font-bold text-cocoa text-lg">
                  {centsToBRL(line.totalCents)}
                </div>
              </div>

              {/* Remover */}
              <button
                onClick={() => remove(line.productId)}
                disabled={pending}
                className="text-cocoa/50 hover:text-red-600 disabled:opacity-30 transition justify-self-end"
                aria-label="Remover item"
              >
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center flex-wrap gap-3">
          <Link href="/produtos" className="text-cocoa hover:text-rose-brand text-sm font-semibold inline-flex items-center gap-1.5">
            ← Continuar comprando
          </Link>
        </div>
      </div>

      {/* Resumo */}
      <aside className="lg:sticky lg:top-44 lg:self-start">
        <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-cocoa/10">
            <h2 className="font-display text-xl font-bold text-cocoa">Resumo</h2>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* CEP */}
            <div>
              <label htmlFor="zip" className="text-xs uppercase tracking-widest text-cocoa/60 font-bold mb-2 block">
                Calcular frete
              </label>
              <div className="flex gap-2">
                <input
                  id="zip"
                  type="text"
                  value={zip}
                  onChange={(e) =>
                    setZip(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="00000-000"
                  className="flex-1 px-3 py-2 rounded-full border border-cocoa/15 text-cocoa text-sm focus:outline-none focus:border-rose-brand"
                  maxLength={9}
                />
                <button
                  onClick={applyZip}
                  disabled={pending || zip.length !== 8}
                  className="bg-cocoa hover:bg-espresso disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 rounded-full transition"
                >
                  OK
                </button>
              </div>
            </div>

            <div className="border-t border-cocoa/10 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-cocoa/70">Subtotal ({cart.totalItems} {cart.totalItems > 1 ? "itens" : "item"})</span>
                <span className="text-cocoa font-semibold">{centsToBRL(cart.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa/70">Frete</span>
                <span className={`font-semibold ${cart.shippingCents === 0 ? "text-olive" : "text-cocoa"}`}>
                  {cart.shippingCents === 0 && cart.subtotalCents > 0
                    ? "Grátis"
                    : centsToBRL(cart.shippingCents)}
                </span>
              </div>
            </div>

            <div className="border-t border-cocoa/10 pt-4 flex justify-between items-baseline">
              <span className="text-cocoa font-bold">Total</span>
              <div className="text-right">
                <div className="font-display text-2xl font-bold text-cocoa leading-none">
                  {centsToBRL(cart.totalCents)}
                </div>
                <div className="text-[11px] text-olive font-bold mt-1">
                  ou {centsToBRL(Math.round(cart.totalCents * 0.95))} no PIX (5% off)
                </div>
                <div className="text-[11px] text-cocoa/60">
                  6x de {centsToBRL(Math.round(cart.totalCents / 6))} sem juros
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn-pink w-full mt-2"
            >
              Finalizar compra
              <ArrowRight size={16} />
            </Link>

            <div className="flex items-center gap-2 text-xs text-cocoa/60 justify-center pt-2">
              <ShieldCheck size={13} className="text-olive" />
              <span>Compra 100% segura · Pagamento Asaas</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
