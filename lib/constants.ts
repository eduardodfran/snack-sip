export const LOYALTY = {
  pesosPerPoint: 25,
  preOrderBonus: 2,
  rewardAt: 10,
  rewardLabel: "Free flying saucer",
} as const;

export const GCASH = {
  name: "Snack & Sip",
  number: "09XX XXX XXXX",
} as const;

export const FAIR = {
  name: "Techno Fair",
  days: ["Day 1", "Day 2"] as const,
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function orderNumberPrefix(type: "pre_order" | "walk_in") {
  return type === "pre_order" ? "PO" : "WI";
}
