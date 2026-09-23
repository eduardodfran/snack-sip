import type { OrderStatus, PaymentStatus } from "@/lib/types";

const ORDER_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-white text-muted border-muted" },
  confirmed: { label: "Confirmed", className: "bg-tarp text-ink border-ink" },
  preparing: { label: "Preparing", className: "bg-tarp-deep text-ink border-ink" },
  ready: { label: "Ready for pickup", className: "bg-leaf text-white border-ink" },
  completed: { label: "Completed", className: "bg-ink text-white border-ink" },
  cancelled: { label: "Cancelled", className: "bg-stamp text-white border-ink" },
};

const PAYMENT_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  pending_payment: { label: "Not paid yet", className: "bg-white text-muted border-muted" },
  for_verification: { label: "For verification", className: "bg-tarp text-ink border-ink" },
  verified: { label: "Paid", className: "bg-leaf text-white border-ink" },
  rejected: { label: "Needs resubmission", className: "bg-stamp text-white border-ink" },
};

export function OrderChip({ status }: { status: OrderStatus }) {
  const { label, className } = ORDER_STYLES[status];
  return (
    <span
      className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}

export function PaymentChip({ status }: { status: PaymentStatus }) {
  const { label, className } = PAYMENT_STYLES[status];
  return (
    <span
      className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold ${className}`}
    >
      {label}
    </span>
  );
}
