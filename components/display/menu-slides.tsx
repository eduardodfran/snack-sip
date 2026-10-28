"use client";

import type { ReactNode } from "react";
import { ProductArt } from "@/components/product-art";
import {
  ReceiptIcon,
  Squiggle,
  StarBadgeIcon,
  StarburstShape,
} from "@/components/hero-decor";
import { peso } from "@/lib/format";
import type { DisplayCombo, DisplaySettings, Product } from "@/lib/types";

/**
 * The Display board's rotating menu slides (80% side). Slides are built
 * from the live product list + admin settings; anything unavailable is
 * either badged or hidden per settings.soldOutMode.
 */

export type Slide = {
  key: string;
  node: ReactNode;
};

/** Admin-hidden (soft-deleted) products never appear on the board. */
function isHidden(product: Product): boolean {
  return !product.active;
}

/** Badge condition for rendered tiles — hidden items never reach them. */
function isSoldOut(product: Product): boolean {
  return product.stock <= 0;
}

/** Drinks get their own column on the choices slide. */
function isDrink(product: Product): boolean {
  return (
    product.art === "palamig" ||
    product.art === "coke" ||
    product.art === "water"
  );
}

export function buildSlides(
  products: Product[],
  settings: DisplaySettings,
): Slide[] {
  const active = products.filter((p) => !isHidden(p));
  const hideSoldOut = settings.soldOutMode === "hide";
  const shown = hideSoldOut ? active.filter((p) => !isSoldOut(p)) : active;
  const available = active.filter((p) => !isSoldOut(p));

  const slides: Slide[] = [];

  if (shown.length > 0) {
    slides.push({ key: "favorites", node: <FavoritesSlide products={shown} /> });
  }

  const picked = settings.featuredProductId
    ? (active.find((p) => p.id === settings.featuredProductId) ?? null)
    : null;
  const featured =
    picked && !(hideSoldOut && isSoldOut(picked))
      ? picked
      : (available[0] ?? shown[0] ?? null);
  if (featured) {
    slides.push({ key: "featured", node: <FeaturedSlide product={featured} /> });
  }

  if (shown.length > 0) {
    slides.push({ key: "choices", node: <ChoicesSlide products={shown} /> });
  }

  const activeIds = new Set(active.map((p) => p.id));
  const liveCombos = settings.combos.filter((combo) =>
    combo.productIds.every((id) => activeIds.has(id)),
  );
  if (liveCombos.length > 0) {
    slides.push({
      key: "combos",
      node: <CombosSlide combos={liveCombos} products={active} />,
    });
  }

  slides.push({ key: "earn", node: <EarnSlide products={active} /> });

  return slides;
}

/** Crossfade wrapper — every slide is mounted, only the active one shows. */
export function MenuSlides({ slides, active }: { slides: Slide[]; active: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide.key}
          aria-hidden={i !== active}
          className={`absolute inset-0 flex flex-col overflow-hidden transition-all duration-700 ease-in-out ${
            i === active
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-8 opacity-0"
          }`}
        >
          {slide.node}
        </div>
      ))}
    </div>
  );
}

