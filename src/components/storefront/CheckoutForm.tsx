"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, CreditCard, Crown, ArrowRight, X } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { submitCheckout, type CheckoutState } from "@/app/actions/checkout";
import type { CartSummary } from "@/lib/cart";

const initial: CheckoutState = {};

type CheckoutCustomer = {
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  isClubMember: boolean;
};

type CheckoutUpsell = {
  id: string;
  title: string;
  body: string;
  ctaText: string | null;
  ctaHref: string | null;
} | null;

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const formatCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2");
};

const formatCep = (v: string) =>
  v.replace(/\D/g, "").replace(/(\d{5})(\d{1,3})/, "$1-$2").slice(0, 9);

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

export function CheckoutForm({
  cart,
  customer,
  checkoutUpsell = null,
}: {
  cart: CartSummary;
  customer: CheckoutCustomer;
  checkoutUpsell?: CheckoutUpsell;
}) {
  const [state, formAction, pending] = useActionState(submitCheckout, initial);
  const [cpfCnpj, setCpfCnpj] = useState(
    customer.cpfCnpj ? formatCpfCnpj(customer.cpfCnpj) : ""
  );
  const [cep, setCep] = useState(cart.shippingZip ? formatCep(cart.shippingZip) : "");
  const [phone, setPhone] = useState(
    customer.phone ? formatPhone(customer.phone) : ""
  );

  // Card do clube no checkout (só não-membros). Mostra uma vez antes de pagar.
  const formRef = useRef<HTMLFormElement>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellPassed, setUpsellPassed] = useState(false);
  const shouldUpsell = !customer.isClubMember && !!checkoutUpsell;

  const fe = state.fieldErrors ?? {};

  // Fallback: se a sessão expirar no meio do checkout, o backend pede login
  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (shouldUpsell && !upsellPassed) {
      e.preventDefault();
      setShowUpsell(true);
    }
  };

  const proceedToPayment = () => {
    setUpsellPassed(true);
    setShowUpsell(false);
    // Reenvia o formulário agora liberado
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="grid lg:grid-cols-[1fr_380px] gap-8"
    >
      {/* Card do Clube ao finalizar (interstitial) */}
      {showUpsell && checkoutUpsell && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => setShowUpsell(false)}
            className="absolute inset-0 bg-espresso/60 backdrop-blur-sm"
            aria-hidden
          />
          <div
            className="relative w-full max-w-md bg-cream rounded-2xl overflow-hidden shadow-2xl"
            role="dialog"
            aria-label={checkoutUpsell.title}
          >
            <button
              type="button"
              onClick={() => setShowUpsell(false)}
              aria-label="Fechar"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-cocoa flex items-center justify-center shadow"
            >
              <X size={18} />
            </button>

            <div className="h-20 bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] flex items-center justify-center">
              <Crown size={32} className="text-gold" fill="currentColor" />
            </div>

            <div className="p-6 text-center">
              <h3 className="font-display text-2xl font-bold text-cocoa mb-2">
                {checkoutUpsell.title}
              </h3>
              <p className="text-cocoa/70 text-sm whitespace-pre-line">{checkoutUpsell.body}</p>

              {cart.potentialClubSavingsCents > 0 && (
                <div className="mt-4 rounded-xl bg-[#faf3e6] border border-[#d4a574]/40 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wider text-[#a07640] font-bold">
                    Sendo membro, nesta compra você economizaria
                  </div>
                  <div className="font-display text-3xl font-bold text-[#8a5a1e] leading-none mt-1">
                    {centsToBRL(cart.potentialClubSavingsCents)}
                  </div>
                </div>
              )}

              <a
                href={checkoutUpsell.ctaHref || "/clube"}
                className="mt-5 inline-flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold py-3 rounded-full shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Crown size={16} fill="currentColor" />
                {checkoutUpsell.ctaText || "Quero ser membro"}
                <ArrowRight size={16} />
              </a>
              <button
                type="button"
                onClick={proceedToPayment}
                className="mt-2 w-full text-cocoa/60 hover:text-cocoa text-sm py-2"
              >
                Continuar sem o desconto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coluna principal */}
      <div className="space-y-6">
        {/* Identificação */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-cocoa mb-1">1. Seus dados</h2>
          <p className="text-sm text-cocoa/60 mb-5">
            Esses dados são usados para emissão da nota fiscal e contato sobre o pedido.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className="label">Nome completo *</label>
              <input
                id="customerName"
                name="customerName"
                required
                maxLength={200}
                defaultValue={customer.name}
                className="input-field"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="customerEmail" className="label">E-mail (opcional)</label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                maxLength={200}
                defaultValue={customer.email ?? ""}
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="customerPhone" className="label">Telefone *</label>
              <input
                id="customerPhone"
                name="customerPhone"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required
                className="input-field"
                placeholder="(11) 91234-5678"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="customerCpfCnpj" className="label">CPF ou CNPJ</label>
              <input
                id="customerCpfCnpj"
                name="customerCpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                className="input-field"
                placeholder="000.000.000-00"
                maxLength={18}
              />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-cocoa mb-5">2. Endereço de entrega</h2>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="zip" className="label">CEP *</label>
              <input
                id="zip"
                name="zip"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                required
                maxLength={9}
                className="input-field"
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="street" className="label">Rua *</label>
              <input id="street" name="street" required maxLength={200} className="input-field" placeholder="Rua / Av." />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="number" className="label">Número *</label>
              <input id="number" name="number" required maxLength={20} className="input-field" placeholder="Nº" />
            </div>
            <div className="sm:col-span-4">
              <label htmlFor="complement" className="label">Complemento</label>
              <input id="complement" name="complement" maxLength={100} className="input-field" placeholder="Apto, bloco, referência..." />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="neighborhood" className="label">Bairro *</label>
              <input id="neighborhood" name="neighborhood" required maxLength={100} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="city" className="label">Cidade *</label>
              <input id="city" name="city" required maxLength={100} className="input-field" />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="state" className="label">UF *</label>
              <select id="state" name="state" required className="input-field bg-white">
                <option value="">UF</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Pagamento */}
        <section className="bg-white rounded-2xl border border-cocoa/10 p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-cocoa mb-1">3. Pagamento</h2>
          <p className="text-sm text-cocoa/60 mb-5 flex items-center gap-1.5">
            <Lock size={13} className="text-olive" />
            Pagamento processado de forma segura pelo Stripe
          </p>

          <div className="rounded-xl border border-cocoa/15 bg-cream/40 p-5">
            <p className="text-sm text-cocoa/80 mb-4">
              Ao confirmar, você será levado para a página segura do Stripe,
              onde poderá pagar com:
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white border border-cocoa/10 rounded-lg px-3 py-2">
                <CreditCard size={16} className="text-rose-brand" />
                <span className="text-sm font-semibold text-cocoa">Cartão de crédito</span>
                <span className="text-[10px] uppercase tracking-wider bg-cocoa/5 text-cocoa/60 font-bold px-2 py-0.5 rounded-full">
                  até 6x
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Erro global */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {state.error}
          </div>
        )}
        {Object.keys(fe).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Verifique os campos destacados:
            <ul className="list-disc ml-5 mt-1">
              {Object.entries(fe).map(([k, v]) => (
                <li key={k}>{k}: {v?.[0]}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Resumo lateral */}
      <aside className="lg:sticky lg:top-44 lg:self-start">
        <div className="bg-white rounded-2xl border border-cocoa/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-cocoa/10">
            <h2 className="font-display text-xl font-bold text-cocoa">Seu pedido</h2>
          </div>

          <div className="px-6 py-4 max-h-[300px] overflow-y-auto space-y-3 border-b border-cocoa/10">
            {cart.lines.map((line) => (
              <div key={line.productId} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg bg-cream overflow-hidden shrink-0">
                  {line.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-cocoa text-xs leading-snug line-clamp-2 font-medium">
                    {line.productName}
                  </div>
                  <div className="text-cocoa/60 text-xs">Qtd: {line.quantity}</div>
                </div>
                <div className="font-bold text-cocoa text-sm whitespace-nowrap">
                  {centsToBRL(line.totalCents)}
                </div>
              </div>
            ))}
          </div>

          {cart.isClubMember && cart.clubSavingsCents > 0 && (
            <div className="mx-6 mt-4 rounded-lg bg-[#faf3e6] border border-[#d4a574]/40 px-3 py-2 flex items-center gap-2 text-[#8a5a1e]">
              <Crown size={14} fill="currentColor" />
              <span className="text-xs font-bold">
                Preço de membro aplicado — você economiza {centsToBRL(cart.clubSavingsCents)}
              </span>
            </div>
          )}

          <div className="px-6 py-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa/70">Subtotal</span>
              <span className="text-cocoa font-semibold">{centsToBRL(cart.subtotalCents)}</span>
            </div>
            {cart.isClubMember && cart.clubSavingsCents > 0 && (
              <div className="flex justify-between">
                <span className="text-cocoa/70">Desconto de membro</span>
                <span className="text-olive font-semibold">−{centsToBRL(cart.clubSavingsCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cocoa/70">Frete</span>
              <span className={`font-semibold ${cart.shippingCents === 0 ? "text-olive" : "text-cocoa"}`}>
                {cart.shippingCents === 0 ? "Grátis" : centsToBRL(cart.shippingCents)}
              </span>
            </div>
            <div className="border-t border-cocoa/10 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-cocoa">Total</span>
              <span className="font-display text-2xl font-bold text-cocoa">
                {centsToBRL(cart.totalCents)}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button type="submit" disabled={pending} className="btn-pink w-full">
              {pending ? "Processando..." : "Ir para o pagamento"}
            </button>
            <div className="flex items-center gap-2 text-xs text-cocoa/60 justify-center mt-3">
              <ShieldCheck size={13} className="text-olive" />
              <span>Seus dados estão protegidos</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
