"use client";

import { useState, useTransition } from "react";
import { Trash2, Check, X } from "lucide-react";
import { deleteProduct } from "./actions";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handleDelete = () => {
    setError(null);
    start(async () => {
      const r = await deleteProduct(productId);
      if (!r.ok) {
        setError(r.error ?? "Erro ao excluir");
        setConfirming(false);
      }
      // Sucesso: a linha some via revalidatePath.
    });
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-[11px] text-cocoa/70 hidden sm:inline">Excluir?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          title="Confirmar exclusão"
          className="text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded p-1 transition disabled:opacity-50"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          title="Cancelar"
          className="text-cocoa/50 hover:text-cocoa border border-cocoa/20 rounded p-1 transition"
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        title={`Excluir ${productName}`}
        className="text-cocoa/60 hover:text-red-600 p-1.5"
      >
        <Trash2 size={15} />
      </button>
      {error && (
        <span className="text-[10px] text-red-600 max-w-[180px] text-right leading-tight mt-0.5">
          {error}
        </span>
      )}
    </span>
  );
}