export function EarnSticker({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative h-16 w-16 shrink-0 md:h-24 md:w-24 ${className}`}
    >
      <StarburstShape className="absolute inset-0 h-full w-full -rotate-12" />
      <p className="absolute inset-0 flex -rotate-12 flex-col items-center justify-center px-4 text-center text-[9px] leading-tight font-extrabold text-cocoa md:text-[11px]">
        <span>EARN &amp;</span>
        <span>REDEEM</span>
        <span>POINTS!</span>
      </p>
    </div>
  );
}

function SlideTitle({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 inline-block shrink-0">
      <h2 className="font-display text-[clamp(1.5rem,3vw,3rem)] leading-[1.05] text-brand uppercase">
        {children}
      </h2>
      <Squiggle className="mt-1.5 block h-3 w-full" />
    </div>
  );
}

/**
 * Image height tiers sized by row count so few products = big cards that
 * fill the slide (the SVG art scales with the box; the base tier always
 * applies below lg, where grids gain rows).
 */
type TileSize = "tall" | "mid" | "std";

const TILE_IMAGE_H: Record<TileSize, string> = {
  tall: "h-[clamp(100px,14vh,165px)] lg:h-[clamp(200px,32vh,360px)]",
  mid: "h-[clamp(100px,14vh,165px)] lg:h-[clamp(150px,22vh,240px)]",
  std: "h-[clamp(100px,14vh,165px)]",
};

function sizeForRows(rows: number): TileSize {
  return rows <= 1 ? "tall" : rows === 2 ? "mid" : "std";
}

function ProductTile({
  product,
  pill = false,
  size = "std",
}: {
  product: Product;
  pill?: boolean;
  size?: TileSize;
}) {
  const soldOut = isSoldOut(product);
  return (
    <div className="relative min-w-0 rounded-2xl border border-line bg-paper p-2.5 shadow-card">
      {soldOut && (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
          SOLD OUT
        </span>
      )}
      <div
        className={`${TILE_IMAGE_H[size]} overflow-hidden rounded-xl bg-cream ${
          soldOut ? "grayscale" : ""
        }`}
      >
        <ProductArt product={product} className="h-full w-full" />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-tight font-bold text-ink lg:text-base">
        {product.name}
      </p>
      {pill ? (
        <span className="mt-1.5 inline-block rounded-full bg-accent px-3 py-0.5 font-display text-base text-ink">
          {peso(product.price)}
        </span>
      ) : (
        <p className="mt-0.5 font-display text-lg text-brand lg:text-xl">
          {peso(product.price)}
        </p>
      )}
    </div>
  );
}

function FavoritesSlide({ products }: { products: Product[] }) {
  const shown = products.slice(0, 15);
  const size = sizeForRows(Math.ceil(shown.length / 5));
  return (
    <div className="flex h-full flex-col">
      <div>
        <SlideTitle>Our Snack Favorites</SlideTitle>
      </div>
      <div className="mt-5 grid min-h-0 flex-1 auto-rows-min content-center grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {shown.map((product) => (
          <ProductTile key={product.id} product={product} size={size} />
        ))}
      </div>
    </div>
  );
}

function FeaturedSlide({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);
  return (
    <div className="flex h-full items-center gap-6 lg:gap-10">
      <div className="min-w-0 flex-1">
        <SlideTitle>{product.name}</SlideTitle>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-cocoa lg:text-lg">
          {product.description}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-accent px-6 py-1.5 font-display text-2xl text-ink shadow-card lg:text-3xl">
            {peso(product.price)}
          </span>
          {soldOut && (
            <span className="rounded-full bg-muted px-4 py-2 text-xs font-extrabold tracking-wider text-white lg:text-sm">
              SOLD OUT
            </span>
          )}
        </div>
      </div>
      <div
        className={`hidden aspect-square h-[74%] shrink-0 overflow-hidden rounded-3xl border border-line bg-cream md:block ${
          soldOut ? "grayscale" : ""
        }`}
      >
        <ProductArt product={product} className="h-full w-full scale-105" />
      </div>
    </div>
  );
}

function ChoicesSlide({ products }: { products: Product[] }) {
  const groups = [
    {
      label: "Snacks",
      items: products.filter((p) => !isDrink(p)).slice(0, 9),
    },
    {
      label: "Drinks",
      items: products.filter(isDrink).slice(0, 4),
    },
  ].filter((group) => group.items.length > 0);
  const twoGroups = groups.length > 1;

  return (
    <div className="flex h-full flex-col">
      <div>
        <SlideTitle>Snack Choices</SlideTitle>
      </div>
      <div
        className={`mt-5 grid min-h-0 flex-1 content-center gap-4 lg:gap-6 ${
          twoGroups ? "md:grid-cols-[3fr_2fr]" : ""
        }`}
      >
        {groups.map((group) => {
          const cols = twoGroups
            ? group.items.length > 3
              ? 3
              : 2
            : 4;
          const size = sizeForRows(Math.ceil(group.items.length / cols));
          const gridCols = twoGroups
            ? group.items.length > 3
              ? "grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2"
            : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
          return (
            <div key={group.label} className="min-h-0 min-w-0">
              <h3 className="font-display text-lg text-brand uppercase lg:text-2xl">
                {group.label}
              </h3>
              <Squiggle className="mt-1 h-2.5 w-28" />
              <div className={`mt-3 grid gap-3 ${gridCols} lg:gap-4`}>
                {group.items.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    pill
                    size={size}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CombosSlide({
  combos,
  products,
}: {
  combos: DisplayCombo[];
  products: Product[];
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return (
    <div className="flex h-full flex-col">
      <div>
        <SlideTitle>Snack Combos</SlideTitle>
      </div>
      <p className="mt-2 shrink-0 text-sm font-extrabold text-cocoa lg:text-lg">
        Great food + drink for less!
      </p>
      <div className="mt-5 grid min-h-0 flex-1 content-center grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {combos.slice(0, 6).map((combo, i) => (
          <div
            key={`${combo.name}-${i}`}
            className="flex flex-col items-center rounded-3xl border border-line bg-paper p-4 text-center shadow-card"
          >
            <div className="flex h-20 items-center justify-center gap-2 lg:h-24">
              {combo.productIds.slice(0, 3).map((id) => {
                const product = byId.get(id);
                if (!product) return null;
                return (
                  <div
                    key={id}
                    className="h-16 w-16 overflow-hidden rounded-2xl bg-cream lg:h-20 lg:w-20"
                  >
                    <ProductArt product={product} className="h-full w-full" />
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm leading-snug font-bold text-ink lg:text-base">
              {combo.name}
            </p>
            <span className="mt-2 rounded-full bg-accent px-4 py-1 font-display text-lg text-ink">
              {peso(combo.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3.5" y="10.5" width="17" height="9.5" rx="2" stroke="#0d4fa3" strokeWidth="2" />
      <path d="M3.5 13.5 H20.5 M12 10.5 V20" stroke="#0d4fa3" strokeWidth="2" />
      <path
        d="M12 10.5 C12 10.5 10.5 5.5 8 6.5 C6 7.3 7.5 10.5 12 10.5 Z M12 10.5 C12 10.5 13.5 5.5 16 6.5 C18 7.3 16.5 10.5 12 10.5 Z"
        stroke="#0d4fa3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EarnSlide({ products }: { products: Product[] }) {
  const drink = products.find(isDrink) ?? products[0] ?? null;
  const steps = [
    { icon: <ReceiptIcon className="h-7 w-7 lg:h-9 lg:w-9" />, label: "Order" },
    { icon: <StarBadgeIcon className="h-7 w-7 lg:h-9 lg:w-9" />, label: "Earn Points" },
    { icon: <GiftIcon className="h-7 w-7 lg:h-9 lg:w-9" />, label: "Get Rewards" },
  ];
  return (
    <div className="flex h-full items-center gap-6 lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h2 className="font-display text-[clamp(2rem,4.5vw,4.5rem)] leading-[0.95] text-brand uppercase">
          Snack.
          <br />
          Sip.
          <br />
          Earn.
        </h2>
        <p className="mt-3 text-lg font-extrabold text-cocoa lg:text-2xl">
          Taste. Earn. Repeat!
        </p>
        <div className="mt-5 flex max-w-xl items-stretch gap-2 rounded-3xl border border-line bg-paper p-3 shadow-card lg:gap-3 lg:p-4">
          {steps.map((step, i) => (
            <div key={step.label} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
                {step.icon}
                <span className="text-[11px] leading-tight font-extrabold text-ink lg:text-sm">
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span aria-hidden className="font-display text-lg text-accent">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {drink && (
        <div className="hidden aspect-square h-[76%] shrink-0 overflow-hidden rounded-3xl border border-line bg-cream md:block">
          <ProductArt product={drink} className="h-full w-full scale-105" />
        </div>
      )}
    </div>
  );
}
