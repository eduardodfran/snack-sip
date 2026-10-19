"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pos", label: "POS" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/display", label: "Display" },
] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const signedOut = profile === null;
  const allowed =
    profile !== undefined && profile !== null && profile.role === "admin";

  useEffect(() => {
    if (signedOut) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [signedOut, pathname, router]);

  if (signedOut || profile === undefined) return null;

  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream px-4">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-card">
          <p className="text-sm font-bold tracking-[0.2em] text-brand">
            SNACK &amp; SIP
          </p>
          <h1 className="font-display mt-1 text-2xl">Admins only</h1>
          <p className="mt-3 text-sm text-muted">
            You&apos;re logged in as{" "}
            <span className="font-bold">{profile.email}</span>, which
            isn&apos;t a booth admin account.
          </p>
          <Link
            href="/"
            className="mt-5 block rounded-full bg-accent py-3 text-center font-bold text-ink hover:bg-accent-deep"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 bg-brand text-white shadow-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <Link href="/admin" className="leading-tight" aria-label="Snack & Sip booth admin">
            <span className="font-display text-lg text-accent">Snack &amp; Sip</span>
            <span className="block text-[10px] font-bold tracking-[0.2em] text-white/60">
              BOOTH ADMIN
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-bold">
            <Link href="/" className="underline underline-offset-2">
              Customer site
            </Link>
            <span className="hidden text-white/60 sm:inline">
              {profile.name}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl">
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Admin">
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
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${
                    active
                      ? "bg-accent text-ink"
                      : "text-white/70 hover:bg-white/10"
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
