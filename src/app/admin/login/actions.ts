"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authenticateAdmin } from "@/lib/auth";
import { getAdminSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { randomToken } from "@/lib/crypto";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const h = await headers();
  const ip = clientIp(h);

  // Rate limit por IP — protege contra brute force
  const rl = rateLimit(
    `login:${ip}`,
    env.RATE_LIMIT_LOGIN_PER_MIN,
    60
  );
  if (!rl.ok) {
    return {
      error: `Muitas tentativas. Tente novamente em ${rl.resetInSeconds}s.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Preencha email e senha corretamente." };
  }

  const result = await authenticateAdmin(parsed.data.email, parsed.data.password, {
    ip,
    userAgent: h.get("user-agent") ?? undefined,
  });

  if (!result.ok) {
    if (result.reason === "locked") {
      return { error: "Conta bloqueada temporariamente por excesso de tentativas." };
    }
    if (result.reason === "inactive") {
      return { error: "Conta inativa. Contate o administrador." };
    }
    return { error: "E-mail ou senha incorretos." };
  }

  const session = await getAdminSession();
  session.userId = result.userId;
  session.email = parsed.data.email;
  session.csrf = randomToken(16);
  session.loggedAt = Date.now();
  await session.save();

  redirect(result.mustChangePassword ? "/admin/trocar-senha" : "/admin");
}

export async function logoutAction() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
