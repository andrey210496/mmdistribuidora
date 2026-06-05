import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "./env";

export type AdminSession = {
  userId?: string;
  email?: string;
  role?: "ADMIN" | "PICKER" | "FINANCE";
  // CSRF token para Server Actions sensíveis
  csrf?: string;
  // Marca login pra rotacionar sessão se necessário
  loggedAt?: number;
};

export const adminSessionOptions: SessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: env.SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax", // "strict" quebra fluxo de pagamento que volta de external URL
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, adminSessionOptions);
}

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CustomerSession = {
  customerId?: string;
  name?: string;
  email?: string;
  loggedAt?: number;
  // Carrinho — só productId + quantity. Preços são SEMPRE recalculados no backend.
  cart?: CartItem[];
  // CEP usado pra calcular frete na sessão
  shippingZip?: string;
};

export const customerSessionOptions: SessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: "doce_customer",
  cookieOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30d
  },
};

export async function getCustomerSession() {
  const cookieStore = await cookies();
  return getIronSession<CustomerSession>(cookieStore, customerSessionOptions);
}
