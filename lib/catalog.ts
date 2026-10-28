import type { PickupSlot, Product } from './types'

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'siomai-beef',
    name: '6 pcs Beef Siomai',
    description: 'Six pieces of steamed beef siomai.',
    price: 35,
    stock: 100,
    active: true,
    art: 'siomai',
    imagePath: '/products/siomai-beef.jpg',
  },
  {
    id: 'siomai-chicken',
    name: '6 pcs Chicken Siomai',
    description: 'Six pieces of steamed chicken siomai.',
    price: 35,
    stock: 100,
    active: true,
    art: 'siomai',
    imagePath: '/products/siomai-chicken.jpg',
  },
  {
    id: 'beef-siomai-rice',
    name: 'Beef Siomai Rice',
    description: 'Beef siomai served over steamed rice.',
    price: 45,
    stock: 60,
    active: true,
    art: 'rice',
    imagePath: '/products/beef-siomai-rice.jpg',
  },
  {
    id: 'chicken-siomai-rice',
    name: 'Chicken Siomai Rice',
    description: 'Chicken siomai served over steamed rice.',
    price: 45,
    stock: 60,
    active: true,
    art: 'rice',
    imagePath: '/products/chicken-siomai-rice.jpg',
  },
  {
    id: 'big-chicken-siopao',
    name: 'Big Chicken Siopao',
    description: 'Large steamed bun with savory chicken filling.',
    price: 25,
    stock: 60,
    active: true,
    art: 'siopao',
    imagePath: '/products/big-chicken-siopao.jpg',
  },
  {
    id: 'small-siopao',
    name: 'Small Siopao',
    description: 'Small steamed bun with savory filling.',
    price: 15,
    stock: 60,
    active: true,
    art: 'siopao',
    imagePath: '/products/small-siopao.jpg',
  },
  {
    id: 'choco-mini-siopao',
    name: 'Choco Mini Siopao',
    description: 'Mini steamed bun with sweet chocolate filling.',
    price: 18,
    stock: 40,
    active: true,
    art: 'siopao-choco',
    imagePath: '/products/choco-mini-siopao.jpg',
  },
  {
    id: 'ube-mini-siopao',
    name: 'Ube Mini Siopao',
    description: 'Mini steamed bun with sweet ube filling.',
    price: 18,
    stock: 40,
    active: true,
    art: 'siopao-ube',
    imagePath: '/products/ube-mini-siopao.jpg',
  },
  {
    id: 'coke-mini',
    name: 'Coke Mini',
    description: 'Chilled Coca-Cola mini.',
    price: 16,
    stock: 80,
    active: true,
    art: 'coke',
    imagePath: '/products/coke-mini.png',
    fit: 'contain',
  },
  {
    id: 'wilkins-330ml',
    name: 'Wilkins 330ml',
    description: 'Purified drinking water, 330 ml.',
    price: 15,
    stock: 80,
    active: true,
    art: 'water',
    imagePath: '/products/water.png',
    fit: 'contain',
  },
]

// Single-day fair: Thursday, Oct 29, 2026 at 1:00 PM @ TCU Foodhall.
// Slot ids are legacy (kept stable because orders.pickup_slot_id references them);
// labels are what customers see.
export const PICKUP_SLOTS: PickupSlot[] = [
  { id: 'd1-am', label: 'Oct 29 · 9:00–11:00 AM' },
  { id: 'd1-pm', label: 'Oct 29 · 11:00 AM–1:00 PM' },
  { id: 'd2-am', label: 'Oct 29 · 1:00–3:00 PM' },
  { id: 'd2-pm', label: 'Oct 29 · 3:00–5:00 PM' },
]

export function availability(stock: number): 'available' | 'sold_out' {
  return stock <= 0 ? 'sold_out' : 'available'
}
