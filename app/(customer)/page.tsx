"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { fetchPickupSlots, fetchProducts } from "@/lib/data/api";
import { PICKUP_SLOTS } from "@/lib/catalog";
import type { PickupSlot, Product } from "@/lib/types";

const WHY = [
  ["Fast pickup", "Already paid — just show your QR."],
  ["Reserved order", "Won't sell out — yours is held."],
  ["Bonus points", "+2 loyalty points per completed pre-order."],
] as const;

const STEPS = [
  ["Pick your items", "Add what you want from the menu."],
  ["Pay with GCash", "Upload your proof of payment."],
  ["Admin verifies", "We'll review your payment."],
  ["Claim with QR", "Show your Order QR at the booth."],
] as const;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<PickupSlot[]>(PICKUP_SLOTS);

  useEffect(() => {
    let cancelled = false;
    void fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {});
    void fetchPickupSlots()
      .then((list) => {
        if (!cancelled) setSlots(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const anyAvailable = products.some((p) => p.active && p.stock > 0);

  return (
    <div>
      <section className="border-b-2 border-ink px-4 pt-8 pb-8 md:pt-12 md:pb-10">
        <div className="grid items-end gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <p className="font-stub text-sm font-bold text-muted">
              Techno Fair · 2-day selling
            </p>
            <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl xl:text-6xl">
              Pre-order.
              <br />
              Pay GCash.
              <br />
              <span className="bg-tarp box-decoration-clone px-1.5">
                Claim with QR.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              Snack staples for the Techno Fair — order ahead so you don&apos;t
              have to wait in line. Flying saucer, siomai, siopao, waffle, and
              palamig with gulaman.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Link
                href="/menu"
                className="border-2 border-ink bg-tarp px-5 py-3.5 text-center text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:min-w-56"
              >
                {anyAvailable ? "Pre-order now" : "View menu"}
              </Link>
              <Link
                href="/orders"
                className="border-2 border-ink bg-white px-5 py-3 text-center font-bold md:min-w-56"
              >
                Track my order
              </Link>
            </div>
          </div>

          <ul
            aria-label="Menu highlights"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2"
          >
            {products.map((p) => (
              <li
                key={p.id}
                className={`border-2 border-ink bg-white p-3 text-center ${
                  p.stock <= 0 ? "opacity-50" : "shadow-[3px_3px_0_0_#1a1a1a]"
                }`}
              >
                <ProductArt product={p} className="mx-auto h-20 w-20" />
                <p className="mt-1 text-sm font-bold leading-tight">{p.name}</p>
                <p className="font-stub text-sm font-bold">
                  ₱{p.price}
                  {p.stock <= 0 && (
                    <span className="mt-1 block text-xs text-stamp">
                      Sold out
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b-2 border-ink px-4 py-7">
        <h2 className="text-2xl font-black md:text-3xl">Why pre-order?</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {WHY.map(([title, body]) => (
            <li
              key={title}
              className="flex items-start gap-3 border-2 border-ink bg-white p-3.5"
            >
              <span
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 border-2 border-ink bg-tarp"
              />
              <span>
                <strong className="font-bold">{title}</strong>
                <span className="block text-sm text-ink-soft">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b-2 border-ink px-4 py-7">
          <h2 className="text-2xl font-black md:text-3xl">
            How to pre-order
          </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-4 border-2 border-ink bg-white p-4">
              <span className="font-stub w-9 shrink-0 border-2 border-ink bg-ink px-1 py-1.5 text-center text-lg font-bold text-tarp">
                {i + 1}
              </span>
              <span>
                <strong className="font-bold">{title}</strong>
                <span className="block text-sm text-ink-soft">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="md:grid md:grid-cols-2">
        <section className="border-b-2 border-ink bg-ink px-4 py-7 text-white md:border-b-0 md:border-r-2">
          <h2 className="text-2xl font-black text-tarp">Pickup schedule</h2>
          <ul className="mt-3 space-y-2 font-stub text-sm">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-baseline justify-between gap-3 border-b border-dashed border-white/30 pb-2"
              >
                <span>{slot.label}</span>
                <span className="text-tarp">open</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/70">
            Slots may fill up — reserve yours before they&apos;re gone.
          </p>
        </section>

        <section className="px-4 py-7">
          <div className="border-2 border-ink bg-tarp p-5 md:h-full">
            <h2 className="text-xl font-black">Loyalty points</h2>
            <p className="mt-1.5 font-stub text-sm font-bold">
              ₱25 = 1 point · Pre-order = +2 bonus · 10 points = free flying
              saucer
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Points land after your order is completed. Scan your Account QR
              at the booth so they don&apos;t get lost.
            </p>
            <Link
              href="/loyalty"
              className="mt-4 inline-block border-2 border-ink bg-white px-4 py-2 text-sm font-bold"
            >
              See my points
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
