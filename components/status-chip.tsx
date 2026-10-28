import type { OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-stone-200 text-stone-600",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-[#e3edf9] text-brand",
  },
  preparing: {
    label: "Preparing",
    className: "bg-accent text-ink",
  },
  ready: {
    label: "Ready for pickup",
    className: "bg-fresh text-white",
  },
  completed: {
    label: "Completed",
    className: "bg-brand text-white",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-stone-200 text-stone-600",
  },
};

const PAYMENT_STYLES: Record<
  Exclude<PaymentStatus, "pending_payment">,
  { label: string; className: string }
> = {
  for_verification: {
    label: "For verification",
    className: "bg-[#e3edf9] text-brand",
  },
  verified: {
    label: "Paid",
    className: "bg-fresh text-white",
  },
  rejected: {
    label: "Needs resubmission",
    className: "bg-[#f3e2d3] text-cocoa",
  },
};

export function OrderChip({ status }: { status: OrderStatus }) {
  const { label, className } = ORDER_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  if (status === "pending_payment") return null;
  const { label, className } = PAYMENT_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}
