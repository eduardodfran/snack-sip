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
