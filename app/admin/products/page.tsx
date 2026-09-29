"use client";

import { useEffect, useState } from "react";
import { FoodArt } from "@/components/food-art";
import { fetchProducts, updateProduct } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load products.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function applyPatch(id: string, patch: Partial<Product>) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
    try {
      await updateProduct(id, patch);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save that change.",
      );
      setProducts(await fetchProducts());
    }
  }

  function bumpStock(id: string, delta: number) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    void applyPatch(id, { stock: Math.max(0, product.stock + delta) });
  }

  function toggleActive(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    void applyPatch(id, { active: !product.active });
  }

  return (
    <div>
      <h1 className="text-2xl font-black">Products</h1>
      <p className="mt-1 text-sm text-muted">
        Availability updates both the website and the POS.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
        >
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {products.map((product) => (
          <li key={product.id} className="border-2 border-ink bg-white p-4">
            <div className="flex items-start gap-3">
              <FoodArt
                art={product.art}
                className="h-14 w-14 shrink-0 border-2 border-ink bg-paper p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <h2 className="font-bold">{product.name}</h2>
                  <span className="leader" aria-hidden />
                  <span className="font-stub font-bold">
                    {peso(product.price)}
                  </span>
                </div>
                <p className="text-xs text-muted">{product.description}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border-2 border-ink">
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, -1)}
                  disabled={product.stock <= 0}
                  aria-label={`Decrease stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-14 text-center font-stub font-bold">
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => bumpStock(product.id, 1)}
                  aria-label={`Increase stock of ${product.name}`}
                  className="h-10 w-10 text-xl font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleActive(product.id)}
                className={`border-2 border-ink px-3 py-2 text-sm font-bold ${
                  product.active ? "bg-leaf text-white" : "bg-white"
                }`}
              >
                {product.active ? "Available" : "Hidden"}
              </button>

              {product.stock <= 0 && (
                <span className="border-2 border-stamp px-2 py-1 text-xs font-bold text-stamp">
                  Sold out
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
