"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import {
  Search, Plus, Minus, Trash2, X, User, ShoppingCart, Banknote,
  Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Printer, Check, CreditCard,
} from "lucide-react";
import { centsToBRL, brlToCents } from "@/lib/money";
import { resolveUnitPrice } from "@/lib/pricing";
import { computePaymentBreakdown, type PaymentInput } from "@/lib/pos";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";
import type { CashReconciliation } from "@/lib/cash";
import {
  searchProducts, searchCustomers, quickCreateCustomer, finalizeSale,
  openCashSession, closeCashSession, addCashMovement,
  type PdvProduct, type PdvCustomer,
} from "./actions";

type Movement = { id: string; type: string; amountCents: number; reason: string | null; createdAt: string };
type Session = { id: string; openingFloatCents: number; openedAt: string; movements: Movement[] };

type CartLine = { product: PdvProduct; qty: number };

const PAY_METHODS = ["CASH", "PIX", "DEBIT_CARD", "CREDIT_CARD"] as const;
type PayKey = (typeof PAY_METHODS)[number];

function safeCents(brl: string): number {
  if (!brl.trim()) return 0;
  try {
    return brlToCents(brl);
  } catch {
    return 0;
  }
}

export function PdvClient({
  storeName,
  session,
  recon,
}: {
  storeName: string;
  session: Session | null;
  recon: CashReconciliation | null;
}) {
  if (!session) return <OpenCashForm />;
  return <Pos storeName={storeName} session={session} recon={recon!} />;
}

