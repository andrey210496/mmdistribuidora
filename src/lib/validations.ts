import { z } from "zod";

// ============================================================
// Schemas de validação — TODA entrada do cliente passa por aqui.
// Backend NUNCA confia em string vinda do frontend sem validar.
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(200),
  password: z.string().min(1, "Senha obrigatória").max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(10, "Mínimo 10 caracteres")
      .max(200)
      .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
      .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
      .regex(/[0-9]/, "Inclua ao menos um número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export const cpfCnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11 || v.length === 14, "CPF/CNPJ inválido");

export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 8, "CEP inválido");

export const addressSchema = z.object({
  zip: cepSchema,
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email().max(200),
  customerCpfCnpj: cpfCnpjSchema.optional(),
  customerPhone: z.string().max(30).optional(),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  items: z.array(checkoutItemSchema).min(1).max(50),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "SEPARATING",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "CANCELED",
    "REFUNDED",
  ]),
  notes: z.string().max(500).optional(),
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().max(5000),
  sku: z.string().min(1).max(50),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative(),
  weightGrams: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  categoryId: z.string().optional().nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
