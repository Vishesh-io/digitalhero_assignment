import clsx from "clsx";

export function cn(...inputs: Parameters<typeof clsx>) {
  return clsx(...inputs);
}

/** Format integer pence as GBP. */
export function formatMoney(pence: number, opts?: { decimals?: boolean }) {
  const value = pence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: opts?.decimals === false ? 0 : 2,
    maximumFractionDigits: opts?.decimals === false ? 0 : 2,
  }).format(value);
}

export function formatDate(input: Date | string | null | undefined) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(input: Date | string | null | undefined) {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
}

export const TIER_META = {
  five: { label: "5-match", share: 40, blurb: "Jackpot" },
  four: { label: "4-match", share: 35, blurb: "Major" },
  three: { label: "3-match", share: 25, blurb: "Minor" },
} as const;

export type Tier = keyof typeof TIER_META;

export function tierLabel(tier: Tier | string | null | undefined) {
  if (!tier) return "No win";
  return TIER_META[tier as Tier]?.label ?? "No win";
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
