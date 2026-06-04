"use client";

import { useTransition, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { simulatePayment } from "@/app/actions/dev-payment";

export function DevPaymentSimulator({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handle = () => {
    setError(null);
    startTransition(async () => {
      const res = await simulatePayment(orderId);
      if (!res.ok) setError(res.error ?? "Erro ao simular");
    });
  };

  return (
    <div>
      <button onClick={handle} disabled={pending} className="btn-pink">
        <CheckCircle2 size={16} />
        {pending ? "Confirmando..." : "Simular pagamento confirmado (dev)"}
      </button>
      {error && (
        <div className="text-red-600 text-sm mt-2">{error}</div>
      )}
    </div>
  );
}
