import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { PICKUP_SLOTS, SEED_PRODUCTS } from "@/lib/catalog";
import { dataUrlToBlob, resizeImage } from "@/lib/image";
import type {
  Order,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  PickupSlot,
  Product,
  Profile,
  Redemption,
} from "@/lib/types";

/**
 * All reads/writes against Supabase. Replaces the old localStorage store.
 * Security lives in Postgres: RLS policies + SECURITY DEFINER functions.
 *
 * When NEXT_PUBLIC_SUPABASE_* env vars are missing the site still renders
 * (seed catalog, empty lists) so the UI stays browsable before keys land.
 */

const NOT_CONFIGURED =
  "Supabase is not configured yet. Add the keys to .env.local and restart the dev server.";

function db() {
  if (!isSupabaseConfigured()) throw new Error(NOT_CONFIGURED);
  return getSupabase();
}

// ---------------------------------------------------------------- rows

type OrderLineRow = {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  type: Order["type"];
  customer_id: string | null;
  customer_name: string | null;
  total: number;
  payment_method: Order["paymentMethod"];
  payment_status: Order["paymentStatus"];
  status: Order["status"];
  proof_path: string | null;
  gcash_reference: string | null;
  pickup_slot_id: string | null;
  pickup_label: string | null;
  queue_number: number | null;
  claim_code: string;
  claimed_at: string | null;
  points_awarded: number;
  created_at: string;
  order_lines?: OrderLineRow[];
};

const ORDER_SELECT = "*, order_lines(*)";

function mapLine(row: OrderLineRow): OrderLine {
  return {
    productId: row.product_id,
    name: row.name,
    qty: row.qty,
    unitPrice: row.unit_price,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    type: row.type,
    customerId: row.customer_id,
    customerName: row.customer_name,
    lines: (row.order_lines ?? []).map(mapLine),
    total: row.total,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    proofPath: row.proof_path,
    proofUrl: null,
    gcashReference: row.gcash_reference,
    pickupSlotId: row.pickup_slot_id,
    pickupLabel: row.pickup_label,
    queueNumber: row.queue_number,
    claimCode: row.claim_code,
    claimedAt: row.claimed_at,
    pointsAwarded: row.points_awarded,
    createdAt: row.created_at,
  };
}

function mapProduct(row: {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  art: Product["art"];
  image_path?: string | null;
}): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    active: row.active,
    art: row.art,
    imagePath: row.image_path ?? null,
  };
}

const CATALOG_ORDER = SEED_PRODUCTS.map((p) => p.id);

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const ai = CATALOG_ORDER.indexOf(a.id);
    const bi = CATALOG_ORDER.indexOf(b.id);
    return (
      (ai === -1 ? CATALOG_ORDER.length : ai) -
      (bi === -1 ? CATALOG_ORDER.length : bi)
    );
  });
}

// ---------------------------------------------------------------- auth

function authErrorMessage(error: {
  code?: string;
  message: string;
  status?: number;
}): string {
  const code = error.code ?? "";
  const message = error.message ?? "";

  if (code === "invalid_credentials" || error.status === 400 || error.status === 401) {
    return "Email or password is incorrect.";
  }
  if (
    code === "user_already_exists" ||
    code === "identity_already_exists" ||
    /already (been )?registered|already exists/i.test(message)
  ) {
    return "An account with that email already exists.";
  }
  if (code === "weak_password" || /password should be/i.test(message)) {
    return "Use at least 6 characters for your password.";
  }
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(message)) {
    return "Too many attempts — try again in a minute.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (code === "signup_disabled") {
    return "Signups are disabled on this project.";
  }
  return message || "Something went wrong.";
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await db().auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  });
  if (error) throw new Error(authErrorMessage(error));
  return { needsConfirmation: !data.session };
}

export async function signIn(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await db().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(authErrorMessage(error));
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
}

export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

// ---------------------------------------------------------------- products

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return SEED_PRODUCTS;
  const { data, error } = await db().from("products").select("*");
  if (error) throw new Error(error.message);
  return sortProducts((data ?? []).map(mapProduct));
}

export async function updateProduct(
  id: string,
  patch: Partial<
    Pick<
      Product,
      "name" | "description" | "price" | "stock" | "active" | "art" | "imagePath"
    >
  >,
): Promise<void> {
  const row: Record<string, unknown> = { ...patch };
  if ("imagePath" in patch) {
    row.image_path = patch.imagePath;
    delete row.imagePath;
  }
  const { error } = await db().from("products").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

function toProductRow(product: Product): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    active: product.active,
    art: product.art,
  };
  // Only send image_path when set — keeps inserts working before
  // migration 003 has run (the column wouldn't exist yet).
  if (product.imagePath) row.image_path = product.imagePath;
  return row;
}

export async function createProduct(
  product: Product,
): Promise<Product> {
  const { data, error } = await db()
    .from("products")
    .insert(toProductRow(product))
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("A product with that name already exists.");
    }
    throw new Error(error.message);
  }
  return mapProduct(data);
}

/**
 * Deletes a product. Products referenced by past order lines can't be
 * removed without breaking history (FK), so those are hidden instead —
 * `deleted: false` tells the caller to show that note.
 */
