"use client";

import { useState, useTransition, useOptimistic } from "react";
import {
  Check,
  Package,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  togglePickedItem,
  finalizeSeparation,
} from "@/app/admin/pedidos/actions";

type Item = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  picked: boolean;
  imageUrl: string | null;
};

type Props = {
  orderId: string;
  orderNumber: string;
  pickToken: string;
  status: string;
  customerName: string;
  shippingCity: string;
  shippingState: string;
  items: Item[];
};

export function PickingScreen({
  orderNumber,
  pickToken,
  status,
  customerName,
  shippingCity,
  shippingState,
  items: initialItems,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (state: Item[], next: { itemId: string; picked: boolean }) =>
      state.map((i) => (i.id === next.itemId ? { ...i, picked: next.picked } : i))
  );
  const [error, setError] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(false);

  const total = optimisticItems.length;
  const picked = optimisticItems.filter((i) => i.picked).length;
  const allPicked = picked === total && total > 0;
  const isFinalized = status === "READY_TO_SHIP" || status === "SHIPPED" || status === "DELIVERED" || finalized;

  const toggle = (item: Item) => {
    if (isFinalized) return;
    const newValue = !item.picked;
    startTransition(async () => {
      applyOptimistic({ itemId: item.id, picked: newValue });
      const r = await togglePickedItem(pickToken, item.id, newValue);
      if (!r.ok) {
        setError(r.error ?? "Erro ao atualizar");
      } else {
        setError(null);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, picked: newValue } : i))
        );
      }
    });
  };

  const handleFinalize = () => {
    setError(null);
    startTransition(async () => {
      const r = await finalizeSeparation(pickToken);
      if (!r.ok) {
        setError(r.error ?? "Erro ao finalizar");
      } else {
        setFinalized(true);
      }
    });
  };

  const progress = total === 0 ? 0 : Math.round((picked / total) * 100);

  return (
    <div className="min-h-screen bg-cream/30 pb-32">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-white border-b border-cocoa/10 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-cocoa/55 font-bold">
                Separação
              </div>
              <div className="font-display font-bold text-cocoa text-lg truncate">
                {orderNumber}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display font-bold text-rose-brand text-lg">
                {picked}<span className="text-cocoa/40 text-base">/{total}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-cocoa/55">
                {progress}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-cocoa/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                allPicked ? "bg-olive" : "bg-rose-brand"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto">
        {/* Info do cliente */}
        <div className="bg-white rounded-xl p-3 mb-4 border border-cocoa/10 text-sm">
          <div className="flex items-center gap-2 text-cocoa/60 text-xs">
            <Package size={13} className="text-rose-brand" />
            Cliente
          </div>
          <div className="font-bold text-cocoa">{customerName}</div>
          <div className="flex items-center gap-1.5 text-xs text-cocoa/65 mt-0.5">
            <MapPin size={11} />
            {shippingCity}/{shippingState}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Pedido finalizado */}
        {isFinalized && (
          <div className="bg-olive/15 border border-olive/40 rounded-xl p-5 text-center mb-4">
            <CheckCircle2 size={36} className="text-olive mx-auto mb-2" />
            <div className="font-display font-bold text-olive text-lg">
              Separação concluída!
            </div>
            <div className="text-cocoa/70 text-sm mt-1">
              Este pedido já foi separado e está pronto pra envio.
            </div>
          </div>
        )}

        {/* Lista de itens */}
        <div className="space-y-2.5">
          {optimisticItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => toggle(item)}
              disabled={isFinalized || pending}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                item.picked
                  ? "bg-olive/10 border-olive/40"
                  : "bg-white border-cocoa/10 active:border-rose-brand active:bg-rose-brand/5"
              } ${isFinalized ? "cursor-default" : "cursor-pointer"}`}
            >
              {/* Número */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                  item.picked
                    ? "bg-olive text-white"
                    : "bg-cocoa/10 text-cocoa/60"
                }`}
              >
                {item.picked ? <Check size={16} strokeWidth={3} /> : i + 1}
              </div>

              {/* Imagem */}
              <div className="w-14 h-14 rounded-lg bg-cream overflow-hidden shrink-0 border border-cocoa/10">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cocoa/20 font-display font-bold text-xs">
                    DE
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm leading-snug line-clamp-2 ${item.picked ? "text-olive line-through opacity-70" : "text-cocoa"}`}>
                  {item.name}
                </div>
                <div className="text-[10px] text-cocoa/55 font-mono mt-0.5">
                  {item.sku}
                </div>
              </div>

              {/* Quantidade */}
              <div className="text-right shrink-0">
                <div className="font-display font-bold text-2xl text-cocoa leading-none">
                  {item.quantity}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-cocoa/55">
                  unidades
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* CTA fixo embaixo */}
      {!isFinalized && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cocoa/10 p-4 z-30">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleFinalize}
              disabled={!allPicked || pending}
              className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm uppercase tracking-wider transition shadow-lg ${
                allPicked
                  ? "bg-olive hover:bg-[#7d8550] text-white"
                  : "bg-cocoa/10 text-cocoa/40 cursor-not-allowed"
              }`}
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processando...
                </>
              ) : allPicked ? (
                <>
                  <CheckCircle2 size={16} />
                  Finalizar separação
                  <ArrowRight size={16} />
                </>
              ) : (
                <>Marque todos os itens ({total - picked} restantes)</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
