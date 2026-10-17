"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchOrders, fetchProducts } from "@/lib/data/api";
import { peso } from "@/lib/format";
import type { Order, Product } from "@/lib/types";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchOrders()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .catch(() => {});
    void fetchProducts()
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const sales = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const walkIns = orders.filter((o) => o.type === "walk_in").length;
  const preOrders = orders.filter((o) => o.type === "pre_order").length;
  const forVerification = orders.filter(
    (o) => o.paymentStatus === "for_verification",
  );
  const preparing = orders.filter(
    (o) => o.status === "confirmed" || o.status === "preparing",
  );
  const ready = orders.filter((o) => o.status === "ready");
  const lowStock = products.filter((p) => p.stock <= 5);

  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const line of order.lines) {
      itemCounts.set(
        line.name,
        (itemCounts.get(line.name) ?? 0) + line.qty,
      );
    }
  }
  const bestSeller = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { label: "Total sales", value: peso(sales) },
    { label: "Transactions", value: String(orders.length) },
    { label: "Walk-in", value: String(walkIns) },
    { label: "Pre-orders", value: String(preOrders) },
    { label: "To verify", value: String(forVerification.length) },
    { label: "In the queue", value: String(preparing.length) },
    { label: "Ready", value: String(ready.length) },
    {
      label: "Loyalty members",
      value: String(
        new Set(orders.map((o) => o.customerId).filter(Boolean)).size,
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-paper px-3 py-3 shadow-card"
          >
            <dt className="text-xs font-bold text-muted">{stat.label}</dt>
            <dd className="text-xl font-extrabold text-brand">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h2 className="font-display text-lg">Needs attention</h2>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center justify-between rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-ink shadow-card">
            {forVerification.length} payment
            {forVerification.length === 1 ? "" : "s"} for verification
            <Link href="/admin/orders?tab=verify" className="underline">
              Review
            </Link>
          </li>
          <li className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm font-bold shadow-card">
            {preparing.length} order{preparing.length === 1 ? "" : "s"} to
            prepare
            <Link
              href="/admin/orders?tab=queue"
              className="text-brand underline"
            >
              Queue
            </Link>
          </li>
          <li className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm font-bold shadow-card">
            {ready.length} ready for pickup
            <Link
              href="/admin/orders?tab=queue"
              className="text-brand underline"
            >
              Open
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg">Best seller</h2>
          {bestSeller ? (
            <p className="mt-1 text-lg font-extrabold text-brand">
              {bestSeller[0]}
              <span className="ml-2 font-bold text-muted">×{bestSeller[1]}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">No sales yet.</p>
          )}
          <p className="mt-3 text-sm text-muted">
            Pre-order {preOrders} vs walk-in {walkIns}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-card">
          <h2 className="font-display text-lg">Low stock / sold out</h2>
          {lowStock.length === 0 ? (
            <p className="mt-1 text-sm text-muted">All good.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span
                    className={`font-bold ${
                      p.stock <= 0 ? "text-cocoa" : "text-ink"
                    }`}
                  >
                    {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/products"
            className="mt-3 inline-block text-sm font-bold text-brand underline"
          >
            Manage products
          </Link>
        </div>
      </section>

      <Link
        href="/admin/pos"
        className="mt-6 block rounded-full bg-accent py-3.5 text-center text-lg font-bold text-ink shadow-card hover:bg-accent-deep"
      >
        Open walk-in POS
      </Link>
    </div>
  );
}
