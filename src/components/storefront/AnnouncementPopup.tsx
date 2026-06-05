"use client";

import { useEffect, useState } from "react";
import { X, Crown, ArrowRight } from "lucide-react";
import {
  fetchActiveAnnouncements,
  type PublicAnnouncement,
} from "@/app/actions/announcements";

type Tracking = { count: number; lastShownAt: number };

const STORAGE_PREFIX = "de_ann_";

function readTracking(id: string): Tracking {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return { count: 0, lastShownAt: 0 };
    const parsed = JSON.parse(raw);
    return {
      count: Number(parsed.count) || 0,
      lastShownAt: Number(parsed.lastShownAt) || 0,
    };
  } catch {
    return { count: 0, lastShownAt: 0 };
  }
}

function writeTracking(id: string, t: Tracking) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(t));
  } catch {
    // ignora (modo privado/sem storage)
  }
}

function isEligible(a: PublicAnnouncement, now: number): boolean {
  const t = readTracking(a.id);
  if (t.count >= a.maxDisplays) return false;
  const elapsedHours = (now - t.lastShownAt) / (1000 * 60 * 60);
  return elapsedHours >= a.frequencyHours;
}

// Pop-up de anúncio (ex.: divulgação do Clube). Conteúdo e regras vêm do admin;
// a frequência/limite por visitante é controlada via localStorage.
export function AnnouncementPopup() {
  const [current, setCurrent] = useState<PublicAnnouncement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let openTimer: ReturnType<typeof setTimeout> | undefined;

    // Não exibe na área administrativa nem no checkout
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/checkout")) return;

    (async () => {
      try {
        const list = await fetchActiveAnnouncements();
        if (cancelled || list.length === 0) return;

        const now = Date.now();
        const pick = list.find((a) => isEligible(a, now));
        if (!pick) return;

        openTimer = setTimeout(() => {
          if (cancelled) return;
          // Marca exibição
          const t = readTracking(pick.id);
          writeTracking(pick.id, { count: t.count + 1, lastShownAt: Date.now() });
          setCurrent(pick);
          setVisible(true);
        }, Math.max(0, pick.delaySeconds) * 1000);
      } catch {
        // silencioso
      }
    })();

    return () => {
      cancelled = true;
      if (openTimer) clearTimeout(openTimer);
    };
  }, []);

  // ESC fecha
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setVisible(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!current) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Overlay */}
      <div
        onClick={() => setVisible(false)}
        className="absolute inset-0 bg-espresso/60 backdrop-blur-sm"
        aria-hidden
      />

      {/* Card */}
      <div
        role="dialog"
        aria-label={current.title}
        className={`relative w-full max-w-md bg-cream rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-cocoa flex items-center justify-center shadow"
        >
          <X size={18} />
        </button>

        {current.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.imageUrl} alt="" className="w-full h-44 object-cover" />
        ) : (
          <div className="h-24 bg-gradient-to-br from-[#1a0703] via-cocoa to-[#1a0703] flex items-center justify-center">
            <Crown size={36} className="text-gold" fill="currentColor" />
          </div>
        )}

        <div className="p-6 text-center">
          <h3 className="font-display text-2xl font-bold text-cocoa mb-2">
            {current.title}
          </h3>
          <p className="text-cocoa/70 text-sm whitespace-pre-line">{current.body}</p>

          {current.ctaHref && (
            <a
              href={current.ctaHref}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#f4d8a8] via-[#d4a574] to-[#a07640] text-[#1a0703] font-bold px-6 py-3 rounded-full shadow-md hover:-translate-y-0.5 transition-all w-full"
            >
              {current.ctaText || "Saiba mais"}
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
