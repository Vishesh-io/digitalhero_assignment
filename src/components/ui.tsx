import Link from "next/link";
import { cn, formatMoney } from "@/lib/money";
import type { Charity } from "@/db/schema";
import { ArrowUpRight, Star } from "lucide-react";

/* ------------------------------- section head ------------------------------ */

export function SectionHead({
  kicker,
  title,
  sub,
  align = "center",
  className,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left", className)}>
      <p className="kicker">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-mute">{sub}</p>}
    </div>
  );
}

/* ------------------------------- number balls ------------------------------ */

export function NumberBall({
  n,
  size = "md",
  tone = "volt",
  className,
}: {
  n: number | string;
  size?: "sm" | "md" | "lg";
  tone?: "volt" | "gold" | "dim" | "hit";
  className?: string;
}) {
  const sizes = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-14 text-base" };
  const tones = {
    volt: "bg-volt text-[#0a0b0e] shadow-[0_0_24px_rgba(199,242,78,0.35)]",
    gold: "bg-gold text-[#0a0b0e] shadow-[0_0_24px_rgba(242,201,76,0.35)]",
    hit: "bg-mint text-[#0a0b0e]",
    dim: "border border-white/15 bg-white/5 text-mute",
  };
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold tabular-nums",
        sizes[size],
        tones[tone],
        className
      )}
    >
      {n}
    </span>
  );
}

/* ------------------------------- status badge ------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  active: "border-volt/40 bg-volt/10 text-volt",
  inactive: "border-white/15 bg-white/5 text-mute",
  cancelled: "border-gold/40 bg-gold/10 text-gold",
  past_due: "border-ember/40 bg-ember/10 text-ember",
  expired: "border-white/15 bg-white/5 text-mute",
  pending_proof: "border-gold/40 bg-gold/10 text-gold",
  proof_submitted: "border-mint/40 bg-mint/10 text-mint",
  approved: "border-volt/40 bg-volt/10 text-volt",
  rejected: "border-ember/40 bg-ember/10 text-ember",
  pending: "border-gold/40 bg-gold/10 text-gold",
  paid: "border-volt/40 bg-volt/10 text-volt",
  simulated: "border-gold/40 bg-gold/10 text-gold",
  published: "border-volt/40 bg-volt/10 text-volt",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  cancelled: "Cancelling",
  past_due: "Past due",
  expired: "Expired",
  pending_proof: "Proof needed",
  proof_submitted: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  paid: "Paid",
  simulated: "Simulation",
  published: "Published",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        STATUS_STYLES[status] ?? STATUS_STYLES.inactive,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ------------------------------- charity card ------------------------------ */

export function CharityCard({
  charity,
  raised = 0,
  className,
}: {
  charity: Charity;
  raised?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/charities/${charity.slug}`}
      className={cn(
        "card group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:border-volt/30",
        className
      )}
    >
      <div className="relative h-44 overflow-hidden">
        {charity.imageUrl ? (
          <img
            src={charity.imageUrl}
            alt={charity.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-panel2 to-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e]/90 via-transparent to-transparent" />
        {charity.isFeatured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-volt px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#0a0b0e]">
            <Star className="size-3 fill-current" /> FEATURED
          </span>
        )}
        <span className="absolute bottom-3 left-3 chip !bg-black/50 !text-ink/90">{charity.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug">{charity.name}</h3>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-mute transition group-hover:text-volt" />
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-mute">{charity.tagline}</p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mute">Raised with Heroes</span>
            <span className="font-semibold text-volt">{formatMoney(raised, { decimals: false })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------- empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white/[0.04] text-mute">
        {icon}
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-mute">{body}</p>}
      {children}
    </div>
  );
}
