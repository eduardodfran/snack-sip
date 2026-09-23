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
  },
  {
    id: "siomai",
    name: "Siomai",
    description: "Four pieces, steamed, with chili oil on the side.",
    price: 35,
    stock: 40,
    active: true,
    art: "siomai",
  },
  {
    id: "siopao",
    name: "Siopao",
    description: "Fluffy steamed bun with asado filling.",
    price: 30,
    stock: 40,
    active: true,
    art: "siopao",
  },
  {
    id: "waffle",
    name: "Waffle / Pancake",
    description: "Stacked, butter on top, syrup drizzle.",
    price: 30,
    stock: 35,
    active: true,
    art: "waffle",
  },
  {
    id: "palamig",
    name: "Palamig with Gulaman",
    description: "Sealed cup, brown sugar syrup, sago and gulaman.",
    price: 25,
    stock: 50,
    active: true,
    art: "palamig",
  },
];

export const PICKUP_SLOTS: PickupSlot[] = [
  { id: "d1-am", label: "Day 1 · 9:00–11:00 AM" },
  { id: "d1-pm", label: "Day 1 · 1:00–3:00 PM" },
  { id: "d2-am", label: "Day 2 · 9:00–11:00 AM" },
  { id: "d2-pm", label: "Day 2 · 1:00–3:00 PM" },
];

export function availability(stock: number): "available" | "sold_out" {
  return stock <= 0 ? "sold_out" : "available";
}
