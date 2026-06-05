"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { customerRegisterSchema, customerLoginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Garante que o destino pós-login é um caminho interno (anti open-redirect). */
function safeNext(next: FormDataEntryValue | null): string {
  const v = typeof next === "string" ? next : "";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return "/conta";
}

// ============================================================
// CADASTRO — nome completo, telefone, CPF e senha. Sem e-mail.
// ============================================================
export async function registerCustomer(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const h = await headers();
  const ip = clientIp(h);
  const userAgent = h.get("user-agent") ?? undefined;

  const rl = rateLimit(`register:${ip}`, 10, 60);
  if (!rl.ok) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.resetInSeconds}s.` };
  }

  const parsed = customerRegisterSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    cpf: formData.get("cpf"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const data = parsed.data;

  const passwordHash = await hashPassword(data.password);

  // CPF já cadastrado?
  const existing = await prisma.customer.findUnique({
    where: { cpfCnpj: data.cpf },
    select: { id: true, passwordHash: true },
  });

  let customer: { id: string; name: string };
  if (existing && existing.passwordHash) {
    // Conta com senha já definida — deve fazer login
    return { fieldErrors: { cpf: ["Este CPF já tem cadastro. Faça login."] } };
  } else if (existing) {
    // Cliente "convidado" antigo (sem senha): define a senha e completa o cadastro
    customer = await prisma.customer.update({
      where: { id: existing.id },
      data: { name: data.name, phone: data.phone, passwordHash },
      select: { id: true, name: true },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name: data.name,
        cpfCnpj: data.cpf,
        phone: data.phone,
        passwordHash,
      },
      select: { id: true, name: true },
    });
  }

  await logAudit({
    action: "customer.registered",
    entityType: "Customer",
    entityId: customer.id,
    ip,
    userAgent,
  });

  // Cria sessão (mantém o carrinho atual da sessão)
  const session = await getCustomerSession();
  session.customerId = customer.id;
  session.name = customer.name;
  session.email = undefined;
  session.loggedAt = Date.now();
  await session.save();

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

// ============================================================
// LOGIN — CPF + senha. Mensagem genérica (não revela se CPF existe).
// ============================================================
export async function loginCustomer(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const h = await headers();
  const ip = clientIp(h);
  const userAgent = h.get("user-agent") ?? undefined;

  const rl = rateLimit(`login-customer:${ip}`, 10, 60);
  if (!rl.ok) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.resetInSeconds}s.` };
  }

  const parsed = customerLoginSchema.safeParse({
    cpf: formData.get("cpf"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { cpf, password } = parsed.data;

  const customer = await prisma.customer.findUnique({
    where: { cpfCnpj: cpf },
  });

  // Hash dummy pra dificultar timing attack (mesmo custo quando o CPF não existe)
  if (!customer || !customer.passwordHash) {
    await verifyPassword(
      "$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXk$dHVtbXk",
      password
    );
    await logAudit({
      action: "customer.login.failed",
      ip,
      userAgent,
      afterJson: { reason: "not_found_or_no_password" },
    });
    return { error: "CPF ou senha incorretos." };
  }

  const valid = await verifyPassword(customer.passwordHash, password);
  if (!valid) {
    await logAudit({
      action: "customer.login.failed",
      entityType: "Customer",
      entityId: customer.id,
      ip,
      userAgent,
    });
    return { error: "CPF ou senha incorretos." };
  }

  const session = await getCustomerSession();
  session.customerId = customer.id;
  session.name = customer.name;
  session.email = customer.email ?? undefined;
  session.loggedAt = Date.now();
  await session.save();

  await logAudit({
    action: "customer.login.success",
    entityType: "Customer",
    entityId: customer.id,
    ip,
    userAgent,
  });

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

// ============================================================
// LOGOUT — mantém o carrinho, limpa identidade.
// ============================================================
export async function logoutCustomer(): Promise<void> {
  const session = await getCustomerSession();
  session.customerId = undefined;
  session.name = undefined;
  session.email = undefined;
  session.loggedAt = undefined;
  await session.save();
  revalidatePath("/", "layout");
  redirect("/");
}
