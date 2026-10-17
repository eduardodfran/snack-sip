type Props = {
  orderNumber: string;
  queueNumber?: number | null;
  meta: string;
  footer?: React.ReactNode;
  className?: string;
};

export function Stub({ orderNumber, queueNumber, meta, footer, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper p-5 shadow-card ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-muted">
            ORDER NUMBER
          </p>
          <p className="font-display text-3xl tracking-tight text-brand">
            {orderNumber}
          </p>
        </div>
        {queueNumber != null && (
          <div className="rounded-2xl bg-accent px-4 py-2 text-center">
            <p className="text-[10px] font-bold tracking-[0.15em]">QUEUE</p>
            <p className="text-2xl font-extrabold leading-none">{queueNumber}</p>
          </div>
        )}
      </div>
      <p className="pt-1 text-sm text-muted">{meta}</p>
      <div className="mt-4 border-t-2 border-dashed border-line pt-4">
        {footer}
      </div>
    </div>
  );
}