export async function deleteProduct(
  id: string,
): Promise<{ deleted: boolean }> {
  const { error } = await db().from("products").delete().eq("id", id);
  if (!error) return { deleted: true };
  if (error.code === "23503") {
    const { error: hideError } = await db()
      .from("products")
      .update({ active: false })
      .eq("id", id);
    if (hideError) throw new Error(hideError.message);
    return { deleted: false };
  }
  throw new Error(error.message);
}

/**
 * Uploads (or replaces) a product photo, resized client-side first.
 * Stable path per product keeps re-uploads from orphaning old files.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<string> {
  const dataUrl = await resizeImage(file);
  const path = `${productId}.jpg`;
  const { error } = await db()
    .storage.from("product-images")
    .upload(path, dataUrlToBlob(dataUrl), {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (error) throw new Error(`Could not upload the photo: ${error.message}`);
  return path;
}

/** Best-effort cleanup — an orphaned photo is harmless, a failed save isn't. */
export async function removeProductImage(path: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().storage.from("product-images").remove([path]);
}

export function productImageUrl(path: string): string | null {
  if (!isSupabaseConfigured()) return null;
  const { data } = getSupabase()
    .storage.from("product-images")
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchPickupSlots(): Promise<PickupSlot[]> {
  if (!isSupabaseConfigured()) return PICKUP_SLOTS;
  const { data, error } = await db()
    .from("pickup_slots")
    .select("id, label")
    .order("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return PICKUP_SLOTS;
  return data;
}

// ---------------------------------------------------------------- orders

export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .order("id", { referencedTable: "order_lines" });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

export async function fetchMyOrders(customerId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .order("id", { referencedTable: "order_lines" });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrder(row as OrderRow));
}

export async function findOrder(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapOrder(data as OrderRow) : null;
}

export async function findOrderByCode(code: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("claim_code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapOrder(data as OrderRow) : null;
}

/** Admin view: orders with their payment proofs resolved to signed URLs. */
export async function fetchOrdersWithProofs(): Promise<Order[]> {
  const orders = await fetchOrders();
  return Promise.all(
    orders.map(async (order) => {
      if (order.paymentStatus !== "for_verification" || !order.proofPath) {
        return order;
      }
      return { ...order, proofUrl: await getProofUrl(order.proofPath) };
    }),
  );
}

export type OrderLinesInput = { productId: string; qty: number }[];

export async function createPreOrder(input: {
  lines: OrderLinesInput;
  pickupSlotId: string | null;
  pickupLabel: string | null;
}): Promise<{ id: string; orderNumber: string }> {
  const { data, error } = await db().rpc("create_pre_order", {
    p_lines: input.lines,
    p_pickup_slot_id: input.pickupSlotId,
    p_pickup_label: input.pickupLabel,
  });
  if (error) throw new Error(error.message);
  return { id: data.id, orderNumber: data.order_number };
}

export async function createWalkIn(input: {
  lines: OrderLinesInput;
  method: PaymentMethod;
  customerId: string | null;
}): Promise<{ id: string }> {
  const { data, error } = await db().rpc("create_walk_in", {
    p_lines: input.lines,
    p_method: input.method,
    p_customer_id: input.customerId,
  });
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function submitProof(
  orderId: string,
  proofDataUrl: string,
  reference: string,
): Promise<void> {
  const supabase = db();
  const uid = await currentUserId();
  if (!uid) throw new Error("Log in to submit a payment proof.");

  const path = `${uid}/${orderId}/proof.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, dataUrlToBlob(proofDataUrl), {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`Could not upload the proof: ${uploadError.message}`);
  }

  const { error } = await supabase
    .from("orders")
    .update({
      proof_path: path,
      gcash_reference: reference.trim() || null,
      payment_status: "for_verification",
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

async function getProofUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await db()
      .storage.from("payment-proofs")
      .createSignedUrl(path, 60 * 60);
    return error ? null : data.signedUrl;
  } catch {
    return null;
  }
}

export async function verifyPayment(
  orderId: string,
  approve: boolean,
): Promise<void> {
  const payload = approve
    ? { payment_status: "verified", status: "confirmed" }
    : { payment_status: "rejected" };
  const { error } = await db()
    .from("orders")
    .update(payload)
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function setStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const { error } = await db()
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export type ClaimResult =
  | { ok: true; order: Order }
  | { ok: false; reason: string };

export async function claimOrder(code: string): Promise<ClaimResult> {
  const normalized = code.trim().toUpperCase();
  const order = await findOrderByCode(normalized);

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

  const { data, error } = await db()
    .from("orders")
    .update({
      status: "completed",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .select(ORDER_SELECT)
    .single();
  if (error) return { ok: false, reason: error.message };

  return { ok: true, order: mapOrder(data as OrderRow) };
}

// ---------------------------------------------------------------- profiles & loyalty

export async function fetchProfile(id: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await db()
    .from("profiles")
    .select("id, name, role, points")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: data.id, name: data.name, email: "", role: data.role, points: data.points };
}

export async function fetchRedemptions(): Promise<Redemption[]> {
  const uid = await currentUserId();
  if (!uid || !isSupabaseConfigured()) return [];
  const { data, error } = await db()
    .from("redemptions")
    .select("id, profile_id, label, redeemed_at")
    .eq("profile_id", uid)
    .order("redeemed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    label: row.label,
    redeemedAt: row.redeemed_at,
  }));
}

/** Deducts points and records the redemption atomically (server-side). */
export async function redeemReward(): Promise<void> {
  const { error } = await db().rpc("redeem_reward");
  if (error) throw new Error(error.message);
}
