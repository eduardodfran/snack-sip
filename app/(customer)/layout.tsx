"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/data/api";
import type { Profile } from "@/lib/types";
import { BottomNav } from "@/components/bottom-nav";
import { BrandLogo } from "@/components/brand-logo";
import { CartBar } from "@/components/cart-bar";

const HIDE_ON = ["/login", "/signup"];
const HIDE_CART_BAR = ["/cart", "/checkout", "/payment"];

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
] as const;

function Header({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();

  async function handleLogout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
      <Link href="/" aria-label="Snack & Sip home">
        <BrandLogo compact />
      </Link>

      <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                active
                  ? "bg-brand text-white"
                  : "text-ink hover:bg-brand/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/cart"
          aria-current={pathname.startsWith("/cart") ? "page" : undefined}
          className={`ml-1 rounded-full px-4 py-1.5 text-sm font-bold ${
            pathname.startsWith("/cart")
              ? "bg-ink text-white"
              : "bg-brand text-white hover:bg-brand-deep"
          }`}
        >
          Cart{count > 0 ? ` (${count})` : ""}
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        {profile ? (
          <>
            <Link
              href="/profile"
              className="hidden max-w-32 truncate rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold sm:block"
            >
              {profile.name}
            </Link>
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold text-cocoa underline underline-offset-2"
            >
              Log out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-ink hover:bg-accent-deep md:text-sm"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useAuth();

  const hideNav = HIDE_ON.includes(pathname);
  const hideCartBar =
    hideNav || HIDE_CART_BAR.some((path) => pathname.startsWith(path));

  return (
    <CartProvider>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        {profile === undefined ? (
          <div className="mx-auto max-w-5xl px-4 py-2.5" />
        ) : (
          <Header profile={profile} />
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 pb-28 md:pb-12">
        {children}
      </main>

      {!hideNav && (
        <>
          {!hideCartBar && <CartBar />}
          <BottomNav />
        </>
      )}
    </CartProvider>
  );
}