// ============================================================
// Abertura de caixa
// ============================================================
function OpenCashForm() {
  const [pending, start] = useTransition();
  const [float, setFloat] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    start(async () => {
      const r = await openCashSession(float);
      if (!r.ok) setError(r.error ?? "Erro ao abrir caixa");
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-md">
      <h1 className="font-display text-3xl font-bold text-cocoa mb-1">PDV / Caixa</h1>
      <p className="text-cocoa/60 text-sm mb-6">O caixa está fechado. Abra para começar a vender.</p>
      <div className="bg-white rounded-2xl border border-cocoa/10 p-6">
        <label className="label">Fundo de troco (abertura)</label>
        <div className="flex mt-1">
          <span className="px-3 py-3 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/70 text-sm font-bold">R$</span>
          <input
            value={float}
            onChange={(e) => setFloat(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="input-field rounded-l-none"
            autoFocus
          />
        </div>
        <button
          onClick={open}
          disabled={pending}
          className="mt-4 w-full bg-olive hover:bg-[#6b7d3a] text-white px-4 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          <Unlock size={16} /> {pending ? "Abrindo…" : "Abrir caixa"}
        </button>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}

// ============================================================
// PDV em operação
// ============================================================
function Pos({ storeName, session, recon }: { storeName: string; session: Session; recon: CashReconciliation }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Busca de produtos
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PdvProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Carrinho
  const [cart, setCart] = useState<CartLine[]>([]);

  // Cliente
  const [customer, setCustomer] = useState<PdvCustomer | null>(null);

  // Pagamento
  const [pay, setPay] = useState<Record<PayKey, string>>({ CASH: "", PIX: "", DEBIT_CARD: "", CREDIT_CARD: "" });

  // Cupom
  const [receipt, setReceipt] = useState<null | {
    orderNumber: string;
    items: CartLine[];
    totalCents: number;
    changeCents: number;
    onCredit: boolean;
    customerName: string;
  }>(null);

  // --- busca com debounce ---
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchProducts(q);
        setResults(r);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const addToCart = (p: PdvProduct) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i]!, qty: Math.min(next[i]!.qty + 1, p.stock) };
        return next;
      }
      return [...prev, { product: p, qty: 1 }];
    });
    setQuery("");
    setResults([]);
    searchRef.current?.focus();
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const exact = results.find((p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase());
    if (exact) addToCart(exact);
    else if (results.length === 1) addToCart(results[0]!);
  };

  const setQty = (id: string, qty: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: Math.max(0, Math.min(qty, l.product.stock)) } : l))
        .filter((l) => l.qty > 0)
    );

  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product.id !== id));

  // --- precificação (mesma regra do backend) ---
  const priced = useMemo(() => {
    let total = 0;
    const lines = cart.map((l) => {
      const r = resolveUnitPrice(l.product, {
        isClubMember: customer?.isClubMember ?? false,
        isWholesale: customer?.isWholesale ?? false,
        qty: l.qty,
      });
      const lineTotal = r.unitPriceCents * l.qty;
      total += lineTotal;
      return { ...l, unitPriceCents: r.unitPriceCents, source: r.source, lineTotal };
    });
    return { lines, total };
  }, [cart, customer]);

  const payments: PaymentInput[] = PAY_METHODS.map((m) => ({ method: m, amountCents: safeCents(pay[m]) }));
  const breakdown = computePaymentBreakdown(priced.total, payments);

  const canSellCredit =
    !!customer && priced.total > 0 && customer.creditAvailableCents >= priced.total;

  const resetSale = () => {
    setCart([]);
    setCustomer(null);
    setPay({ CASH: "", PIX: "", DEBIT_CARD: "", CREDIT_CARD: "" });
    setQuery("");
    setResults([]);
  };

  const submit = (onCredit: boolean) => {
    setError(null);
    if (cart.length === 0) {
      setError("Carrinho vazio.");
      return;
    }
    start(async () => {
      const r = await finalizeSale({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        customerId: customer?.id ?? null,
        payments: onCredit ? [] : payments,
        onCredit,
      });
      if (!r.ok) {
        setError(r.error ?? "Erro ao finalizar venda");
        return;
      }
      setReceipt({
        orderNumber: r.orderNumber!,
        items: cart,
        totalCents: priced.total,
        changeCents: r.changeCents ?? 0,
        onCredit,
        customerName: customer?.name ?? "Consumidor",
      });
      resetSale();
    });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-cocoa flex items-center gap-2">
          <ShoppingCart size={22} className="text-rose-brand" /> PDV / Caixa
        </h1>
        <CashBar session={session} recon={recon} />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-5">
        {/* Coluna esquerda: busca + carrinho */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Buscar por nome, SKU ou bipar código de barras…"
              className="w-full pl-10 pr-4 py-3 rounded-full border border-cocoa/15 bg-white focus:outline-none focus:border-rose-brand"
              autoFocus
            />
            {results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-2xl border border-cocoa/15 shadow-lg max-h-80 overflow-auto">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50 text-left disabled:opacity-40 border-b border-cocoa/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-cocoa font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-cocoa/50 font-mono">
                        {p.sku}
                        {p.barcode ? ` · ${p.barcode}` : ""} · estoque {p.stock}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-cocoa whitespace-nowrap">{centsToBRL(p.priceCents)}</div>
                  </button>
                ))}
              </div>
            )}
            {searching && query && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cocoa/40">…</div>
            )}
          </div>

          {/* Carrinho */}
          <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
            {priced.lines.length === 0 ? (
              <div className="p-10 text-center text-cocoa/50 text-sm">
                Carrinho vazio. Busque ou bipe um produto.
              </div>
            ) : (
              <div className="divide-y divide-cocoa/8">
                {priced.lines.map((l) => (
                  <div key={l.product.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-cocoa font-medium truncate">{l.product.name}</div>
                      <div className="text-[11px] text-cocoa/55 flex items-center gap-1.5">
                        {centsToBRL(l.unitPriceCents)} cada
                        {l.source === "wholesale" && (
                          <span className="text-caramel font-bold uppercase">atacado</span>
                        )}
                        {l.source === "club" && <span className="text-[#8a5a1e] font-bold uppercase">clube</span>}
                      </div>
                    </div>
                    <div className="flex items-center border border-cocoa/15 rounded-full">
                      <button onClick={() => setQty(l.product.id, l.qty - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-cocoa/5">
                        <Minus size={13} />
                      </button>
                      <span className="w-9 text-center text-sm font-bold">{l.qty}</span>
                      <button onClick={() => setQty(l.product.id, l.qty + 1)} disabled={l.qty >= l.product.stock} className="w-8 h-8 flex items-center justify-center hover:bg-cocoa/5 disabled:opacity-30">
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="w-20 text-right font-bold text-cocoa text-sm">{centsToBRL(l.lineTotal)}</div>
                    <button onClick={() => removeLine(l.product.id)} className="text-cocoa/30 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: cliente + pagamento */}
        <div className="space-y-4">
          <CustomerPicker customer={customer} onChange={setCustomer} />

          <div className="bg-white rounded-2xl border border-cocoa/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-cocoa/70">Total</span>
              <span className="font-display text-3xl font-bold text-cocoa">{centsToBRL(priced.total)}</span>
            </div>

            {/* Formas de pagamento */}
            <div className="space-y-2">
              {PAY_METHODS.map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <span className="w-28 text-xs text-cocoa/70 flex items-center gap-1.5">
                    {m === "CASH" ? <Banknote size={14} /> : <CreditCard size={14} />}
                    {PAYMENT_METHOD_LABELS[m]}
                  </span>
                  <div className="flex flex-1">
                    <span className="px-2 py-2 bg-cocoa/5 border border-r-0 border-cocoa/15 rounded-l-full text-cocoa/60 text-xs font-bold">R$</span>
                    <input
                      value={pay[m]}
                      onChange={(e) => setPay((prev) => ({ ...prev, [m]: e.target.value }))}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="w-full px-2 py-2 rounded-r-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do pagamento */}
            <div className="mt-3 text-sm space-y-1">
              {breakdown.changeCents > 0 && (
                <div className="flex justify-between text-olive font-bold">
                  <span>Troco</span>
                  <span>{centsToBRL(breakdown.changeCents)}</span>
                </div>
              )}
              {!breakdown.isComplete && breakdown.remainingCents > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Falta</span>
                  <span>{centsToBRL(breakdown.remainingCents)}</span>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => submit(false)}
                disabled={pending || cart.length === 0 || !breakdown.isComplete}
                className="w-full bg-olive hover:bg-[#6b7d3a] text-white px-4 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                <Check size={16} /> {pending ? "Finalizando…" : "Finalizar venda"}
              </button>
              <button
                onClick={() => submit(true)}
                disabled={pending || !canSellCredit}
                title={!customer ? "Selecione um cliente para vender no fiado" : ""}
                className="w-full bg-white border border-rose-brand text-rose-brand hover:bg-rose-brand hover:text-white px-4 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition disabled:opacity-40"
              >
                Vender no fiado
                {customer && ` · disp. ${centsToBRL(customer.creditAvailableCents)}`}
              </button>
            </div>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        </div>
      </div>

      {receipt && (
        <ReceiptModal storeName={storeName} receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

// ============================================================
// Barra do caixa (esperado + sangria/suprimento + fechar)
// ============================================================
function CashBar({ session, recon }: { session: Session; recon: CashReconciliation }) {
  const [pending, start] = useTransition();
  const [openPanel, setOpenPanel] = useState<null | "move" | "close">(null);
  const [error, setError] = useState<string | null>(null);
  const [moveType, setMoveType] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveReason, setMoveReason] = useState("");
  const [counted, setCounted] = useState("");

  const doMove = () => {
    setError(null);
    start(async () => {
      const r = await addCashMovement(moveType, moveAmount, moveReason);
      if (!r.ok) setError(r.error ?? "Erro");
      else {
        setMoveAmount("");
        setMoveReason("");
        setOpenPanel(null);
      }
    });
  };

  const doClose = () => {
    setError(null);
    start(async () => {
      const r = await closeCashSession(counted);
      if (!r.ok) setError(r.error ?? "Erro");
      else setOpenPanel(null);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-cocoa/10 p-3 min-w-[280px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-cocoa/55 uppercase tracking-wider">Esperado em caixa</div>
          <div className="font-display text-xl font-bold text-cocoa">{centsToBRL(recon.expectedCashCents)}</div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setOpenPanel(openPanel === "move" ? null : "move")} title="Sangria/Suprimento" className="p-2 rounded-full bg-cocoa/5 hover:bg-cocoa/10 text-cocoa">
            <ArrowDownCircle size={16} />
          </button>
          <button onClick={() => setOpenPanel(openPanel === "close" ? null : "close")} title="Fechar caixa" className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600">
            <Lock size={16} />
          </button>
        </div>
      </div>

      {openPanel === "move" && (
        <div className="mt-3 pt-3 border-t border-cocoa/10 space-y-2">
          <div className="flex gap-1">
            {(["SANGRIA", "SUPRIMENTO"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMoveType(t)}
                className={`flex-1 text-xs font-bold py-1.5 rounded-full inline-flex items-center justify-center gap-1 ${
                  moveType === t ? "bg-cocoa text-white" : "bg-cocoa/5 text-cocoa/70"
                }`}
              >
                {t === "SANGRIA" ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                {t === "SANGRIA" ? "Sangria" : "Suprimento"}
              </button>
            ))}
          </div>
          <input value={moveAmount} onChange={(e) => setMoveAmount(e.target.value)} inputMode="decimal" placeholder="Valor R$" className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand" />
          <input value={moveReason} onChange={(e) => setMoveReason(e.target.value)} placeholder="Motivo (opcional)" className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand" />
          <button onClick={doMove} disabled={pending} className="w-full bg-cocoa text-white py-2 rounded-full text-xs font-bold disabled:opacity-50">Registrar</button>
        </div>
      )}

      {openPanel === "close" && (
        <div className="mt-3 pt-3 border-t border-cocoa/10 space-y-2 text-sm">
          <div className="flex justify-between text-cocoa/70"><span>Fundo de abertura</span><span>{centsToBRL(recon.openingFloatCents)}</span></div>
          <div className="flex justify-between text-cocoa/70"><span>Vendas em dinheiro</span><span>{centsToBRL(recon.cashSalesCents)}</span></div>
          <div className="flex justify-between text-cocoa/70"><span>Suprimentos</span><span>+{centsToBRL(recon.suprimentosCents)}</span></div>
          <div className="flex justify-between text-cocoa/70"><span>Sangrias</span><span>−{centsToBRL(recon.sangriasCents)}</span></div>
          <div className="flex justify-between font-bold text-cocoa border-t border-cocoa/10 pt-1"><span>Esperado</span><span>{centsToBRL(recon.expectedCashCents)}</span></div>
          <input value={counted} onChange={(e) => setCounted(e.target.value)} inputMode="decimal" placeholder="Valor contado na gaveta R$" className="w-full px-3 py-2 rounded-full border border-cocoa/15 focus:outline-none focus:border-rose-brand" />
          <button onClick={doClose} disabled={pending} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50">
            {pending ? "Fechando…" : "Fechar caixa"}
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}

// ============================================================
// Seletor de cliente
// ============================================================
function CustomerPicker({ customer, onChange }: { customer: PdvCustomer | null; onChange: (c: PdvCustomer | null) => void }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PdvCustomer[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => setResults(await searchCustomers(q)), 250);
    return () => clearTimeout(t);
  }, [query]);

  const create = () => {
    setError(null);
    start(async () => {
      const r = await quickCreateCustomer({ name: newName, phone: newPhone });
      if (!r.ok || !r.customer) setError(r.error ?? "Erro");
      else {
        onChange(r.customer);
        setCreating(false);
        setOpen(false);
        setNewName("");
        setNewPhone("");
        setQuery("");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-cocoa/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-cocoa flex items-center gap-2">
          <User size={15} className="text-rose-brand" />
          {customer ? <strong>{customer.name}</strong> : "Consumidor"}
        </span>
        {customer ? (
          <button onClick={() => onChange(null)} className="text-cocoa/40 hover:text-red-500 text-xs">trocar</button>
        ) : (
          <button onClick={() => setOpen(!open)} className="text-rose-brand hover:text-cocoa text-xs font-bold underline">vincular cliente</button>
        )}
      </div>

      {customer && (
        <div className="text-[11px] text-cocoa/55 mt-1 flex gap-2 flex-wrap">
          {customer.isWholesale && <span className="text-caramel font-bold uppercase">atacado</span>}
          {customer.isClubMember && <span className="text-[#8a5a1e] font-bold uppercase">clube</span>}
          {customer.creditOwedCents > 0 && <span className="text-red-600">devendo {centsToBRL(customer.creditOwedCents)}</span>}
        </div>
      )}

      {open && !customer && (
        <div className="mt-3 space-y-2">
          {!creating ? (
            <>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, telefone ou CPF…" className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand" autoFocus />
              {results.map((c) => (
                <button key={c.id} onClick={() => { onChange(c); setOpen(false); setQuery(""); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-cream/50 text-sm border border-cocoa/5">
                  <div className="text-cocoa font-medium">{c.name}</div>
                  <div className="text-[11px] text-cocoa/50">{c.phone ?? c.cpfCnpj ?? ""}</div>
                </button>
              ))}
              <button onClick={() => setCreating(true)} className="text-rose-brand text-xs font-bold underline">+ cadastrar novo cliente</button>
            </>
          ) : (
            <>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome *" className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand" autoFocus />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Telefone" className="w-full px-3 py-2 rounded-full border border-cocoa/15 text-sm focus:outline-none focus:border-rose-brand" />
              <div className="flex gap-2">
                <button onClick={create} disabled={pending} className="flex-1 bg-cocoa text-white py-2 rounded-full text-xs font-bold disabled:opacity-50">Salvar</button>
                <button onClick={() => setCreating(false)} className="text-cocoa/50 text-xs px-3">voltar</button>
              </div>
            </>
          )}
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Cupom 80mm (impressão)
// ============================================================
function ReceiptModal({
  storeName,
  receipt,
  onClose,
}: {
  storeName: string;
  receipt: {
    orderNumber: string;
    items: CartLine[];
    totalCents: number;
    changeCents: number;
    onCredit: boolean;
    customerName: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 print:bg-white print:block print:p-0">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 print:rounded-none print:shadow-none print:max-w-none">
        <div className="flex items-center justify-between mb-3 print:hidden">
          <h3 className="font-display font-bold text-cocoa flex items-center gap-2">
            <Check size={18} className="text-olive" /> Venda registrada
          </h3>
          <button onClick={onClose} className="text-cocoa/40 hover:text-cocoa"><X size={18} /></button>
        </div>

        <div id="pdv-receipt" className="font-mono text-[12px] text-black leading-snug">
          <div className="text-center font-bold text-sm">{storeName}</div>
          <div className="text-center">Pedido {receipt.orderNumber}</div>
          <div className="text-center text-[11px]">{receipt.customerName}</div>
          <div className="border-t border-dashed border-black my-2" />
          {receipt.items.map((l) => (
            <div key={l.product.id} className="flex justify-between gap-2">
              <span className="truncate">{l.qty}x {l.product.name}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-black my-2" />
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{centsToBRL(receipt.totalCents)}</span>
          </div>
          {receipt.onCredit ? (
            <div className="flex justify-between"><span>FIADO</span><span>a receber</span></div>
          ) : (
            receipt.changeCents > 0 && (
              <div className="flex justify-between"><span>TROCO</span><span>{centsToBRL(receipt.changeCents)}</span></div>
            )
          )}
          <div className="text-center mt-2 text-[11px]">Obrigado pela preferência!</div>
        </div>

        <div className="flex gap-2 mt-4 print:hidden">
          <button onClick={() => window.print()} className="flex-1 bg-cocoa hover:bg-espresso text-white py-2.5 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2">
            <Printer size={15} /> Imprimir cupom
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-full border border-cocoa/15 text-cocoa text-sm font-bold">Nova venda</button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pdv-receipt, #pdv-receipt * { visibility: visible !important; }
          #pdv-receipt { position: fixed; left: 0; top: 0; width: 80mm; padding: 4mm; }
        }
      `}</style>
    </div>
  );
}
