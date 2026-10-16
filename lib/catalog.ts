import type { PickupSlot, Product } from "./types";

export const SEED_PRODUCTS: Product[] = [
  {
    id: "saucer",
    name: "Flying Saucer",
    description: "Toasted ham and cheese sandwich, crusts sealed.",
    price: 25,
    stock: 60,
    active: true,
    art: "saucer",
    imagePath: null,
  },
  {
    id: "siomai",
    name: "Siomai",
    description: "Four pieces, steamed, with chili oil on the side.",
    price: 35,
    stock: 40,
    active: true,
    art: "siomai",
    imagePath: null,
  },
  {
    id: "siopao",
    name: "Siopao",
    description: "Fluffy steamed bun with asado filling.",
    price: 30,
    stock: 40,
    active: true,
    art: "siopao",
    imagePath: null,
  },
  {
    id: "waffle",
    name: "Waffle / Pancake",
    description: "Stacked, butter on top, syrup drizzle.",
    price: 30,
    stock: 35,
    active: true,
    art: "waffle",
    imagePath: null,
  },
  {
    id: "palamig",
    name: "Palamig with Gulaman",
    description: "Sealed cup, brown sugar syrup, sago and gulaman.",
    price: 25,
    stock: 50,
    active: true,
    art: "palamig",
    imagePath: null,
  },
];

// Single-day fair: Oct 20, 2026 @ TCU Foodhall.
// Slot ids are legacy (kept stable because orders.pickup_slot_id references them);
// labels are what customers see.
export const PICKUP_SLOTS: PickupSlot[] = [
  { id: "d1-am", label: "Oct 20 · 9:00–11:00 AM" },
  { id: "d1-pm", label: "Oct 20 · 11:00 AM–1:00 PM" },
  { id: "d2-am", label: "Oct 20 · 1:00–3:00 PM" },
  { id: "d2-pm", label: "Oct 20 · 3:00–5:00 PM" },
];

export function availability(stock: number): "available" | "sold_out" {
  return stock <= 0 ? "sold_out" : "available";
}
