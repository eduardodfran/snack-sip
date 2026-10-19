"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { Scanner } from "@/components/scanner";
import { Stub } from "@/components/stub";
import {
  createWalkIn,
  fetchProducts,
  fetchProfile,
  findOrder,
} from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Order, Product, Profile } from "@/lib/types";

type Step = "order" | "payment" | "done";

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>("order");
  const [method, setMethod] = useState<"cash" | "gcash">("cash");
  const [account, setAccount] = useState<Profile | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = products
    .filter((p) => (qty[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      qty: qty[p.id],
      unitPrice: p.price,
    }));
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  // Hidden products stay in the DB for order history but never sell at the booth.
  const menuProducts = products.filter((product) => product.active);

  function bump(id: string, delta: number, max: number) {
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[id] ?? 0) + delta));
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function handleScan(text: string) {
    setScanOpen(false);
    const match = text.match(/snack-sip:account:([A-Za-z0-9-]+)/);
    if (!match) {
      setError("That QR is not an Account QR.");
      return;
    }
    try {
      const profile = await fetchProfile(match[1]);
      if (!profile) {
        setError("Account not found.");
        return;
      }
      setAccount(profile);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not look up that account.",
      );
    }
  }

  async function confirmOrder() {
    setError("");
    if (confirming) return;
    setConfirming(true);
    try {
      const { id } = await createWalkIn({
        lines: lines.map((line) => ({
          productId: line.productId,
          qty: line.qty,
        })),
        method,
        customerId: account?.id ?? null,
      });
      const created = await findOrder(id);
      if (!created) throw new Error("Could not load the new order.");
      setOrder(created);
      setQty({});
      setAccount(null);
      setStep("done");
      setProducts(await fetchProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order.");
    } finally {
      setConfirming(false);
    }
  }

  if (step === "done" && order) {
    return (
      <div>
        <h1 className="font-display text-2xl">Order taken</h1>
        <div className="mt-4">
          <Stub
            orderNumber={order.orderNumber}
            queueNumber={order.queueNumber}
            meta={`${order.paymentMethod === "cash" ? "Cash" : "GCash"} · ${peso(order.total)}`}
            footer={
              <ul className="space-y-1 text-sm">
                {order.lines.map((line) => (
                  <li key={line.productId} className="flex items-baseline">
                    <span className="mr-2 font-bold text-brand">
                      {line.qty}×
                    </span>
                    <span className="truncate">{line.name}</span>
                    <span className="leader" aria-hidden />
                    <span className="font-bold">
                      {peso(line.qty * line.unitPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            }
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          Hand this stub / call the queue number when the food is ready.
        </p>
        <button
          type="button"
          onClick={() => {
            setOrder(null);
            setStep("order");
          }}
          className="mt-5 w-full rounded-full bg-accent py-3.5 font-bold text-ink shadow-card hover:bg-accent-deep"
        >
          New walk-in order
        </button>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setStep("order")}
          className="text-sm font-bold text-brand underline underline-offset-4"
        >
          ← Back to order
        </button>
        <h1 className="font-display mt-2 text-2xl">Payment</h1>

        <ul className="mt-4 space-y-1.5 rounded-2xl border border-line bg-paper p-4 shadow-card">
          {lines.map((line) => (
            <li key={line.productId} className="flex items-baseline text-sm">
              <span className="mr-2 font-bold text-brand">{line.qty}×</span>
              <span className="truncate">{line.name}</span>
              <span className="leader" aria-hidden />
              <span className="font-bold">
                {peso(line.qty * line.unitPrice)}
              </span>
            </li>
          ))}
          <li className="flex items-baseline border-t-2 border-dashed border-line pt-2 font-bold">
            Total
            <span className="leader" aria-hidden />
            <span className="text-xl font-extrabold text-brand">
              {peso(total)}
            </span>
          </li>
        </ul>

        <fieldset className="mt-5">
          <legend className="text-sm font-bold text-muted">
            Payment method
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["cash", "gcash"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`rounded-2xl border py-4 text-lg font-extrabold uppercase shadow-card ${
                  method === m
                    ? "border-accent-deep bg-accent text-ink"
                    : "border-line bg-paper text-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        <section className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg">Loyalty account</h2>
              <p className="text-sm text-muted">
                {account
                  ? `Linked: ${account.name}`
                  : "Optional — scan Account QR."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-deep"
            >
              Scan
            </button>
          </div>
          {account && (
            <button
              type="button"
              onClick={() => setAccount(null)}
              className="mt-3 text-sm font-bold text-cocoa underline underline-offset-4"
            >
              Remove
            </button>
          )}
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-cocoa/30 bg-[#f7e9dc] px-3 py-2 text-sm font-bold text-cocoa"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={confirmOrder}
          disabled={confirming}
          className="mt-5 w-full rounded-full bg-accent py-4 text-lg font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-50"
        >
          {confirming
            ? "Saving…"
            : method === "cash"
              ? "Cash received — confirm"
              : "GCash verified — confirm"}
        </button>

        {scanOpen && (
          <Scanner
            title="Scan Account QR"
            onResult={handleScan}
            onClose={() => setScanOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Walk-in POS</h1>
      <p className="mt-1 text-sm text-muted">Tap items, then take payment.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {menuProducts.map((product) => {
          const current = qty[product.id] ?? 0;
          const soldOut = product.stock <= 0;
          return (
            <button
              key={product.id}
              type="button"
              disabled={soldOut}
              onClick={() => bump(product.id, 1, product.stock)}
              className={`relative rounded-2xl border border-line bg-paper p-3 text-center shadow-card ${
                soldOut ? "opacity-50" : ""
              }`}
            >
              {current > 0 && (
                <span className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1 text-sm font-extrabold text-ink">
                  {current}
                </span>
              )}
              <ProductArt product={product} className="mx-auto h-16 w-16 rounded-xl" />
              <p className="mt-1 text-sm font-bold leading-tight">
                {product.name}
              </p>
              <p className="text-sm font-bold text-brand">
                {peso(product.price)}
              </p>
              <p
                className={`text-[10px] font-bold ${
                  soldOut ? "text-stone-500" : "text-fresh"
                }`}
              >
                {soldOut ? "Sold out" : `${product.stock} left`}
              </p>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-5xl">
        <div className="flex items-center gap-3 px-1 sm:px-0">
          <div className="flex-1">
            <p className="text-xs font-bold text-muted">
              {lines.reduce((s, l) => s + l.qty, 0)} items
            </p>
            <p className="text-2xl leading-none font-extrabold text-brand">
              {peso(total)}
            </p>
          </div>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={() => setStep("payment")}
            className="rounded-full bg-accent px-8 py-3 font-bold text-ink shadow-card hover:bg-accent-deep disabled:opacity-40"
          >
            Charge
          </button>
        </div>
      </div>

      <div className="h-24" />
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin"
          className="text-sm font-bold text-brand underline underline-offset-4"
        >
          ← Dashboard
        </Link>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={() => setQty({})}
            className="text-sm font-bold text-cocoa underline underline-offset-4"
          >
            Clear order
          </button>
        )}
      </div>
    </div>
  );
}
