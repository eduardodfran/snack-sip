"use client";

import { useEffect, useState } from "react";
import type { DisplayCombo, DisplaySettings, Product } from "@/lib/types";

/**
 * Display Management: edits the one-row display_settings record.
 * Featured pick, sold-out behavior, slide timing, and display-only
 * combo promos (ringed up manually at the POS).
 */
export function DisplaySettingsModal({
  settings,
  products,
  onSave,
  onClose,
}: {
  settings: DisplaySettings;
  products: Product[];
  onSave: (patch: Partial<DisplaySettings>) => Promise<void>;
  onClose: () => void;
}) {
  const [featuredId, setFeaturedId] = useState(settings.featuredProductId ?? "");
  const [soldOutMode, setSoldOutMode] = useState(settings.soldOutMode);
  const [slideSeconds, setSlideSeconds] = useState(String(settings.slideSeconds));
  const [combos, setCombos] = useState<DisplayCombo[]>(
    settings.combos.map((c) => ({ ...c, productIds: [...c.productIds] })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function updateCombo(index: number, patch: Partial<DisplayCombo>) {
    setCombos((prev) =>
      prev.map((combo, i) => (i === index ? { ...combo, ...patch } : combo)),
    );
  }

  function toggleComboProduct(index: number, productId: string) {
    setCombos((prev) =>
      prev.map((combo, i) => {
        if (i !== index) return combo;
        const on = combo.productIds.includes(productId);
        const productIds = on
          ? combo.productIds.filter((id) => id !== productId)
          : [...combo.productIds, productId].slice(-3);
        return { ...combo, productIds };
      }),
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const seconds = Number(slideSeconds);
    if (!Number.isFinite(seconds) || seconds < 4 || seconds > 20) {
      setError("Slide time must be between 4 and 20 seconds.");
      return;
    }
    if (combos.some((c) => !c.name.trim() || !Number.isFinite(c.price) || c.price < 0)) {
      setError("Every combo needs a name and a price.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({
        featuredProductId: featuredId || null,
        soldOutMode,
        slideSeconds: Math.round(seconds),
        combos: combos.map((c) => ({
          name: c.name.trim(),
          price: Math.round(c.price),
          productIds: c.productIds,
        })),
      });
      setSaved(true);
      window.setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-cocoa/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Display settings"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper p-5 shadow-pop"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-brand">Display settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-line px-3 py-1 text-sm font-bold text-muted hover:border-cocoa hover:text-cocoa"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label htmlFor="display-featured" className="block text-xs font-extrabold tracking-wider text-muted uppercase">
              Featured product (Slide 2)
            </label>
            <select
              id="display-featured"
              value={featuredId}
              onChange={(e) => setFeaturedId(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">Auto — first available product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.active ? " (hidden)" : p.stock <= 0 ? " (sold out)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-extrabold tracking-wider text-muted uppercase">
              Sold-out products
            </span>
            <div className="mt-1.5 flex gap-2">
              {(["badge", "hide"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSoldOutMode(mode)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${
                    soldOutMode === mode
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-paper text-muted hover:border-brand"
                  }`}
                >
                  {mode === "badge" ? "Show SOLD OUT badge" : "Hide sold-out items"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="display-seconds" className="block text-xs font-extrabold tracking-wider text-muted uppercase">
              Seconds per slide (4–20)
            </label>
            <input
              id="display-seconds"
              type="number"
              min={4}
              max={20}
              value={slideSeconds}
              onChange={(e) => setSlideSeconds(e.target.value)}
              className={`${inputClass} mt-1.5 w-28`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wider text-muted uppercase">
                Combo promos
              </span>
              <button
                type="button"
                onClick={() =>
                  setCombos((prev) => [...prev, { name: "", price: 0, productIds: [] }])
                }
                className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold shadow-card hover:border-brand"
              >
                + Add combo
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Display-only — staff rings combos up manually at the POS. Pictures
              come from the products you tick (up to 3).
            </p>
            <div className="mt-2 space-y-2">
              {combos.length === 0 && (
                <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
                  No combos yet — the board skips that slide until you add one.
                </p>
              )}
              {combos.map((combo, i) => (
                <div key={i} className="rounded-2xl border border-line bg-cream p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={combo.name}
                      onChange={(e) => updateCombo(i, { name: e.target.value })}
                      placeholder="Combo name"
                      aria-label="Combo name"
                      className={`${inputClass} min-w-0 flex-1`}
                    />
                    <div className="relative shrink-0">
                      <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-sm font-bold text-muted">
                        ₱
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={combo.price}
                        onChange={(e) =>
                          updateCombo(i, { price: Number(e.target.value) })
                        }
                        aria-label="Combo price"
                        className={`${inputClass} w-24 pl-6`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCombos((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove combo"
                      className="shrink-0 rounded-full border border-line px-2.5 py-1.5 text-sm font-bold text-muted hover:border-cocoa hover:text-cocoa"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {products.map((p) => {
                      const on = combo.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!p.active && !on}
                          onClick={() => toggleComboProduct(i, p.id)}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                            on
                              ? "bg-brand text-white"
                              : "border border-line bg-paper text-muted hover:border-brand"
                          }`}
                        >
                          {p.name}
                          {!p.active ? " (hidden)" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-ink">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2.5 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent px-6 py-2.5 font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-60"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
