"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { loginCustomer, type AuthState } from "@/app/actions/customer-auth";

const initial: AuthState = {};

const formatCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export function CustomerLoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginCustomer, initial);
  const [cpf, setCpf] = useState("");
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
        <label className="block text-sm font-semibold text-cocoa mb-1.5">CPF</label>
        <input
          name="cpf"
          inputMode="numeric"
          autoComplete="username"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.cpf && <p className="text-red-600 text-xs mt-1">{fe.cpf[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-cocoa mb-1.5">Senha</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          className="w-full px-4 py-3 rounded-xl border border-cocoa/15 text-cocoa focus:outline-none focus:border-rose-brand focus:ring-2 focus:ring-rose-brand/15 transition"
        />
        {fe.password && <p className="text-red-600 text-xs mt-1">{fe.password[0]}</p>}
      </div>

      <button type="submit" disabled={pending} className="btn-pink w-full">
        {pending ? (
          "Entrando..."
        ) : (
          <>
            <LogIn size={16} /> Entrar
          </>
        )}
      </button>

      <p className="text-center text-sm text-cocoa/60 flex items-center justify-center gap-1.5">
        <Lock size={12} className="text-olive" />
        Acesso protegido
      </p>

      <p className="text-center text-sm text-cocoa/70 pt-2 border-t border-cocoa/10">
        Ainda não tem conta?{" "}
        <Link
          href={next ? `/cadastro?next=${encodeURIComponent(next)}` : "/cadastro"}
          className="font-bold text-rose-brand hover:underline"
        >
          Criar cadastro
        </Link>
      </p>
    </form>
  );
}
