import { describe, it, expect, beforeAll } from "vitest";

// Define LICENSE_SECRET antes de importar o modulo (env é carregada no top-level).
beforeAll(() => {
  process.env.LICENSE_SECRET = "unit_test_license_secret_0123456789_abcdef_fixed";
});

// Import dinâmico pra garantir que env.ts leia o secret setado acima.
async function loadLicense() {
  return await import("../src/lib/license");
}

describe("verifyLicenseSecret", () => {
  it("rejeita quando o header está ausente", async () => {
    const { verifyLicenseSecret } = await loadLicense();
    expect(verifyLicenseSecret(null).ok).toBe(false);
    expect(verifyLicenseSecret(undefined).ok).toBe(false);
    expect(verifyLicenseSecret("").ok).toBe(false);
  });

  it("rejeita um segredo diferente do configurado", async () => {
    const { verifyLicenseSecret } = await loadLicense();
    const result = verifyLicenseSecret("segredo_errado_qualquer_coisa_1234567890");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("segredo inválido");
  });

  it("aceita o segredo exato", async () => {
    const { verifyLicenseSecret } = await loadLicense();
    const result = verifyLicenseSecret(
      "unit_test_license_secret_0123456789_abcdef_fixed",
    );
    expect(result.ok).toBe(true);
  });

  it("é resistente a timing (comprimentos diferentes retornam false sem crash)", async () => {
    const { verifyLicenseSecret } = await loadLicense();
    expect(verifyLicenseSecret("curto").ok).toBe(false);
    expect(verifyLicenseSecret("muito_mais_longo_do_que_o_configurado_de_fato").ok).toBe(false);
  });
});

describe("isActive", () => {
  it("ACTIVE sempre está ativo", async () => {
    const { isActive } = await loadLicense();
    expect(isActive({ status: "ACTIVE", plan: null, features: {}, reason: null, graceUntil: null, suspendedAt: null, lastHandshakeAt: null })).toBe(true);
  });

  it("SUSPENDED sem graça está bloqueado", async () => {
    const { isActive } = await loadLicense();
    expect(isActive({ status: "SUSPENDED", plan: null, features: {}, reason: null, graceUntil: null, suspendedAt: new Date(), lastHandshakeAt: null })).toBe(false);
  });

  it("SUSPENDED com graça futura ainda opera", async () => {
    const { isActive } = await loadLicense();
    const future = new Date(Date.now() + 7 * 24 * 3600_000);
    expect(isActive({ status: "SUSPENDED", plan: null, features: {}, reason: null, graceUntil: future, suspendedAt: new Date(), lastHandshakeAt: null })).toBe(true);
  });

  it("SUSPENDED com graça expirada está bloqueado", async () => {
    const { isActive } = await loadLicense();
    const past = new Date(Date.now() - 24 * 3600_000);
    expect(isActive({ status: "SUSPENDED", plan: null, features: {}, reason: null, graceUntil: past, suspendedAt: new Date(), lastHandshakeAt: null })).toBe(false);
  });

  it("CANCELLED está bloqueado (sem graça)", async () => {
    const { isActive } = await loadLicense();
    expect(isActive({ status: "CANCELLED", plan: null, features: {}, reason: null, graceUntil: null, suspendedAt: new Date(), lastHandshakeAt: null })).toBe(false);
  });
});

describe("isFeatureEnabled", () => {
  it("fail-open: feature desconhecida é true por default", async () => {
    const { isFeatureEnabled } = await loadLicense();
    expect(isFeatureEnabled({ status: "ACTIVE", plan: null, features: {}, reason: null, graceUntil: null, suspendedAt: null, lastHandshakeAt: null }, "qualquer_feature")).toBe(true);
  });

  it("respeita o valor quando declarado", async () => {
    const { isFeatureEnabled } = await loadLicense();
    const snap = { status: "ACTIVE" as const, plan: null, features: { nfe: false, whatsapp: true }, reason: null, graceUntil: null, suspendedAt: null, lastHandshakeAt: null };
    expect(isFeatureEnabled(snap, "nfe")).toBe(false);
    expect(isFeatureEnabled(snap, "whatsapp")).toBe(true);
  });

  it("defaultValue é respeitado quando passado", async () => {
    const { isFeatureEnabled } = await loadLicense();
    const snap = { status: "ACTIVE" as const, plan: null, features: {}, reason: null, graceUntil: null, suspendedAt: null, lastHandshakeAt: null };
    expect(isFeatureEnabled(snap, "x", false)).toBe(false);
  });
});
