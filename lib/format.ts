export function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}

export function shortTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
