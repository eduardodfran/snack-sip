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
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-sm border-2 border-ink bg-white p-6 shadow-[6px_6px_0_0_#ffce00]">
          <p className="font-stub text-sm font-bold text-muted">
            Snack &amp; Sip
          </p>
          <h1 className="mt-1 text-2xl font-black">Admins only</h1>
          <p className="mt-3 text-sm text-ink-soft">
            You&apos;re logged in as{" "}
            <span className="font-stub font-bold">{profile.email}</span>, which
            isn&apos;t a booth admin account.
          </p>
          <Link
            href="/"
            className="mt-5 block border-2 border-ink bg-tarp py-3 text-center font-black"
          >
            Back to shop
          </Link>
        </div>
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
