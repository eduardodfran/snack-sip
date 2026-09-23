import type {
  CartItem,
  Order,
  OrderLine,
  PaymentMethod,
  Product,
  Profile,
} from "@/lib/types";
import { LOYALTY } from "@/lib/constants";
import { SEED_PRODUCTS } from "@/lib/catalog";

const KEYS = {
  products: "snack-sip-products",
  orders: "snack-sip-orders",
  users: "snack-sip-users",
  session: "snack-sip-session",
  counters: "snack-sip-counters",
  redemptions: "snack-sip-redemptions",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function randomCode(len = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function getProducts(): Product[] {
  const stored = read<Product[] | null>(KEYS.products, null);
  if (stored && stored.length > 0) return stored;
  return SEED_PRODUCTS;
}

export function saveProducts(products: Product[]) {
  write(KEYS.products, products);
}

export function getOrders(): Order[] {
  return read<Order[]>(KEYS.orders, []);
}

function saveOrders(orders: Order[]) {
  write(KEYS.orders, orders);
}

function nextOrderNumber(type: "pre_order" | "walk_in"): string {
  const counters = read<{ po: number; wi: number }>(KEYS.counters, {
    po: 0,
    wi: 0,
  });
  if (type === "pre_order") {
    counters.po += 1;
    write(KEYS.counters, counters);
    return `PO-${String(counters.po).padStart(3, "0")}`;
  }
  counters.wi += 1;
  write(KEYS.counters, counters);
  return `WI-${String(counters.wi).padStart(3, "0")}`;
}

export function totalOf(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function buildLines(items: CartItem[], products: Product[]): OrderLine[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error("Product not found");
    return {
      productId: product.id,
      name: product.name,
      qty: item.qty,
      unitPrice: product.price,
    };
  });
}

export type CreateOrderInput = {
  type: "pre_order" | "walk_in";
  customerId: string | null;
  customerName: string | null;
  lines: OrderLine[];
  paymentMethod: PaymentMethod;
  pickupSlotId: string | null;
  pickupLabel: string | null;
};

export function createOrder(input: CreateOrderInput): Order {
  const products = getProducts();

  for (const line of input.lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product || product.stock < line.qty) {
      throw new Error(`${line.name} is sold out`);
    }
  }

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: nextOrderNumber(input.type),
    type: input.type,
    customerId: input.customerId,
    customerName: input.customerName,
    lines: input.lines,
    total: totalOf(input.lines),
    paymentMethod: input.paymentMethod,
    paymentStatus:
      input.type === "walk_in"
        ? "verified"
        : "pending_payment",
    status: input.type === "walk_in" ? "confirmed" : "pending",
    proofUrl: null,
    gcashReference: null,
    pickupSlotId: input.pickupSlotId,
    pickupLabel: input.pickupLabel,
    queueNumber: null,
    claimCode: randomCode(),
    claimedAt: null,
    pointsAwarded: 0,
    createdAt: new Date().toISOString(),
  };

  if (input.type === "walk_in") {
    consumeStock(input.lines, products);
    order.queueNumber = nextQueueNumber();
  }

  const orders = getOrders();
  saveOrders([order, ...orders]);
  return order;
}

function nextQueueNumber(): number {
  const orders = getOrders();
  const max = orders.reduce(
    (m, o) => Math.max(m, o.queueNumber ?? 0),
    0,
  );
  return max + 1;
}

function consumeStock(lines: OrderLine[], products: Product[]) {
  const updated = products.map((p) => {
    const line = lines.find((l) => l.productId === p.id);
    return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
  });
  saveProducts(updated);
}

export function submitProof(
  orderId: string,
  proofDataUrl: string,
  reference: string,
) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  order.proofUrl = proofDataUrl;
  order.gcashReference = reference.trim() || null;
  order.paymentStatus = "for_verification";
  saveOrders(orders);
}

export function verifyPayment(orderId: string, approve: boolean) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");

  if (approve) {
    order.paymentStatus = "verified";
    order.status = "confirmed";
    order.queueNumber = nextQueueNumber();
    const products = getProducts();
    consumeStock(order.lines, products);
  } else {
    order.paymentStatus = "rejected";
  }
  saveOrders(orders);
}

export function setStatus(orderId: string, status: Order["status"]) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  order.status = status;

  if (status === "completed" && order.pointsAwarded === 0) {
    awardPoints(order);
  }
  saveOrders(orders);
}

