"use client";

import { useEffect, useState } from "react";
import { FoodArt } from "@/components/food-art";
import type { ArtKey, Product } from "@/lib/types";

const ART_OPTIONS: { key: ArtKey; label: string }[] = [
  { key: "saucer", label: "Saucer" },
  { key: "siomai", label: "Siomai" },
  { key: "siopao", label: "Siopao" },
  { key: "waffle", label: "Waffle" },
  { key: "palamig", label: "Palamig" },
];

export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  art: ArtKey;
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
  const [art, setArt] = useState<ArtKey>(product?.art ?? "saucer");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that product.");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit product" : "Add product"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4"
    >
      <form
        onSubmit={submit}
        className="max-h-[92dvh] w-full overflow-y-auto border-2 border-ink bg-white shadow-[6px_6px_0_0_#1a1a1a] sm:max-w-md"
      >
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-ink bg-tarp px-4 py-3">
          <h2 className="font-black">{isEdit ? "Edit product" : "Add product"}</h2>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            aria-label="Close"
            className="h-8 w-8 border-2 border-ink bg-white text-lg font-black leading-none disabled:opacity-40"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error && (
            <p
              role="alert"
              className="border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
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
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-bold outline-none focus:bg-white"
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
              className="mt-1 w-full resize-none border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-white"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="pf-price" className="block text-xs font-bold text-muted">
                Price
              </label>
              <div className="mt-1 flex border-2 border-ink bg-paper">
                <span className="flex items-center border-r-2 border-ink px-2 font-stub font-bold">
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
                  className="w-full bg-transparent px-3 py-2 font-stub font-bold outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="pf-stock" className="block text-xs font-bold text-muted">
                Stock
              </label>
              <div className="mt-1 inline-flex w-full border-2 border-ink">
                <button
                  type="button"
                  onClick={() =>
                    setStock((s) => String(Math.max(0, (Number(s) || 0) - 1)))
                  }
                  aria-label="Decrease stock"
                  className="w-10 border-r-2 border-ink bg-paper text-lg font-bold"
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
                  className="w-full bg-transparent px-2 py-2 text-center font-stub font-bold outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    setStock((s) => String((Number(s) || 0) + 1))
                  }
                  aria-label="Increase stock"
                  className="w-10 border-l-2 border-ink bg-paper text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-bold text-muted">Picture</legend>
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
                    className={`border-2 border-ink p-1 text-center ${
                      selected ? "bg-tarp shadow-[3px_3px_0_0_#1a1a1a]" : "bg-white"
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
                className={`mt-1 border-2 border-ink px-3 py-2 text-sm font-bold ${
                  active ? "bg-leaf text-white" : "bg-white text-muted"
                }`}
              >
                {active ? "Available on the site" : "Hidden from the site"}
              </button>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t-2 border-ink bg-paper p-3">
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="border-2 border-ink bg-white px-4 py-3 font-bold disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 border-2 border-ink bg-tarp px-4 py-3 font-black disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
