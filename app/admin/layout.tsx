"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEMO_ADMIN_EMAIL,
  currentProfile,
  ensureDemoAdmin,
  login,
} from "@/lib/data/store";
import type { Profile } from "@/lib/types";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/transactions", label: "Transactions" },
] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ensureDemoAdmin();
    setProfile(currentProfile());
  }, []);

  if (profile === undefined) return null;

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            try {
              const p = login(email, password);
              if (p.role !== "admin") {
                setError("That account is not an admin.");
                return;
              }
              setProfile(p);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not log in.");
            }
          }}
          className="w-full max-w-sm border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_#ffce00]"
        >
          <p className="font-stub text-sm font-bold text-muted">
            Snack &amp; Sip
          </p>
          <h1 className="mt-1 text-2xl font-black">Booth admin</h1>
          <label className="mt-5 block">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-2 border-ink px-3 py-2.5"
              required
            />
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-bold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-2 border-ink px-3 py-2.5"
              required
            />
          </label>
          {error && (
            <p
              role="alert"
              className="mt-3 border-2 border-stamp bg-stamp/10 px-3 py-2 text-sm font-bold text-stamp"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full border-2 border-ink bg-tarp py-3 font-black"
          >
            Log in
          </button>
          <p className="mt-4 text-xs text-muted">
            Demo admin: {DEMO_ADMIN_EMAIL} (any password). Remove this once
            Supabase is connected.
          </p>
          <Link
            href="/"
            className="mt-3 block text-center text-sm font-bold underline"
          >
            Back to shop
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <Link href="/admin" className="leading-tight">
            <span className="font-black text-tarp">Snack &amp; Sip</span>
            <span className="block text-[10px] text-white/60">booth admin</span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-bold">
            <Link href="/" className="underline underline-offset-2">
              Customer site
            </Link>
            <span className="hidden text-white/50 sm:inline">
              {profile.name}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl">
          <nav className="flex gap-1 overflow-x-auto px-2 pb-1" aria-label="Admin">
            {TABS.map((tab) => {
              const active =
                tab.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 border-2 px-3 py-1.5 text-sm font-bold ${
                    active
                      ? "border-ink bg-tarp text-ink"
                      : "border-transparent text-white/70"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 pb-16">{children}</main>
    </div>
  );
}
