"use client";

import { useActionState, useState, useEffect, useRef, useTransition } from "react";
import { ShieldCheck, Lock, CreditCard } from "lucide-react";
import { centsToBRL } from "@/lib/money";
import { Price } from "./Price";
import { submitCheckout, type CheckoutState } from "@/app/actions/checkout";
import { quoteShipping } from "@/app/actions/cart";
import type { CartSummary } from "@/lib/cart";

const initial: CheckoutState = {};

type CheckoutCustomer = {
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
};

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
  cart: initialCart,
  customer,
}: {
  cart: CartSummary;
  customer: CheckoutCustomer;
}) {
  const [state, formAction, pending] = useActionState(submitCheckout, initial);
  const [cart, setCart] = useState(initialCart);
  const [quoting, startQuote] = useTransition();
  const lastQuoted = useRef(initialCart.shippingZip ?? "");
  const [cpfCnpj, setCpfCnpj] = useState(
    customer.cpfCnpj ? formatCpfCnpj(customer.cpfCnpj) : ""
  );
  const [cep, setCep] = useState(cart.shippingZip ? formatCep(cart.shippingZip) : "");
  const [phone, setPhone] = useState(
    customer.phone ? formatPhone(customer.phone) : ""
  );

  const fe = state.fieldErrors ?? {};

  // Fallback: se a sessão expirar no meio do checkout, o backend pede login
  useEffect(() => {
    if (state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo]);

  // Recota o frete quando o CEP fica completo (8 dígitos). O preço vem do backend.
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length === 8 && digits !== lastQuoted.current) {
      lastQuoted.current = digits;
      startQuote(async () => setCart(await quoteShipping(digits)));
    }
  }, [cep]);


  return (
    <form
      action={formAction}
      className="grid lg:grid-cols-[1fr_380px] gap-8"
    >
      {/* Coluna principal */}
      <div className="space-y-6">
        {/* Identificação */}
        <section className="bg-white rounded-3xl border border-line p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-ink mb-1">1. Seus dados</h2>
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
        <section className="bg-white rounded-3xl border border-line p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-ink mb-5">2. Endereço de entrega</h2>

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
        <section className="bg-white rounded-3xl border border-line p-6 lg:p-8">
          <h2 className="font-display text-xl font-bold text-ink mb-1">3. Pagamento</h2>
          <p className="text-sm text-cocoa/60 mb-5 flex items-center gap-1.5">
            <Lock size={13} className="text-olive" />
            Ambiente seguro — seus dados são protegidos
          </p>

          <div className="rounded-2xl border border-line bg-cream p-5">
            <p className="text-sm text-cocoa/80 mb-4">
              Ao confirmar, você vai para a etapa de pagamento, onde pode pagar com:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"].map((m) => (
                <div key={m} className="flex items-center gap-2 bg-white border border-line rounded-full px-3.5 py-2">
                  <CreditCard size={15} className="text-rose-brand" />
                  <span className="text-[13px] font-bold text-ink">{m}</span>
                </div>
              ))}
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
        <div className="bg-white rounded-3xl border border-line overflow-hidden">
          <div className="px-6 py-5 border-b border-line bg-cream">
            <h2 className="font-display text-xl font-bold text-ink">Seu pedido</h2>
          </div>

          <div className="px-6 py-4 max-h-[300px] overflow-y-auto space-y-3 border-b border-line">
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

          <div className="px-6 py-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa/70">Subtotal</span>
              <span className="text-cocoa font-semibold">{centsToBRL(cart.subtotalCents)}</span>
            </div>
            {cart.discountCents > 0 && (
              <div className="flex justify-between">
                <span className="text-cocoa/70">Desconto</span>
                <span className="text-olive font-semibold">−{centsToBRL(cart.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cocoa/70">Frete</span>
              <span className={`font-semibold ${cart.shippingCents === 0 ? "text-olive" : "text-cocoa"}`}>
                {quoting ? "calculando…" : cart.shippingCents === 0 ? "Grátis" : centsToBRL(cart.shippingCents)}
              </span>
            </div>
            <div className="border-t border-line pt-3 flex justify-between items-center">
              <span className="font-bold text-ink">Total</span>
              <Price cents={cart.totalCents} className="text-[28px] text-rose-brand" />
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
