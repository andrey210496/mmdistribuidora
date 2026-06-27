import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getCustomerSession } from "./session";

// ============================================================
// Cliente logado. Condições (ex.: atacado) são SEMPRE consultadas no
// banco — nunca confiamos num flag salvo no cookie.
// ============================================================

export type CurrentCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  isWholesale: boolean;
};

/** Cliente atualmente logado (ou null). Sempre recarrega do banco. */
export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const session = await getCustomerSession();
  if (!session.customerId) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
  });
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    cpfCnpj: customer.cpfCnpj,
    phone: customer.phone,
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
