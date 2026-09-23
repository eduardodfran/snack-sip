"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { peso } from "@/lib/format";
import { SEED_PRODUCTS } from "@/lib/catalog";

export function CartBar() {
  const { items } = useCart();
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => {
    const product = SEED_PRODUCTS.find((p) => p.id === item.productId);
    return sum + (product?.price ?? 0) * item.qty;
  }, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 px-3 pb-2 md:hidden">
      <Link
        href="/cart"
        className="mx-auto flex max-w-lg items-center justify-between border-2 border-ink bg-ink px-4 py-3 text-white shadow-[4px_4px_0_0_#ffce00]"
      >
        <span className="font-bold">
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="flex items-center gap-3 font-stub font-bold">
          {peso(total)}
          <span className="bg-tarp px-2 py-0.5 text-ink">View cart</span>
        </span>
      </Link>
    </div>
  );
}
