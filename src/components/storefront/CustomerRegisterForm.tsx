"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { UserPlus, ShieldCheck } from "lucide-react";
import { registerCustomer, type AuthState } from "@/app/actions/customer-auth";

const initial: AuthState = {};

const formatCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};

export function CustomerRegisterForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(registerCustomer, initial);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">Nome completo</label>
        <input
          name="name"
          autoComplete="name"
          placeholder="Seu nome e sobrenome"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.name && <p className="text-red-600 text-xs mt-1">{fe.name[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">Telefone (WhatsApp)</label>
        <input
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(12) 99999-9999"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.phone && <p className="text-red-600 text-xs mt-1">{fe.phone[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">CPF</label>
        <input
          name="cpf"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.cpf && <p className="text-red-600 text-xs mt-1">{fe.cpf[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">Criar senha</label>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.password && <p className="text-red-600 text-xs mt-1">{fe.password[0]}</p>}
      </div>

      <button type="submit" disabled={pending} className="btn-pink w-full">
        {pending ? (
          "Criando conta..."
        ) : (
          <>
            <UserPlus size={16} /> Criar cadastro
          </>
        )}
      </button>

      <p className="text-center text-xs text-cocoa/55 flex items-center justify-center gap-1.5">
        <ShieldCheck size={12} className="text-olive" />
        Seus dados são protegidos e usados só para suas compras.
      </p>

      <p className="text-center text-sm text-cocoa/70 pt-2 border-t border-cocoa/10">
        Já tem cadastro?{" "}
        <Link
          href={next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar"}
          className="font-bold text-rose-brand hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
