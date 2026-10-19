import type { PickupSlot, Product } from "./types";

export const SEED_PRODUCTS: Product[] = [
  {
    id: "siomai",
    name: "Siomai",
    description: "Four pieces, steamed, with chili oil on the side.",
    price: 35,
    stock: 100,
    active: true,
    art: "siomai",
    imagePath: null,
  },
  {
    id: "siomai-rice",
    name: "Siomai Rice",
    description: "Steamed siomai over rice, drizzled with savory sauce.",
    price: 55,
    stock: 60,
    active: true,
    art: "rice",
    imagePath: null,
  },
  {
    id: "siopao-big-ube",
    name: "Siopao Big (Ube)",
    description: "Big steamed bun with sweet ube filling.",
    price: 35,
    stock: 30,
    active: true,
    art: "siopao-ube",
    imagePath: null,
  },
  {
    id: "siopao-big-choco",
    name: "Siopao Big (Chocolate)",
    description: "Big steamed bun with rich chocolate filling.",
    price: 35,
    stock: 30,
    active: true,
    art: "siopao-choco",
    imagePath: null,
  },
  {
    id: "siopao-mini-ube",
    name: "Siopao Mini (Ube)",
    description: "Bite-size steamed bun with sweet ube filling.",
    price: 20,
    stock: 30,
    active: true,
    art: "siopao-ube",
    imagePath: null,
  },
  {
    id: "siopao-mini-choco",
    name: "Siopao Mini (Chocolate)",
    description: "Bite-size steamed bun with rich chocolate filling.",
    price: 20,
    stock: 30,
    active: true,
    art: "siopao-choco",
    imagePath: null,
  },
  {
    id: "egg",
    name: "Add Egg",
    description: "Add a fried egg to any rice or siopao order.",
    price: 10,
    stock: 60,
    active: true,
    art: "egg",
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
