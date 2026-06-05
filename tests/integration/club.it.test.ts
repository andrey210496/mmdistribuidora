import { beforeEach, describe, expect, it } from "vitest";
import { cleanDb } from "./db";
import { saveClubConfig, getClubConfig } from "@/lib/club";

beforeEach(cleanDb);

describe("Configuração do Clube (integração com DB)", () => {
  it("salva e lê a configuração (round-trip)", async () => {
    await saveClubConfig({
      active: false,
      annualPriceCents: 12990,
      name: "Clube X",
      tagline: "minha tagline",
      benefits: ["benefício A", "benefício B"],
    });

    const c = await getClubConfig();
    expect(c.active).toBe(false);
    expect(c.annualPriceCents).toBe(12990);
    expect(c.name).toBe("Clube X");
    expect(c.tagline).toBe("minha tagline");
    expect(c.benefits).toEqual(["benefício A", "benefício B"]);
  });

  it("retorna defaults quando não há config salva", async () => {
    const c = await getClubConfig();
    expect(c.active).toBe(true);
    expect(c.annualPriceCents).toBeGreaterThan(0);
    expect(c.benefits.length).toBeGreaterThan(0);
  });
});
