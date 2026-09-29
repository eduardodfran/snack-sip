"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FoodArt } from "@/components/food-art";
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
        <h1 className="text-2xl font-black">Order taken</h1>
        <div className="mt-4">
          <Stub
            orderNumber={order.orderNumber}
            queueNumber={order.queueNumber}
            meta={`${order.paymentMethod === "cash" ? "Cash" : "GCash"} · ${peso(order.total)}`}
            footer={
              <ul className="space-y-1 text-sm">
                {order.lines.map((line) => (
                  <li key={line.productId} className="flex items-baseline">
                    <span className="font-stub mr-2 font-bold">
                      {line.qty}×
                    </span>
                    <span className="truncate">{line.name}</span>
                    <span className="leader" aria-hidden />
                    <span className="font-stub font-bold">
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
          className="mt-5 w-full border-2 border-ink bg-tarp py-3.5 font-black shadow-[4px_4px_0_0_#1a1a1a]"
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
          className="text-sm font-bold underline"
        >
          ← Back to order
        </button>
        <h1 className="mt-2 text-2xl font-black">Payment</h1>

        <ul className="mt-4 space-y-1.5 border-2 border-ink bg-white p-4">
          {lines.map((line) => (
            <li key={line.productId} className="flex items-baseline text-sm">
              <span className="font-stub mr-2 font-bold">{line.qty}×</span>
              <span className="truncate">{line.name}</span>
              <span className="leader" aria-hidden />
              <span className="font-stub font-bold">
                {peso(line.qty * line.unitPrice)}
              </span>
            </li>
          ))}
          <li className="flex items-baseline border-t-2 border-dashed border-ink/40 pt-2 font-black">
            Total
            <span className="leader" aria-hidden />
            <span className="font-stub text-xl">{peso(total)}</span>
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
                className={`border-2 border-ink py-4 text-lg font-black uppercase ${
                  method === m ? "bg-tarp" : "bg-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        <section className="mt-5 border-2 border-ink bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-black">Loyalty account</h2>
              <p className="text-sm text-muted">
                {account
                  ? `Linked: ${account.name}`
                  : "Optional — scan Account QR."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="border-2 border-ink bg-ink px-3 py-2 text-sm font-bold text-white"
            >
              Scan
            </button>
          </div>
          {account && (
            <button
              type="button"
              onClick={() => setAccount(null)}
              className="mt-3 text-sm font-bold underline"
            >
              Remove
            </button>
          )}
        </section>

        {error && (
          <p
            role="alert"
            className="mt-4 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={confirmOrder}
          disabled={confirming}
          className="mt-5 w-full border-2 border-ink bg-tarp py-4 text-lg font-black shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
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
      <h1 className="text-2xl font-black">Walk-in POS</h1>
      <p className="mt-1 text-sm text-muted">Tap items, then take payment.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const current = qty[product.id] ?? 0;
          const soldOut = product.stock <= 0;
          return (
            <button
              key={product.id}
              type="button"
              disabled={soldOut}
              onClick={() => bump(product.id, 1, product.stock)}
              className={`relative border-2 border-ink bg-white p-3 text-center ${
                soldOut ? "opacity-40" : "shadow-[3px_3px_0_0_#1a1a1a]"
              }`}
            >
              {current > 0 && (
                <span className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center border-2 border-ink bg-tarp px-1 font-stub text-sm font-bold">
                  {current}
                </span>
              )}
              <FoodArt art={product.art} className="mx-auto h-16 w-16" />
              <p className="mt-1 text-sm font-bold leading-tight">
                {product.name}
              </p>
              <p className="font-stub text-sm font-bold">
                {peso(product.price)}
              </p>
              <p
                className={`text-[10px] font-bold ${
                  soldOut ? "text-stamp" : "text-muted"
                }`}
              >
                {soldOut ? "Sold out" : `${product.stock} left`}
              </p>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-5xl">
        <div className="flex items-center gap-3 px-1 sm:px-0">
          <div className="flex-1">
            <p className="text-xs font-bold text-muted">
              {lines.reduce((s, l) => s + l.qty, 0)} items
            </p>
            <p className="font-stub text-2xl font-bold leading-none">
              {peso(total)}
            </p>
          </div>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={() => setStep("payment")}
            className="border-2 border-ink bg-tarp px-6 py-3 font-black shadow-[3px_3px_0_0_#1a1a1a] disabled:opacity-40"
          >
            Charge
          </button>
        </div>
      </div>

      <div className="h-24" />
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin" className="text-sm font-bold underline">
          ← Dashboard
        </Link>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={() => setQty({})}
            className="text-sm font-bold text-stamp underline"
          >
            Clear order
          </button>
        )}
      </div>
    </div>
  );
}
