"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrders, getProducts } from "@/lib/data/store";
import { peso } from "@/lib/format";
import type { Order, Product } from "@/lib/types";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setOrders(getOrders());
    setProducts(getProducts());
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
      <h1 className="text-2xl font-black">Dashboard</h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-2 border-ink bg-white px-3 py-3"
          >
            <dt className="text-xs font-bold text-muted">{stat.label}</dt>
            <dd className="font-stub text-xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h2 className="font-black">Needs attention</h2>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center justify-between border-2 border-ink bg-tarp px-3 py-2.5 text-sm font-bold">
            {forVerification.length} payment
            {forVerification.length === 1 ? "" : "s"} for verification
            <Link href="/admin/orders?tab=verify" className="underline">
              Review
            </Link>
          </li>
          <li className="flex items-center justify-between border-2 border-ink bg-white px-3 py-2.5 text-sm font-bold">
            {preparing.length} order{preparing.length === 1 ? "" : "s"} to
            prepare
            <Link href="/admin/orders?tab=queue" className="underline">
              Queue
            </Link>
          </li>
          <li className="flex items-center justify-between border-2 border-ink bg-white px-3 py-2.5 text-sm font-bold">
            {ready.length} ready for pickup
            <Link href="/admin/orders?tab=queue" className="underline">
              Open
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border-2 border-ink bg-white p-4">
          <h2 className="font-black">Best seller</h2>
          {bestSeller ? (
            <p className="mt-1 font-stub text-lg font-bold">
              {bestSeller[0]}
              <span className="ml-2 text-muted">×{bestSeller[1]}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">No sales yet.</p>
          )}
          <p className="mt-3 text-sm text-muted">
            Pre-order {preOrders} vs walk-in {walkIns}
          </p>
        </div>
        <div className="border-2 border-ink bg-white p-4">
          <h2 className="font-black">Low stock / sold out</h2>
          {lowStock.length === 0 ? (
            <p className="mt-1 text-sm text-muted">All good.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span
                    className={`font-stub font-bold ${
                      p.stock <= 0 ? "text-stamp" : "text-ink"
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
            className="mt-3 inline-block text-sm font-bold underline"
          >
            Manage products
          </Link>
        </div>
      </section>

      <Link
        href="/admin/pos"
        className="mt-6 block border-2 border-ink bg-tarp py-3.5 text-center text-lg font-black shadow-[4px_4px_0_0_#1a1a1a]"
      >
        Open walk-in POS
      </Link>
    </div>
  );
}
