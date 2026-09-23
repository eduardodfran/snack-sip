"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const TABS: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  showCount?: boolean;
}[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/menu", label: "Menu", icon: MenuIcon },
  { href: "/cart", label: "Cart", icon: CartIcon, showCount: true },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/loyalty", label: "Loyalty", icon: StarIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white safe-bottom md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {tab.showCount && count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-tarp px-1 font-stub text-[10px] font-bold leading-none text-ink">
                      {count}
                    </span>
                  )}
                </span>
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-t bg-tarp" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { className?: string };

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 11 L12 4 L20 11 V20 H14 V15 H10 V20 H4 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 7 H19 M5 12 H19 M5 17 H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 5 H6 L8 16 H18 L20 8 H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="19.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="19.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function OrdersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="5" y="4" width="14" height="17" rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 4 V2.75 A1.25 1.25 0 0 1 10.25 1.5 H13.75 A1.25 1.25 0 0 1 15 2.75 V4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M9 10 H15 M9 14 H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3.5 L14.6 9 L20.5 9.7 L16.2 13.9 L17.3 19.8 L12 17 L6.7 19.8 L7.8 13.9 L3.5 9.7 L9.4 9 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
