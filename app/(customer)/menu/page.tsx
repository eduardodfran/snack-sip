"use client";

import { useEffect, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { fetchProducts } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const cart = useCart();

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list.filter((product) => product.active));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  return (
    <div className="px-4 pt-6 pb-4">
      <p className="text-xs font-bold tracking-[0.2em] text-brand">
        TECHNO FAIR · OCTOBER 20
      </p>
      <h1 className="font-display mt-1 text-3xl tracking-tight md:text-4xl">
        Menu
      </h1>
      <p className="mt-1 text-sm text-muted">
        Pre-order — pay now, claim at the booth with your QR.
      </p>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const qty = cart.qtyOf(product.id);
          const soldOut = product.stock <= 0;
          return (
            <li
              key={product.id}
              className={`rounded-2xl border border-line bg-paper p-4 shadow-card ${
                soldOut ? "opacity-70" : ""
              }`}
            >
              <div className="relative overflow-hidden rounded-xl bg-cream">
                <ProductArt
                  product={product}
                  className="h-36 w-full object-cover"
                />
                {soldOut && (
                  <span className="absolute top-2 left-2 rounded-full bg-stone-200 px-3 py-1 text-[11px] font-bold text-stone-500">
                    Sold out
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline">
                <h2 className="font-bold leading-tight">{product.name}</h2>
                <span className="leader" aria-hidden />
                <span className="shrink-0 font-bold text-brand">
                  {peso(product.price)}
                </span>
              </div>
              <p className="mt-0.5 text-sm leading-snug text-muted">
                {product.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                {soldOut ? (
                  <span className="text-xs font-bold text-stone-500">
                    Not available right now
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-bold text-fresh">
                      {product.stock} left
                    </span>
                    {qty > 0 ? (
                      <QtyStepper
                        label={product.name}
                        qty={qty}
                        max={product.stock}
                        onChange={(next) => cart.setQty(product.id, next)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => cart.add(product.id, 1)}
                        className="min-h-10 rounded-full bg-accent px-5 font-bold text-ink hover:bg-accent-deep"
                      >
                        Add
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="py-5 text-center text-sm text-muted">
        Walk-in? You can also just drop by the booth — no website needed.
      </p>
    </div>
  );
}
