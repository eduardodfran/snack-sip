export const GCASH = {
  name: "Rai Hannah Alab",
  number: "09851567833",
} as const;

export const FAIR = {
  name: "Snack & Sip",
  days: ["Day 1", "Day 2"] as const,
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function orderNumberPrefix(type: "pre_order" | "walk_in") {
  return type === "pre_order" ? "PO" : "WI";
}
