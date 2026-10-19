export type PaymentStatus =
  | "pending_payment"
  | "for_verification"
  | "verified"
  | "rejected";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderType = "pre_order" | "walk_in";

export type PaymentMethod = "gcash" | "cash";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  art: ArtKey;
  /** Storage path of an uploaded photo in the product-images bucket; the FoodArt drawing is the fallback. */
  imagePath: string | null;
};

export type ArtKey =
  | "saucer"
  | "siomai"
  | "siopao"
  | "waffle"
  | "palamig";

export type CartItem = {
  productId: string;
  qty: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerId: string | null;
  customerName: string | null;
  lines: OrderLine[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  /** Storage path in the payment-proofs bucket (private). */
  proofPath: string | null;
  /** Resolved signed URL — only filled in when an admin view needs it. */
  proofUrl: string | null;
  gcashReference: string | null;
  pickupSlotId: string | null;
  pickupLabel: string | null;
  queueNumber: number | null;
  claimCode: string;
  claimedAt: string | null;
  pointsAwarded: number;
  createdAt: string;
};

export type PickupSlot = {
  id: string;
  label: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  points: number;
};

export type Redemption = {
  id: string;
  profileId: string;
  label: string;
  redeemedAt: string;
};

export type LoyaltyEvent = {
  id: number;
  points: number;
  kind: "base" | "preorder_bonus";
  createdAt: string;
};

/** Display-only combo promo: shown on the board, rung up manually at POS. */
export type DisplayCombo = {
  name: string;
  price: number;
  /** Product ids used to render the combo's pictures (missing ids are skipped). */
  productIds: string[];
};

export type DisplaySettings = {
  /** Product spotlighted on Slide 2; null = first available product. */
  featuredProductId: string | null;
  soldOutMode: "badge" | "hide";
  slideSeconds: number;
  combos: DisplayCombo[];
};

/** Lean order row for the live queue on the Display board. */
export type DisplayQueueItem = {
  id: string;
  orderNumber: string;
  queueNumber: number | null;
  status: OrderStatus;
};
