"use server";

import { prisma } from "@/lib/prisma";

export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  frequencyHours: number;
  maxDisplays: number;
  delaySeconds: number;
};

/**
 * Anúncios ativos e dentro da janela de datas, ordenados por prioridade.
 * As regras de quantas vezes/quando exibir são aplicadas no cliente
 * (localStorage), pois dependem do dispositivo do visitante.
 */
export async function fetchActiveAnnouncements(): Promise<PublicAnnouncement[]> {
  const now = new Date();
  const list = await prisma.announcement.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 5,
  });

  return list.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    imageUrl: a.imageUrl,
    ctaText: a.ctaText,
    ctaHref: a.ctaHref,
    frequencyHours: a.frequencyHours,
    maxDisplays: a.maxDisplays,
    delaySeconds: a.delaySeconds,
  }));
}
