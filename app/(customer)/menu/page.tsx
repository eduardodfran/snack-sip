"use client";

import { useEffect, useState } from "react";
import { FoodArt } from "@/components/food-art";
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
        if (!cancelled) setProducts(list);
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
    <div>
      <div className="border-b-2 border-ink bg-ink px-4 py-3 text-white">
        <p className="text-sm font-bold">
          Pre-order — pay now, claim at the booth with your QR.
        </p>
      </div>

      <h1 className="px-4 pt-6 pb-3 text-3xl font-black tracking-tight md:text-4xl">
        Menu
      </h1>

      <ul className="border-t-2 border-ink">
        {products.map((product) => {
          const qty = cart.qtyOf(product.id);
          const soldOut = product.stock <= 0 || !product.active;
          return (
            <li
              key={product.id}
              className={`flex items-start gap-3 border-b-2 border-ink px-4 py-4 ${
                soldOut ? "bg-white/60" : "bg-white"
              }`}
            >
              <div
                className={`relative h-16 w-16 shrink-0 border-2 border-ink bg-paper ${
                  soldOut ? "opacity-45" : ""
                }`}
              >
                <FoodArt art={product.art} className="h-full w-full" />
                {soldOut && (
                  <span className="absolute inset-0 flex items-center justify-center border-2 border-stamp bg-white/80 text-[10px] font-black text-stamp -rotate-6">
                    SOLD
                    <br />
                    OUT
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline">
                  <h2 className="font-bold leading-tight">{product.name}</h2>
                  <span className="leader" aria-hidden />
                  <span className="font-stub shrink-0 font-bold">
                    {peso(product.price)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-muted">
                  {product.description}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  {soldOut ? (
                    <span className="border-2 border-muted px-2 py-1 text-xs font-bold text-muted">
                      Sold out
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-leaf">
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
                          className="min-h-10 border-2 border-ink bg-tarp px-4 font-black active:translate-y-px"
                        >
                          Add
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-4 py-5 text-sm text-muted">
        Walk-in? You can also just drop by the booth — no website needed.
      </p>
    </div>
  );
}
