import { describe, it, expect } from "vitest";
import {
  parseShortcuts,
  serializeShortcuts,
  eventToKey,
  alwaysFires,
  matchAction,
  DEFAULT_SHORTCUTS,
} from "@/lib/pdv-shortcuts";

describe("eventToKey", () => {
  it("tecla simples vira maiúscula", () => {
    expect(eventToKey({ key: "k" })).toBe("K");
  });
  it("combinação com Ctrl", () => {
    expect(eventToKey({ key: "Enter", ctrlKey: true })).toBe("Ctrl+Enter");
  });
  it("F-key fica como está", () => {
    expect(eventToKey({ key: "F4" })).toBe("F4");
  });
  it("só modificador retorna vazio", () => {
    expect(eventToKey({ key: "Control", ctrlKey: true })).toBe("");
  });
  it("espaço vira Space", () => {
    expect(eventToKey({ key: " " })).toBe("Space");
  });
});

describe("alwaysFires", () => {
  it("F-keys sempre disparam", () => {
    expect(alwaysFires("F2")).toBe(true);
    expect(alwaysFires("F12")).toBe(true);
  });
  it("Escape sempre dispara", () => {
    expect(alwaysFires("Escape")).toBe(true);
  });
  it("combinação com Ctrl/Alt sempre dispara", () => {
    expect(alwaysFires("Ctrl+K")).toBe(true);
    expect(alwaysFires("Alt+P")).toBe(true);
  });
  it("tecla simples NÃO dispara sempre", () => {
    expect(alwaysFires("K")).toBe(false);
  });
});

describe("matchAction", () => {
  it("F4 dispara finalize mesmo digitando", () => {
    expect(matchAction({ key: "F4" }, DEFAULT_SHORTCUTS, true)).toBe("finalize");
  });
  it("tecla simples não dispara enquanto digita", () => {
    const map = { ...DEFAULT_SHORTCUTS, finalize: "K" };
    expect(matchAction({ key: "k" }, map, true)).toBe(null);
    expect(matchAction({ key: "k" }, map, false)).toBe("finalize");
  });
  it("sem correspondência retorna null", () => {
    expect(matchAction({ key: "F9" }, DEFAULT_SHORTCUTS, false)).toBe(null);
  });
});

describe("parse/serialize", () => {
  it("vazio = defaults", () => {
    expect(parseShortcuts(null)).toEqual(DEFAULT_SHORTCUTS);
    expect(parseShortcuts("não-é-json")).toEqual(DEFAULT_SHORTCUTS);
  });
  it("mescla com defaults preservando o que falta", () => {
    const m = parseShortcuts(JSON.stringify({ finalize: "F9" }));
    expect(m.finalize).toBe("F9");
    expect(m.focusSearch).toBe(DEFAULT_SHORTCUTS.focusSearch);
  });
  it("round-trip", () => {
    const m = { ...DEFAULT_SHORTCUTS, credit: "Ctrl+F" };
    expect(parseShortcuts(serializeShortcuts(m))).toEqual(m);
  });
});
