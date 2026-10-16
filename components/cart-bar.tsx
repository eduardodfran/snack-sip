"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { fetchProducts } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Product } from "@/lib/types";

export function CartBar() {
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  const priceOf = (id: string) =>
    products.find((p) => p.id === id)?.price ?? 0;
  const total = items.reduce(
    (sum, item) => sum + priceOf(item.productId) * item.qty,
    0,
  );
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const label = `${count} ${count === 1 ? "item" : "items"}`;

  return (
    <>
      {/* Mobile: bottom bar above the bottom nav. */}
      <div className="fixed inset-x-0 bottom-14 z-30 px-3 pb-2 md:hidden">
        <Link
          href="/cart"
          className="mx-auto flex max-w-lg items-center justify-between border-2 border-ink bg-ink px-4 py-3 text-white shadow-[4px_4px_0_0_#ffce00]"
        >
          <span className="font-bold">{label}</span>
          <span className="flex items-center gap-3 font-stub font-bold">
            {peso(total)}
            <span className="bg-tarp px-2 py-0.5 text-ink">View cart</span>
          </span>
        </Link>
      </div>

      {/* Desktop: floating card with cart + direct checkout. */}
      <div className="fixed right-6 bottom-6 z-30 hidden w-72 md:block">
        <div className="border-2 border-ink bg-ink p-4 text-white shadow-[4px_4px_0_0_#ffce00]">
          <p className="font-bold">{label}</p>
          <p className="font-stub mt-0.5 text-2xl font-bold">
            {peso(total)}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/cart"
              className="flex-1 border-2 border-white bg-ink px-3 py-2 text-center text-sm font-bold"
            >
              View cart
            </Link>
            <Link
              href="/checkout"
              className="flex-1 border-2 border-ink bg-tarp px-3 py-2 text-center text-sm font-black text-ink"
            >
              Checkout →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
