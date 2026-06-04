import { prisma } from "./prisma";

type AuditPayload = {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  ip?: string;
  userAgent?: string;
};

/**
 * Registra ação em log de auditoria. Falhar silenciosamente para não
 * derrubar a operação principal (auditoria não é crítica para a request).
 */
export async function logAudit(p: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: p.userId ?? undefined,
        action: p.action,
        entityType: p.entityType,
        entityId: p.entityId,
        beforeJson: p.beforeJson as never,
        afterJson: p.afterJson as never,
        ip: p.ip,
        userAgent: p.userAgent,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao gravar log:", err);
  }
}
