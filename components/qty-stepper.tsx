"use client";

export function QtyStepper({
  qty,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  qty: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        aria-label={`Remove one ${label}`}
        className="h-10 w-10 text-xl font-bold text-brand disabled:opacity-30"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center text-base font-bold"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        aria-label={`Add one ${label}`}
        className="h-10 w-10 text-xl font-bold text-brand disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
