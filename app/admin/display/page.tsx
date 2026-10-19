"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  EarnSticker,
  MenuSlides,
  buildSlides,
} from "@/components/display/menu-slides";
import { QueuePanel } from "@/components/display/queue-panel";
import { DisplaySettingsModal } from "@/components/display/settings-modal";
import {
  DEFAULT_DISPLAY_SETTINGS,
  fetchDisplaySettings,
  fetchLiveQueue,
  fetchProducts,
  updateDisplaySettings,
} from "@/lib/data/api";
import type { DisplayQueueItem, DisplaySettings, Product } from "@/lib/types";

/**
 * Digital menu board + live queue for the booth monitor/TV.
 * Lives under /admin (auth guard + admin RLS apply), rendered as a
 * fixed full-viewport surface over the admin chrome.
 *
 * Queue refreshes every 5s, menu/settings every 15s — no manual input;
 * staff only ever changes order status or product data elsewhere.
 */
export default function AdminDisplayPage() {
  const [queue, setQueue] = useState<DisplayQueueItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS,
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [offline, setOffline] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      setQueue(await fetchLiveQueue());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  const refreshContent = useCallback(async () => {
    try {
      const [nextProducts, nextSettings] = await Promise.all([
        fetchProducts(),
        fetchDisplaySettings(),
      ]);
      setProducts(nextProducts);
      setSettings(nextSettings);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    void refreshQueue();
    const timer = window.setInterval(() => void refreshQueue(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshQueue]);

  useEffect(() => {
    void refreshContent();
    const timer = window.setInterval(() => void refreshContent(), 15000);
    return () => window.clearInterval(timer);
  }, [refreshContent]);

  // The board covers the page — stop the admin shell scrolling behind it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const slides = useMemo(
    () => buildSlides(products, settings),
    [products, settings],
  );
  const active =
    slides.length > 0
      ? ((slideIndex % slides.length) + slides.length) % slides.length
      : 0;

  useEffect(() => {
    if (modalOpen || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, settings.slideSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [modalOpen, slides.length, settings.slideSeconds]);

  async function saveSettings(patch: Partial<DisplaySettings>) {
    await updateDisplaySettings(patch);
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-80 rounded-[50%] bg-accent/70"
      />

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pt-4 md:px-7 md:pt-5">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo compact />
              <span className="hidden rounded-full border-2 border-brand bg-paper px-3.5 py-1 text-[11px] font-extrabold tracking-[0.14em] text-brand uppercase sm:inline">
                Today&apos;s open 9:00 AM – 5:00 PM
              </span>
            </div>
            <EarnSticker />
          </header>

          <div className="relative mt-4 min-h-0 flex-1">
            <MenuSlides slides={slides} active={active} />
          </div>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3 md:pb-4">
            <div className="flex items-center gap-1.5" aria-hidden>
              {slides.map((slide, i) => (
                <span
                  key={slide.key}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-7 bg-brand" : "w-2.5 bg-ink/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span
                title={offline ? "Reconnecting…" : "Live"}
                aria-hidden
                className={`h-2.5 w-2.5 rounded-full ${
                  offline ? "bg-muted" : "bg-fresh"
                }`}
              />
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-bold shadow-card hover:border-brand"
              >
                ⚙ Settings
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-bold shadow-card hover:border-brand"
              >
                ⤢ Fullscreen
              </button>
              <Link
                href="/admin"
                className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-card hover:bg-brand-deep"
              >
                Exit
              </Link>
            </div>
          </footer>
        </section>

        <QueuePanel queue={queue} />
      </div>

      {modalOpen && (
        <DisplaySettingsModal
          settings={settings}
          products={products}
          onSave={saveSettings}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
