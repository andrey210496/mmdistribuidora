import { describe, it, expect } from "vitest";
import {
  hasArea,
  isSuperAdmin,
  firstAllowedPath,
} from "@/lib/permissions";

const admin = { role: "ADMIN", permissions: [] as string[] };

describe("hasArea", () => {
  it("ADMIN tem acesso a qualquer área, mesmo sem permissions", () => {
    expect(hasArea(admin, "financeiro")).toBe(true);
    expect(hasArea(admin, "configuracoes")).toBe(true);
    expect(hasArea(admin, "dashboard")).toBe(true);
  });

  it("STAFF só acessa áreas explicitamente liberadas", () => {
    const staff = { role: "STAFF", permissions: ["pedidos", "produtos"] };
    expect(hasArea(staff, "pedidos")).toBe(true);
    expect(hasArea(staff, "produtos")).toBe(true);
    expect(hasArea(staff, "financeiro")).toBe(false);
    expect(hasArea(staff, "dashboard")).toBe(false);
  });

  it("STAFF sem nenhuma permissão não acessa nada", () => {
    const staff = { role: "STAFF", permissions: [] };
    expect(hasArea(staff, "pedidos")).toBe(false);
    expect(hasArea(staff, "dashboard")).toBe(false);
  });

  it("trata permissions não-array de forma segura (sem lançar)", () => {
    // simula dado corrompido vindo do banco
    const bad = { role: "STAFF", permissions: null as unknown as string[] };
    expect(hasArea(bad, "pedidos")).toBe(false);
  });

  it("role desconhecido (não ADMIN) usa a lista de permissions", () => {
    const viewer = { role: "VIEWER", permissions: ["clientes"] };
    expect(hasArea(viewer, "clientes")).toBe(true);
    expect(hasArea(viewer, "financeiro")).toBe(false);
  });
});

describe("isSuperAdmin", () => {
  it("retorna true apenas para ADMIN", () => {
    expect(isSuperAdmin({ role: "ADMIN", permissions: [] })).toBe(true);
  });

  it("retorna false para STAFF e outros cargos", () => {
    expect(isSuperAdmin({ role: "STAFF", permissions: ["pedidos"] })).toBe(false);
    expect(isSuperAdmin({ role: "VIEWER", permissions: [] })).toBe(false);
  });
});

describe("firstAllowedPath (anti-loop de redirecionamento)", () => {
  it("ADMIN sempre vai para /admin", () => {
    expect(firstAllowedPath(admin)).toBe("/admin");
  });

  it("STAFF com 'dashboard' vai para /admin", () => {
    const staff = { role: "STAFF", permissions: ["dashboard", "pedidos"] };
    expect(firstAllowedPath(staff)).toBe("/admin");
  });

  it("STAFF sem dashboard mas com 'pedidos' vai para /admin/pedidos", () => {
    const staff = { role: "STAFF", permissions: ["pedidos", "produtos"] };
    expect(firstAllowedPath(staff)).toBe("/admin/pedidos");
  });

  it("STAFF sem nada vai para /admin/sem-acesso (evita loop)", () => {
    const staff = { role: "STAFF", permissions: [] };
    expect(firstAllowedPath(staff)).toBe("/admin/sem-acesso");
  });

  it("respeita a ordem das áreas: primeira permitida em ADMIN_AREAS ganha", () => {
    // 'clientes' vem antes de 'financeiro' na ordem de ADMIN_AREAS
    const staff = { role: "STAFF", permissions: ["financeiro", "clientes"] };
    expect(firstAllowedPath(staff)).toBe("/admin/clientes");
  });

  it("permissão que não corresponde a nenhuma área conhecida cai em sem-acesso", () => {
    const staff = { role: "STAFF", permissions: ["inexistente"] };
    expect(firstAllowedPath(staff)).toBe("/admin/sem-acesso");
  });

  it("trata permissions não-array sem lançar (cai em sem-acesso)", () => {
    const bad = { role: "STAFF", permissions: undefined as unknown as string[] };
    expect(firstAllowedPath(bad)).toBe("/admin/sem-acesso");
  });
});
