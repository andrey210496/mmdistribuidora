import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getCustomerSession } from "./session";
import type { ClubMember } from "@prisma/client";

// ============================================================
// Cliente logado + status de membro do Clube.
// REGRA ANTI-BURLA: a condição de membro é SEMPRE consultada no banco
// (nunca confiamos num flag salvo no cookie). O preço de membro só é
// aplicado pelo backend quando esta verificação retorna verdadeiro.
// ============================================================

export type CurrentCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  clubMember: ClubMember | null;
  isClubMember: boolean;
  isWholesale: boolean;
};

/** Membro ativo = status ACTIVE e (sem expiração OU ainda não expirou). */
export function isActiveClubMember(member: ClubMember | null | undefined): boolean {
  if (!member) return false;
  if (member.status !== "ACTIVE") return false;
  if (member.expiresAt && member.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

/** Cliente atualmente logado (ou null). Sempre recarrega do banco. */
export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const session = await getCustomerSession();
  if (!session.customerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: { clubMember: true },
  });
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    cpfCnpj: customer.cpfCnpj,
    phone: customer.phone,
    clubMember: customer.clubMember,
    isClubMember: isActiveClubMember(customer.clubMember),
    isWholesale: customer.isWholesale,
  };
}

/** Exige cliente logado; redireciona para /entrar?next=... se não houver. */
export async function requireCustomer(nextPath?: string): Promise<CurrentCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/entrar${q}`);
  }
  return customer;
}

/**
 * Só o id de membro ativo — atalho barato para o cálculo de preço do carrinho,
 * evitando carregar o objeto inteiro do cliente.
 */
export async function isCurrentCustomerActiveMember(): Promise<boolean> {
  const session = await getCustomerSession();
  if (!session.customerId) return false;
  const member = await prisma.clubMember.findUnique({
    where: { customerId: session.customerId },
  });
  return isActiveClubMember(member);
}

/** Cliente logado é atacadista? Atalho barato para a precificação do carrinho. */
export async function isCurrentCustomerWholesale(): Promise<boolean> {
  const session = await getCustomerSession();
  if (!session.customerId) return false;
  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { isWholesale: true },
  });
  return customer?.isWholesale ?? false;
}