function awardPoints(order: Order) {
  const base = Math.floor(order.total / LOYALTY.pesosPerPoint);
  const bonus = order.type === "pre_order" ? LOYALTY.preOrderBonus : 0;
  const points = base + bonus;
  order.pointsAwarded = points;

  if (order.customerId && points > 0) {
    const users = read<Profile[]>(KEYS.users, []);
    const user = users.find((u) => u.id === order.customerId);
    if (user) {
      user.points += points;
      write(KEYS.users, users);
    }
  }
}

export type ClaimResult =
  | { ok: true; order: Order }
  | { ok: false; reason: string };

export function claimOrder(code: string): ClaimResult {
  const normalized = code.trim().toUpperCase();
  const orders = getOrders();
  const order = orders.find((o) => o.claimCode === normalized);

  if (!order) return { ok: false, reason: "No order matches that code." };
  if (order.status === "completed")
    return { ok: false, reason: "Already claimed — this QR was used." };
  if (order.status === "cancelled")
    return { ok: false, reason: "This order was cancelled." };
  if (order.status !== "ready")
    return {
      ok: false,
      reason: `Not ready yet — current status: ${order.status}.`,
    };

  order.status = "completed";
  order.claimedAt = new Date().toISOString();
  if (order.pointsAwarded === 0) awardPoints(order);
  saveOrders(orders);
  return { ok: true, order };
}

export function myOrders(customerId: string): Order[] {
  return getOrders().filter((o) => o.customerId === customerId);
}

export function findOrder(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export type SignupInput = { name: string; email: string; password: string };

export function signup(input: SignupInput): Profile {
  const users = read<Profile[]>(KEYS.users, []);
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new Error("An account with that email already exists.");
  }
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    role: email.startsWith("admin@") ? "admin" : "customer",
    points: 0,
  };
  users.push(profile);
  write(KEYS.users, users);
  write(KEYS.session, { userId: profile.id });
  return profile;
}

export function login(email: string, password: string): Profile {
  const users = read<Profile[]>(KEYS.users, []);
  const profile = users.find(
    (u) => u.email === email.trim().toLowerCase(),
  );
  if (!profile) throw new Error("No account found for that email.");
  if (!password) throw new Error("Enter your password.");
  write(KEYS.session, { userId: profile.id });
  return profile;
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(KEYS.session);
}

export const DEMO_ADMIN_EMAIL = "admin@snacksip.local";

export function ensureDemoAdmin() {
  const users = read<Profile[]>(KEYS.users, []);
  if (users.some((u) => u.role === "admin")) return;
  users.push({
    id: crypto.randomUUID(),
    name: "Booth Admin",
    email: DEMO_ADMIN_EMAIL,
    role: "admin",
    points: 0,
  });
  write(KEYS.users, users);
}

export function currentProfile(): Profile | null {
  const session = read<{ userId: string } | null>(KEYS.session, null);
  if (!session) return null;
  const users = read<Profile[]>(KEYS.users, []);
  return users.find((u) => u.id === session.userId) ?? null;
}

export function getProfile(id: string): Profile | null {
  return read<Profile[]>(KEYS.users, []).find((u) => u.id === id) ?? null;
}

export type Redemption = {
  id: string;
  profileId: string;
  label: string;
  redeemedAt: string;
};

export function myRedemptions(profileId: string): Redemption[] {
  return read<Redemption[]>(KEYS.redemptions, []).filter(
    (r) => r.profileId === profileId,
  );
}

export function redeemReward(profileId: string): Redemption {
  const users = read<Profile[]>(KEYS.users, []);
  const user = users.find((u) => u.id === profileId);
  if (!user) throw new Error("Account not found.");
  if (user.points < LOYALTY.rewardAt) {
    throw new Error("Not enough points yet.");
  }
  user.points -= LOYALTY.rewardAt;
  write(KEYS.users, users);

  const redemption: Redemption = {
    id: crypto.randomUUID(),
    profileId,
    label: LOYALTY.rewardLabel,
    redeemedAt: new Date().toISOString(),
  };
  const all = read<Redemption[]>(KEYS.redemptions, []);
  write(KEYS.redemptions, [redemption, ...all]);
  return redemption;
}

export function resizeImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not an image."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
