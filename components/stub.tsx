type Props = {
  orderNumber: string;
  queueNumber?: number | null;
  meta: string;
  footer?: React.ReactNode;
  className?: string;
};

export function Stub({ orderNumber, queueNumber, meta, footer, className = "" }: Props) {
  return (
    <div className={`stub ${className}`}>
      <span className="stub-notch -left-[1.3125rem]" aria-hidden />
      <span className="stub-notch -right-[1.3125rem]" aria-hidden />
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <p className="text-xs font-bold text-muted">Order number</p>
          <p className="font-stub text-3xl font-bold tracking-tight">
            {orderNumber}
          </p>
        </div>
        {queueNumber != null && (
          <div className="border-2 border-ink bg-tarp px-3 py-1.5 text-center">
            <p className="text-[10px] font-bold">Queue</p>
            <p className="font-stub text-2xl font-bold leading-none">
              {queueNumber}
            </p>
          </div>
        )}
      </div>
      <p className="px-5 pt-1 text-sm text-muted">{meta}</p>
      <div className="mt-4 border-t-2 border-dashed border-ink/40 px-5 py-4">
        {footer}
      </div>
    </div>
  );
}
