"use client";

import { useEffect, useState } from "react";
import { FoodArt } from "@/components/food-art";
import { productImageUrl } from "@/lib/data/api";
import type { ArtKey, Product } from "@/lib/types";

const ART_OPTIONS: { key: ArtKey; label: string }[] = [
  { key: "siomai", label: "Siomai" },
  { key: "rice", label: "Siomai Rice" },
  { key: "siopao", label: "Siopao" },
  { key: "siopao-ube", label: "Siopao (Ube)" },
  { key: "siopao-choco", label: "Siopao (Chocolate)" },
  { key: "egg", label: "Egg" },
  { key: "coke", label: "Cola can" },
  { key: "water", label: "Water bottle" },
  { key: "saucer", label: "Saucer (old)" },
  { key: "waffle", label: "Waffle (old)" },
  { key: "palamig", label: "Palamig (old)" },
];

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  art: ArtKey;
  /** Newly picked photo to upload — the page handles the actual upload. */
  photoFile: File | null;
  /** True when the existing photo should be deleted on save. */
  removePhoto: boolean;
};

export function ProductForm({
  product,
  onCancel,
  onSave,
}: {
  /** null = add mode */
  product: Product | null;
  onCancel: () => void;
  onSave: (values: ProductFormValues) => Promise<void>;
}) {
  const isEdit = product !== null;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [active, setActive] = useState(product?.active ?? true);
  const [art, setArt] = useState<ArtKey>(product?.art ?? "siomai");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onCancel]);

  function cancel() {
    if (saving) return;
    onCancel();
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (JPG, PNG, HEIC…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Photos must be under 8 MB.");
      return;
    }
    setError("");
    setRemovePhoto(false);
    setPhotoFile(file);
  }

  function clearPhoto() {
    if (photoFile) setPhotoFile(null);
    else setRemovePhoto(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const trimmed = name.trim();
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!trimmed) {
      setError("Give the product a name.");
      return;
    }
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setError("Price must be a whole number of pesos.");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError("Stock must be a whole number.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        name: trimmed,
        description: description.trim(),
        price: priceNum,
        stock: stockNum,
        active,
        art,
        photoFile,
        removePhoto,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that product.");
      setSaving(false);
    }
  }

  const dbPhotoUrl =
    product?.imagePath && !removePhoto ? productImageUrl(product.imagePath) : null;
  const photoPreview = objectUrl ?? dbPhotoUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit product" : "Add product"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
    >
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-2xl border border-line bg-paper shadow-pop sm:max-w-md"
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl bg-brand px-4 py-3 text-white">
          <h2 className="font-display text-lg">{isEdit ? "Edit product" : "Add product"}</h2>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-white/15 text-lg font-bold leading-none hover:bg-white/25 disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="pf-name" className="block text-xs font-bold text-muted">
              Name
            </label>
            <input
              id="pf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Turbo bun"
              className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 font-bold outline-none placeholder:text-muted/50 focus:border-brand"
            />
          </div>

          <div>
            <label
              htmlFor="pf-description"
              className="block text-xs font-bold text-muted"
            >
              Description
            </label>
            <textarea
              id="pf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's inside, one line"
              className="mt-1 w-full resize-none rounded-xl border border-line bg-cream px-3 py-2 text-sm outline-none placeholder:text-muted/50 focus:border-brand"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="pf-price" className="block text-xs font-bold text-muted">
                Price
              </label>
              <div className="mt-1 flex overflow-hidden rounded-xl border border-line bg-cream focus-within:border-brand">
                <span className="flex items-center border-r border-line px-3 font-bold text-brand">
                  ₱
                </span>
                <input
                  id="pf-price"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="pf-stock" className="block text-xs font-bold text-muted">
                Stock
              </label>
              <div className="mt-1 inline-flex w-full overflow-hidden rounded-xl border border-line bg-cream">
                <button
                  type="button"
                  onClick={() =>
                    setStock((s) => String(Math.max(0, (Number(s) || 0) - 1)))
                  }
                  aria-label="Decrease stock"
                  className="w-10 border-r border-line text-lg font-bold text-brand"
                >
                  −
                </button>
                <input
                  id="pf-stock"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-transparent px-2 py-2 text-center font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setStock((s) => String((Number(s) || 0) + 1))
                  }
                  aria-label="Increase stock"
                  className="w-10 border-l border-line text-lg font-bold text-brand"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-bold text-muted">Photo</legend>
            {photoPreview ? (
              <div className="mt-1 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- preview / Supabase storage URL */}
                <img
                  src={photoPreview}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl border border-line bg-cream object-cover"
                />
                <div className="flex flex-col gap-2">
                  <label className="inline-block cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-center text-sm font-bold hover:border-brand">
                    Replace photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onPhotoChange}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="rounded-full border border-cocoa/40 px-4 py-2 text-sm font-bold text-cocoa hover:bg-[#f7e9dc]"
                  >
                    {photoFile ? "Cancel photo" : "Remove photo"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <label className="inline-block cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold hover:border-brand">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-xs text-muted">
                  Optional — any size, resized to fit. Falls back to the
                  drawing below.
                </p>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold text-muted">
              Fallback drawing
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {ART_OPTIONS.map((option) => {
                const selected = option.key === art;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setArt(option.key)}
                    aria-pressed={selected}
                    aria-label={option.label}
                    className={`rounded-xl border p-1 text-center ${
                      selected
                        ? "border-accent-deep bg-[#fff3d1]"
                        : "border-line bg-paper"
                    }`}
                  >
                    <FoodArt art={option.key} className="h-10 w-10" />
                    <span className="block text-[10px] font-bold">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {isEdit && (
            <div>
              <span className="block text-xs font-bold text-muted">Status</span>
              <button
                type="button"
                onClick={() => setActive((a) => !a)}
                aria-pressed={active}
                className={`mt-1 rounded-full px-4 py-2 text-sm font-bold ${
                  active
                    ? "bg-fresh text-white"
                    : "border border-line bg-paper text-muted"
                }`}
              >
                {active ? "Available on the site" : "Hidden from the site"}
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-paper p-3">
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="rounded-full border border-line bg-paper px-5 py-3 font-bold hover:border-brand disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-accent px-4 py-3 font-bold text-ink hover:bg-accent-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
