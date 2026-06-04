"use client";

import { useTransition } from "react";
import { toggleProductActive } from "./actions";

export function ToggleProductActiveButton({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleProductActive(productId).then(() => {}))}
      disabled={pending}
      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
        active
          ? "bg-olive/15 border-olive/40 text-olive hover:bg-olive hover:text-white"
          : "bg-cocoa/10 border-cocoa/20 text-cocoa/60 hover:bg-cocoa hover:text-cream"
      }`}
      title={active ? "Clique para desativar" : "Clique para ativar"}
    >
      {active ? "Ativo" : "Inativo"}
    </button>
  );
}
