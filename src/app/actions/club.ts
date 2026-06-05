"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentCustomer } from "@/lib/customer";
import { getClubConfig } from "@/lib/club";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type ClubSubscribeState = { error?: string; redirectTo?: string };

/**
 * Inicia a assinatura ANUAL do clube. Exige cliente logado.
 * Cria a sessão de pagamento no Stripe; a ativação do membro só ocorre
 * quando o webhook confirma o pagamento (nunca confiamos no retorno do cliente).
 */
export async function subscribeToClub(
  _prev: ClubSubscribeState,
  _formData: FormData
): Promise<ClubSubscribeState> {
  const h = await headers();
  const ip = clientIp(h);

  const customer = await getCurrentCustomer();
  if (!customer) {
    return { redirectTo: "/entrar?next=/clube" };
  }
  if (customer.isClubMember) {
    return { redirectTo: "/conta" };
  }

  const cfg = await getClubConfig();
  if (!cfg.active) {
    return { error: "As assinaturas do clube estão temporariamente indisponíveis." };
  }
  if (!stripe.isConfigured()) {
    return { error: "Pagamento indisponível no momento. Tente novamente em instantes." };
  }

  const rl = rateLimit(`club-subscribe:${ip}`, 5, 60);
  if (!rl.ok) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.resetInSeconds}s.` };
  }

  let url: string;
  try {
    const session = await stripe.createClubCheckoutSession({
      customerId: customer.id,
      customerEmail: customer.email ?? undefined,
      priceCents: cfg.annualPriceCents,
      clubName: cfg.name,
      successUrl: `${env.APP_URL}/conta?clube=ativando`,
      cancelUrl: `${env.APP_URL}/clube?cancelado=1`,
    });
    url = session.url;
  } catch (err) {
    console.error("[club] erro ao criar checkout:", err);
    return { error: "Não foi possível iniciar o pagamento. Tente novamente." };
  }

  await logAudit({
    action: "club.checkout.created",
    entityType: "Customer",
    entityId: customer.id,
    ip,
  });

  redirect(url);
}
