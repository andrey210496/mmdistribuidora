"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initial: ChangePasswordState = {};

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial
  );

  const fe = state.fieldErrors ?? {};

  return (
    <main className="min-h-screen bg-brand-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-gold font-bold">
            Troque sua senha
          </h1>
          <p className="text-cream/70 text-sm mt-1">
            Por segurança, é obrigatório definir uma nova senha no primeiro acesso.
          </p>
        </div>

        <div className="card p-8">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="label">
                Senha atual
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
              />
              {fe.currentPassword && (
                <p className="text-red-600 text-xs mt-1">
                  {fe.currentPassword[0]}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="newPassword" className="label">
                Nova senha
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                className="input-field"
              />
              <p className="text-xs text-cocoa/70 mt-1">
                Mínimo 10 caracteres, com maiúscula, minúscula e número.
              </p>
              {fe.newPassword && (
                <p className="text-red-600 text-xs mt-1">{fe.newPassword[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirme a nova senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="input-field"
              />
              {fe.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">
                  {fe.confirmPassword[0]}
                </p>
              )}
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {state.error}
              </div>
            )}

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? "Salvando..." : "Atualizar senha"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
