"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/data/api";
import type { Profile } from "@/lib/types";
import { BottomNav } from "@/components/bottom-nav";
import { CartBar } from "@/components/cart-bar";

const HIDE_ON = ["/login", "/signup"];
const HIDE_CART_BAR = ["/cart", "/checkout", "/payment"];

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/loyalty", label: "Loyalty" },
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
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
      <Link href="/" className="leading-none">
        <span className="text-lg font-black tracking-tight">Snack &amp; Sip</span>
        <span className="block text-[10px] font-bold text-ink/70">
          Techno Fair pre-order
        </span>
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
              className={`border-2 px-3 py-1.5 text-sm font-bold ${
                active
                  ? "border-ink bg-white"
                  : "border-transparent hover:border-ink/30"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/cart"
          aria-current={pathname.startsWith("/cart") ? "page" : undefined}
          className={`ml-1 border-2 px-3 py-1.5 text-sm font-bold ${
            pathname.startsWith("/cart")
              ? "border-ink bg-white"
              : "border-ink bg-ink text-white"
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
              className="hidden max-w-32 truncate border-2 border-ink bg-white px-2 py-1 text-xs font-bold sm:block"
            >
              {profile.name}
            </Link>
            {profile.role === "admin" && (
              <Link
                href="/admin"
                className="border-2 border-ink bg-ink px-2 py-1 text-xs font-bold text-white"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold underline underline-offset-2"
            >
              Log out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold md:text-sm"
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
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-tarp">
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
