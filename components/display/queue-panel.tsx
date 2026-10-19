"use client";

import type { DisplayQueueItem } from "@/lib/types";

/**
 * Live queue (20% side). Derived purely from order status — staff never
 * types numbers here:
 *   ready      -> NOW SERVING  (the order being handed over)
 *   preparing  -> PREPARING
 *   confirmed  -> UP NEXT
 * When an order is claimed (status -> completed) it drops out of the
 * query and the next number slides up automatically.
 */

function queueLabel(item: DisplayQueueItem): string {
  if (item.queueNumber != null) return String(item.queueNumber).padStart(3, "0");
  return item.orderNumber;
}

const SIZES = {
  lg: "text-[clamp(1.8rem,3.4vw,3.5rem)]",
  md: "text-[clamp(1.3rem,2vw,2rem)]",
  sm: "text-[clamp(1.05rem,1.6vw,1.6rem)]",
} as const;

function QueueSection({
  label,
  items,
  size,
  highlight = false,
}: {
  label: string;
  items: DisplayQueueItem[];
  size: keyof typeof SIZES;
  highlight?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-paper px-3 py-2.5 md:rounded-none md:border-t md:border-line md:px-4 md:py-3.5 md:first:border-t-0">
      <p
        className={`rounded-lg px-2 py-1 text-center text-[10px] font-extrabold tracking-[0.18em] ${
          highlight ? "bg-accent text-cocoa" : "text-muted"
        }`}
      >
        {label}
      </p>
      <div className="mt-1.5 flex flex-col items-center gap-0.5 md:mt-2">
        {items.length === 0 ? (
          <p className={`${SIZES[size]} font-display leading-none text-muted`}>—</p>
        ) : (
          items.map((item) => (
            <p
              key={item.id}
              className={`${SIZES[size]} font-display leading-none text-brand`}
            >
              {queueLabel(item)}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

export function QueuePanel({ queue }: { queue: DisplayQueueItem[] }) {
  const serving = queue.filter((o) => o.status === "ready").slice(0, 2);
  const preparing = queue.filter((o) => o.status === "preparing").slice(0, 3);
  const upcoming = queue.filter((o) => o.status === "confirmed").slice(0, 2);

  return (
    <aside
      aria-label="Live queue"
      className="shrink-0 px-4 pb-4 md:w-[26%] md:min-w-[240px] md:max-w-[330px] md:px-4 md:py-5 md:pl-0"
    >
      <div className="grid grid-cols-3 gap-2 md:h-full md:grid-cols-1 md:gap-0 md:overflow-hidden md:rounded-3xl md:border md:border-line md:bg-paper md:shadow-pop">
        <QueueSection label="NOW SERVING" items={serving} size="lg" highlight />
        <QueueSection label="PREPARING" items={preparing} size="md" />
        <QueueSection label="UP NEXT" items={upcoming} size="sm" />
      </div>
    </aside>
  );
}
