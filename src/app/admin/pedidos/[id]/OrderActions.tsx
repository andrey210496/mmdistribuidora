"use client";

import { useState, useTransition } from "react";
import { ArrowRight, X, FileText, Check, AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import {
  advanceOrderStatus,
  cancelOrder,
  issueNf,
  refundOrder,
  getRefundSuggestion,
  syncOrderWithStripe,
  type RefundSuggestion,
} from "../actions";
import { ORDER_STATUS_META, nextStatusOf, canCancel } from "@/lib/orders";
import { centsToBRL, brlToCents } from "@/lib/money";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

// Formata centavos para o input editável (ex.: 2447 -> "24,47").
const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

type Props = {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  nfIssuedAt: Date | null;
  nfNumber: string | null;
  hasStripePayment: boolean;
};

export function OrderActions({
  orderId,
  status,
  paymentStatus,
  nfIssuedAt,
  hasStripePayment,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<RefundSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const next = nextStatusOf(status);
  const canCancelNow = canCancel(status);
  const isPaid = paymentStatus === "CONFIRMED";

  const handleSync = () => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await syncOrderWithStripe(orderId);
      if (!r.ok) setError(r.error ?? "Erro ao sincronizar");
      else setInfo(r.message ?? "Sincronizado com o Stripe.");
    });
  };

  const handleAdvance = () => {
    setError(null);
    startTransition(async () => {
      const r = await advanceOrderStatus(orderId);
      if (!r.ok) setError(r.error ?? "Erro ao avançar");
    });
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      setError("Informe o motivo do cancelamento");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await cancelOrder(orderId, cancelReason.trim());
      if (!r.ok) setError(r.error ?? "Erro ao cancelar");
      else setCancelOpen(false);
    });
  };

  const handleIssueNf = () => {
    setError(null);
    startTransition(async () => {
      const r = await issueNf({ orderId });
      if (!r.ok) setError(r.error ?? "Erro ao emitir NF");
    });
  };

  const openRefund = () => {
    if (refundOpen) {
      setRefundOpen(false);
      return;
    }
    setError(null);
    setRefundOpen(true);
    setLoadingSuggestion(true);
    startTransition(async () => {
      const s = await getRefundSuggestion(orderId);
      setSuggestion(s);
      // Pré-preenche com o líquido sugerido (total − taxa), sem prejuízo.
      if (s) setRefundAmount(centsToInput(s.suggestedNetCents));
      setLoadingSuggestion(false);
    });
  };

  const handleRefund = () => {
    setError(null);
    let amountCents: number;
    try {
      amountCents = brlToCents(refundAmount);
    } catch {
      setError("Valor de estorno inválido");
      return;
    }
    if (amountCents <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (suggestion && amountCents > suggestion.paidCents) {
      setError("O valor não pode ser maior que o total pago.");
      return;
    }
    startTransition(async () => {
      const r = await refundOrder(orderId, amountCents);
      if (!r.ok) setError(r.error ?? "Erro ao estornar");
      else setRefundOpen(false);
    });
  };

  const meta = ORDER_STATUS_META[status];
  const nextMeta = next ? ORDER_STATUS_META[next] : null;

  return (
    <section className="bg-white rounded-2xl border border-cocoa/10 p-5">
      <div className={`rounded-xl border ${meta.bg} p-4 mb-4`}>
        <div className="flex items-start gap-3">
          <div className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
            Status atual: {meta.label}
          </div>
        </div>
        <div className="text-xs text-cocoa/70 mt-1">{meta.description}</div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {info && (
        <div className="bg-olive/10 border border-olive/30 text-olive rounded-lg p-3 text-sm mb-4 flex items-start gap-2">
          <Check size={15} className="shrink-0 mt-0.5" />
          {info}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {next && isPaid && (
          <button
            onClick={handleAdvance}
            disabled={pending}
            className="btn-pink"
          >
            <ArrowRight size={14} />
            Avançar para {nextMeta?.label}
          </button>
        )}

        {next && !isPaid && status === "PENDING_PAYMENT" && (
          <div className="text-sm text-cocoa/65 italic">
            Aguardando confirmação de pagamento para liberar avanço.
          </div>
        )}

        {!nfIssuedAt && isPaid && (
          <button
            onClick={handleIssueNf}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-cocoa hover:bg-espresso text-cream font-bold text-[12px] uppercase tracking-wider transition disabled:opacity-50"
          >
            <FileText size={14} />
            Emitir NF
          </button>
        )}

        {nfIssuedAt && (
          <span className="inline-flex items-center gap-1.5 text-olive font-bold text-sm">
            <Check size={14} />
            NF emitida
          </span>
        )}

        {isPaid && (
          <button
            onClick={openRefund}
            disabled={pending}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 font-bold text-xs uppercase tracking-wider"
          >
            <RotateCcw size={14} />
            Estornar pagamento
          </button>
        )}

        {hasStripePayment && (
          <button
            onClick={handleSync}
            disabled={pending}
            title="Conferir o status real no Stripe e atualizar o sistema"
            className="inline-flex items-center gap-2 text-cocoa/70 hover:text-cocoa font-bold text-xs uppercase tracking-wider"
          >
            <RefreshCw size={14} />
            Sincronizar com Stripe
          </button>
        )}

        {canCancelNow && (
          <button
            onClick={() => setCancelOpen(!cancelOpen)}
            disabled={pending}
            className="ml-auto inline-flex items-center gap-2 text-red-600 hover:text-red-800 font-bold text-xs uppercase tracking-wider"
          >
            <X size={14} />
            Cancelar pedido
          </button>
        )}
      </div>

      {refundOpen && (
        <div className="mt-4 pt-4 border-t border-cocoa/10">
          {loadingSuggestion ? (
            <div className="text-sm text-cocoa/60">Calculando valores…</div>
          ) : (
            <>
              <div className="text-sm text-cocoa mb-3">
                <strong>Estornar este pagamento.</strong> O valor é devolvido ao
                cliente pelo Stripe, o pedido fica como <strong>Estornado</strong>,
                o estoque retorna e a receita é revertida no financeiro. Esta ação
                não pode ser desfeita.
              </div>

              {suggestion && (
                <div className="rounded-xl bg-cream/60 border border-cocoa/10 p-3 mb-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-cocoa/70">Total pago</span>
                    <span className="font-semibold text-cocoa">{centsToBRL(suggestion.paidCents)}</span>
                  </div>
                  {suggestion.hasStripe && (
                    <div className="flex justify-between">
                      <span className="text-cocoa/70">Taxa do Stripe (não devolvida)</span>
                      <span className="font-semibold text-caramel">− {centsToBRL(suggestion.feeCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-cocoa/15 pt-1.5 mt-1.5">
                    <span className="font-bold text-cocoa">Líquido (sem prejuízo)</span>
                    <span className="font-display font-bold text-olive">{centsToBRL(suggestion.suggestedNetCents)}</span>
                  </div>
                </div>
              )}

              {suggestion && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setRefundAmount(centsToInput(suggestion.suggestedNetCents))}
                    className="px-3 py-1.5 rounded-full border border-olive/40 text-olive text-xs font-bold hover:bg-olive/10 transition"
                  >
                    Líquido — {centsToBRL(suggestion.suggestedNetCents)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundAmount(centsToInput(suggestion.paidCents))}
                    className="px-3 py-1.5 rounded-full border border-cocoa/20 text-cocoa/70 text-xs font-bold hover:bg-cocoa/5 transition"
                  >
                    Total — {centsToBRL(suggestion.paidCents)}
                  </button>
                </div>
              )}

              <label className="text-xs font-bold uppercase tracking-wider text-cocoa/70 block mb-1.5">
                Valor a estornar
              </label>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cocoa/60 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-40 px-3 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
                  placeholder="0,00"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={pending}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {pending ? "Estornando…" : "Confirmar estorno"}
                </button>
                <button
                  onClick={() => setRefundOpen(false)}
                  className="text-cocoa/60 hover:text-cocoa text-xs px-3"
                >
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cancelOpen && (
        <div className="mt-4 pt-4 border-t border-cocoa/10">
          <label className="text-xs font-bold uppercase tracking-wider text-cocoa/70 block mb-2">
            Motivo do cancelamento
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
            placeholder="Ex: cliente solicitou, produto sem estoque..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCancel}
              disabled={pending}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition"
            >
              Confirmar cancelamento
            </button>
            <button
              onClick={() => {
                setCancelOpen(false);
                setCancelReason("");
              }}
              className="text-cocoa/60 hover:text-cocoa text-xs px-3"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
