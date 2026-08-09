"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { duplicateProduct } from "./actions";

/**
 * Duplica o produto e leva direto para a edição da cópia — que nasce inativa,
 * sem estoque e sem código de barras, para o usuário revisar antes de publicar.
 */
export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  const onClick = () =>
    start(async () => {
      setErr(false);
      const r = await duplicateProduct(productId);
      if (r.ok && r.newId) router.push(`/admin/produtos/${r.newId}/editar`);
      else setErr(true);
    });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`p-1.5 disabled:opacity-50 ${err ? "text-red-600" : "text-cocoa/60 hover:text-rose-brand"}`}
      title={err ? "Falha ao duplicar — tente de novo" : "Duplicar produto"}
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
    </button>
  );
}
