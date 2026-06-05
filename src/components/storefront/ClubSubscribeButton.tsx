"use client";

import { useActionState, useEffect } from "react";
import { Crown, ArrowRight } from "lucide-react";
import { subscribeToClub, type ClubSubscribeState } from "@/app/actions/club";

const initial: ClubSubscribeState = {};

export function ClubSubscribeButton({ priceLabel }: { priceLabel: string }) {
  const [state, action, pending] = useActionState(subscribeToClub, initial);

  useEffect(() => {
    if (state.redirectTo) window.location.href = state.redirectTo;
  }, [state.redirectTo]);

  return (
    <form action={action} className="w-full">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-3">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold py-3.5 rounded-full shadow-[0_8px_24px_-8px_rgba(212,165,116,0.7)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0"
      >
        <Crown size={18} fill="currentColor" />
        {pending ? "Redirecionando..." : `Assinar — ${priceLabel}/ano`}
        {!pending && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
