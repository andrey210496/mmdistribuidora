"use client";

import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

// Renderiza o Checkout EMBUTIDO do Stripe dentro do nosso site.
// O client_secret é criado no servidor (página) — aqui só montamos o iframe seguro.
export function EmbeddedPayment({
  clientSecret,
  publishableKey,
}: {
  clientSecret: string;
  publishableKey: string;
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <div id="checkout" className="min-h-[420px]">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
