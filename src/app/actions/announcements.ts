"use server";

import { prisma } from "@/lib/prisma";
import type { AnnouncementAudience } from "@prisma/client";

export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  placement: string;
  frequencyHours: number;
  maxDisplays: number;
  delaySeconds: number;
};

function matchAudience(audience: AnnouncementAudience, isMember: boolean): boolean {
  if (audience === "NON_MEMBERS") return !isMember;
  if (audience === "MEMBERS") return isMember;
  return true; // ALL
}

/**
 * Anúncios ativos (pop-up passivo) para a loja, já filtrados pelo PÚBLICO
 * conforme o cliente logado é ou não membro. O placement CHECKOUT é tratado
 * à parte (interstitial na finalização). As regras de frequência/limite por
 * visitante são aplicadas no cliente (localStorage).
 */
export async function fetchActiveAnnouncements(): Promise<PublicAnnouncement[]> {
  const now = new Date();
  const isMember = false; // clube removido — ninguém é membro

  const list = await prisma.announcement.findMany({
    where: {
      active: true,
      placement: { in: ["STOREFRONT", "HOME", "CATALOG"] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return list
    .filter((a) => matchAudience(a.audience, isMember))
    .map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      imageUrl: a.imageUrl,
      ctaText: a.ctaText,
      ctaHref: a.ctaHref,
      placement: a.placement,
      frequencyHours: a.frequencyHours,
      maxDisplays: a.maxDisplays,
      delaySeconds: a.delaySeconds,
    }));
}

