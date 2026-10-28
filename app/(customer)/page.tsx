"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarIcon,
  GoodFoodBadge,
  MenuIcon,
  ReceiptIcon,
  Sparkles,
  Squiggle,
  StarBadgeIcon,
  Swirl,
  TaglineMarquee,
} from "@/components/hero-decor";
import { ProductArt } from "@/components/product-art";
import { fetchPickupSlots, fetchProducts } from "@/lib/data/api";
import { PICKUP_SLOTS } from "@/lib/catalog";
import type { PickupSlot, Product } from "@/lib/types";

const FEATURES = [
  { title: "View Menu", body: "See what's cooking today.", Icon: MenuIcon },
  { title: "Track Orders", body: "Follow your order live.", Icon: ReceiptIcon },
  {
    title: "Loyalty Points",
    body: "Earn points every order.",
    Icon: StarBadgeIcon,
  },
  {
    title: "Pickup Schedule",
    body: "Claim on your time.",
    Icon: CalendarIcon,
  },
] as const;

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
        if (cancelled || list.length === 0) return;
        setSlots(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const anyAvailable =
    products.length === 0 ||
    products.some((p) => p.active && p.stock > 0);
  const featured = products.filter((p) => p.active).slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-8 pb-8 md:pt-12 md:pb-10">
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute top-6 right-4 h-14 w-14 md:right-10"
        />
        <Swirl
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-2 hidden h-20 w-20 md:block"
        />
        <div className="relative grid items-center gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand">
              TECHNO FAIR 2026 · THURSDAY, OCT 29 · 1:00 PM
            </p>
            <h1 className="font-display mt-3 text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl xl:text-6xl">
              Pre-order.
              <br />
              Pay GCash.
              <br />
              <span className="relative inline-block text-brand">
                Claim with QR.
                <Squiggle
                  aria-hidden
                  className="absolute -bottom-2 left-0 h-3 w-full"
                />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Skip the line and get your favorite snacks ahead of time!
              Siomai, siomai rice, and siopao — big, mini, ube, or chocolate.
              Add an egg if you like.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Link
                href="/menu"
                className="rounded-full bg-accent px-6 py-3.5 text-center text-lg font-bold text-ink shadow-card hover:bg-accent-deep md:min-w-56"
              >
                {anyAvailable ? "Pre-order now →" : "View menu →"}
              </Link>
              <Link
                href="/orders"
                className="rounded-full border border-line bg-paper px-6 py-3.5 text-center text-lg font-bold text-ink shadow-card hover:border-brand md:min-w-56"
              >
                Track my order
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* HERO.png is a transparent cutout: no frame, food floats on cream. */}
            <div>
              <Image
                src="/HERO.png"
                alt="Snack &amp; Sip snacks illustration"
                width={1365}
                height={2048}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="aspect-square w-full object-cover object-[50%_45%] [filter:drop-shadow(0_20px_28px_rgba(98,58,39,0.3))] md:aspect-[5/4] md:object-[50%_51%]"
              />
            </div>
            <GoodFoodBadge className="absolute -bottom-10 -left-2 md:-left-6" />
          </div>
        </div>
      </section>

      <TaglineMarquee />

      <section className="px-4 py-7">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-3xl">Featured Snacks</h2>
          <Link
            href="/menu"
            className="text-sm font-bold text-brand underline underline-offset-4"
          >
            View all →
          </Link>
        </div>
        <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
          {featured.map((p) => (
            <li key={p.id} className="snap-start">
              <Link
                href="/menu"
                className="block w-36 rounded-2xl border border-line bg-paper p-3 text-center shadow-card hover:border-brand"
              >
                <ProductArt
                  product={p}
                  className="mx-auto h-20 w-20 rounded-xl"
                />
                <p className="mt-2 truncate text-sm font-bold leading-tight">
                  {p.name}
                </p>
                <p className="mt-0.5 text-sm font-bold text-brand">
                  ₱{p.price}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {FEATURES.map(({ title, body, Icon }) => (
            <li
              key={title}
              className="flex items-start gap-2.5 rounded-2xl border border-line bg-paper p-3.5 shadow-card"
            >
              <Icon className="h-7 w-7 shrink-0" />
              <span>
                <span className="block font-bold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 py-7">
        <h2 className="font-display text-2xl md:text-3xl">Why pre-order?</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {WHY.map(([title, body]) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-4 shadow-card"
            >
              <span
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-accent"
              />
              <span>
                <strong className="font-bold">{title}</strong>
                <span className="block text-sm text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 py-7">
        <h2 className="font-display text-2xl md:text-3xl">
          How to pre-order
        </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-line bg-paper p-4 shadow-card"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {i + 1}
              </span>
              <span>
                <strong className="font-bold">{title}</strong>
                <span className="block text-sm text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="px-4 pb-8 md:grid md:grid-cols-2 md:gap-4 md:px-4">
        <section className="rounded-2xl bg-brand px-5 py-6 text-white shadow-card">
          <h2 className="font-display text-2xl text-accent">
            Pickup schedule
          </h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="flex items-baseline justify-between gap-3 border-b border-dashed border-white/30 pb-2"
              >
                <span>{slot.label}</span>
                <span className="text-accent">open</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-white/70">
            Slots may fill up — reserve yours before they&apos;re gone.
          </p>
        </section>

        <section className="mt-4 rounded-2xl border border-line bg-paper p-5 shadow-card md:mt-0">
          <h2 className="font-display text-xl">Loyalty points</h2>
          <p className="mt-1.5 text-sm font-bold text-brand">
            ₱25 = 1 point · Pre-order = +2 bonus · 10 points = free snack
          </p>
          <p className="mt-2 text-sm text-muted">
            Points land after your order is completed. Scan your Account QR
            at the booth so they don&apos;t get lost.
          </p>
          <Link
            href="/loyalty"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-ink hover:bg-accent-deep"
          >
            See my points
          </Link>
        </section>
      </div>
    </div>
  );
}
