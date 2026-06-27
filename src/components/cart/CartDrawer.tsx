"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { cart, isOpen, close, setQty, removeItem, pending } = useCart();

  // Trava o scroll do body quando a gaveta está aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Fecha com ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const lines = cart?.lines ?? [];
  const isEmpty = lines.length === 0;
  const remainingFree =
    cart && cart.subtotalCents > 0 && cart.subtotalCents < cart.freeShippingThresholdCents
      ? cart.freeShippingThresholdCents - cart.subtotalCents
      : 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[60] bg-espresso/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      {/* Gaveta */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-cream shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Carrinho de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cocoa/10 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-rose-brand" />
            <span className="font-display font-bold text-cocoa text-lg">
              Seu carrinho
            </span>
            {cart && cart.totalItems > 0 && (
              <span className="bg-rose-brand text-white text-xs font-bold rounded-full px-2 py-0.5">
                {cart.totalItems}
              </span>
            )}
          </div>
          <button
            onClick={close}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-cocoa/5 text-cocoa transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
            <ShoppingBag size={48} className="text-cocoa/20" />
            <p className="font-display font-bold text-cocoa text-lg">
              Seu carrinho está vazio
            </p>
            <p className="text-cocoa/60 text-sm">
              Adicione produtos pra continuar.
            </p>
            <button onClick={close} className="btn-pink mt-2">
              Ver produtos
            </button>
          </div>
        ) : (
          <>
            {/* Faixa frete grátis */}
            {remainingFree > 0 ? (
              <div className="bg-rose-brand/10 text-cocoa text-xs px-5 py-2.5 flex items-center gap-2">
                <Truck size={15} className="text-rose-brand shrink-0" />
                Faltam <strong className="text-rose-brand">{centsToBRL(remainingFree)}</strong> pra ganhar frete grátis!
              </div>
            ) : cart && cart.subtotalCents > 0 ? (
              <div className="bg-olive/15 text-cocoa text-xs px-5 py-2.5 flex items-center gap-2">
                <Truck size={15} className="text-olive shrink-0" />
                <strong className="text-olive">Você ganhou frete grátis!</strong>
              </div>
            ) : null}

            {/* Lista de itens */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {lines.map((line) => (
                <div key={line.productId} className="flex gap-3">
                  <Link
                    href={`/produtos/${line.productSlug}`}
                    onClick={close}
                    className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0 border border-cocoa/10"
                  >
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cocoa/20 font-display font-bold">
                        DE
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produtos/${line.productSlug}`}
                      onClick={close}
                      className="text-cocoa text-sm font-medium leading-snug line-clamp-2 hover:text-rose-brand"
                    >
                      {line.productName}
                    </Link>
                    <div className="text-cocoa/60 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {(line.clubPriceApplied || line.wholesalePriceApplied) && (
                        <span className="text-cocoa/40 line-through">
                          {centsToBRL(line.normalUnitPriceCents)}
                        </span>
                      )}
                      <span
                        className={
                          line.clubPriceApplied
                            ? "text-[#8a5a1e] font-semibold"
                            : line.wholesalePriceApplied
                              ? "text-caramel font-semibold"
                              : ""
                        }
                      >
                        {centsToBRL(line.unitPriceCents)} cada
                      </span>
                      {line.wholesalePriceApplied && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-caramel/15 text-caramel">
                          Atacado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantidade */}
                      <div className="flex items-center border border-cocoa/15 rounded-full bg-white">
                        <button
                          onClick={() => setQty(line.productId, line.quantity - 1)}
                          disabled={pending || line.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-cocoa/5 disabled:opacity-30 transition"
                          aria-label="Diminuir"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                        <button
                          onClick={() => setQty(line.productId, line.quantity + 1)}
                          disabled={pending || line.quantity >= line.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-cocoa/5 disabled:opacity-30 transition"
                          aria-label="Aumentar"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-cocoa">
                          {centsToBRL(line.totalCents)}
                        </span>
                        <button
                          onClick={() => removeItem(line.productId)}
                          disabled={pending}
                          className="text-cocoa/40 hover:text-red-600 transition disabled:opacity-30"
                          aria-label="Remover"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com total + CTA */}
            <div className="border-t border-cocoa/10 bg-white px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-cocoa/70">Subtotal</span>
                <span className="font-semibold text-cocoa">
                  {centsToBRL(cart?.subtotalCents ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-cocoa">Total</span>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-cocoa leading-none">
                    {centsToBRL(cart?.totalCents ?? 0)}
                  </div>
                  <div className="text-[11px] text-cocoa/60 mt-0.5">
                    {cart && cart.shippingCents === 0
                      ? "Frete grátis incluso"
                      : `+ frete ${centsToBRL(cart?.shippingCents ?? 0)}${cart?.shippingSource === "stone" ? " · Stone" : ""}`}
                  </div>
                </div>
              </div>

              <Link href="/checkout" onClick={close} className="btn-pink w-full">
                Finalizar compra
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={close}
                className="w-full text-center text-cocoa/60 hover:text-cocoa text-sm py-1"
              >
                Continuar comprando
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-cocoa/55">
                <ShieldCheck size={12} className="text-olive" />
                Compra segura · pagamento via Stripe
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
