import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  HandCoins,
  Heart,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { charities as charitiesTable, donations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const rows = await db.select().from(charitiesTable).where(eq(charitiesTable.slug, slug)).limit(1);
  const charity = rows[0];
  if (!charity) notFound();

  const charityDonations = await db
    .select()
    .from(donations)
    .where(eq(donations.charityId, charity.id));
  const raised = charityDonations.reduce((a, d) => a + d.amount, 0);
  const supporters = new Set(charityDonations.map((d) => d.userId).filter(Boolean)).size;

  const ctaHref = user ? "/dashboard/charity" : "/signup";
  const ctaLabel = user ? "Support this charity" : "Join & support this charity";

  return (
    <div className="relative min-h-screen bg-bg">
      <SiteNav user={user ? { fullName: user.fullName, role: user.role } : null} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[46vh] min-h-[320px]">
          {charity.imageUrl ? (
            <img src={charity.imageUrl} alt={charity.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-panel2 to-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/20" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="-mt-28 pb-6">
            <Reveal>
              <Link href="/charities" className="chip mb-5 !bg-black/50 backdrop-blur hover:text-volt">
                <ArrowLeft className="size-3.5" /> All charities
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip !bg-black/50 backdrop-blur">{charity.category}</span>
                {charity.location && (
                  <span className="chip !bg-black/50 backdrop-blur">
                    <MapPin className="size-3" /> {charity.location}
                  </span>
                )}
                {charity.isFeatured && (
                  <span className="chip !border-volt/50 !bg-volt !text-[#0a0b0e]">
                    <Sparkles className="size-3" /> Featured
                  </span>
                )}
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                {charity.name}
              </h1>
              {charity.tagline && (
                <p className="mt-4 max-w-xl text-base text-mute">{charity.tagline}</p>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-line bg-panel/60">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6 px-4 py-8 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
              <HandCoins className="size-4.5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold sm:text-2xl">
                {formatMoney(raised, { decimals: false })}
              </p>
              <p className="text-xs text-mute">raised with Heroes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
              <Users className="size-4.5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold sm:text-2xl">{supporters}</p>
              <p className="text-xs text-mute">member supporters</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
              <CalendarDays className="size-4.5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold sm:text-2xl">{charity.events?.length ?? 0}</p>
              <p className="text-xs text-mute">upcoming events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <div>
              <p className="kicker">Their story</p>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-mute">
                {(charity.description || "").split("\n").filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {charity.impact && (
                <div className="card mt-8 border-volt/25 bg-volt/[0.04] p-6">
                  <p className="kicker !text-volt">Impact</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/90">{charity.impact}</p>
                </div>
              )}

              {charity.websiteUrl && (
                <a
                  href={charity.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-volt hover:underline"
                >
                  Visit their website <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="space-y-6">
              <div className="card p-6">
                <p className="kicker"><Heart className="mr-1.5 inline size-3.5" /> Become a supporter</p>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Choose {charity.name} as your charity and a share of every subscription
                  payment reaches them every single month.
                </p>
                <Link href={ctaHref} className="btn-volt mt-5 w-full">
                  {ctaLabel} <ArrowRight className="size-4" />
                </Link>
                {user && (
                  <Link href={`/dashboard/charity?donate=${charity.id}`} className="btn-ghost mt-2.5 w-full !py-2.5 text-xs">
                    <HandCoins className="size-3.5" /> Make an independent donation
                  </Link>
                )}
              </div>

              {charity.events && charity.events.length > 0 && (
                <div className="card p-6">
                  <p className="kicker"><CalendarDays className="mr-1.5 inline size-3.5" /> Events & golf days</p>
                  <ul className="mt-4 space-y-3">
                    {charity.events.map((e, i) => (
                      <li key={i} className="rounded-xl border border-line bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{e.title}</p>
                          <span className="chip shrink-0 !text-[10px]">{e.date}</span>
                        </div>
                        <p className="mt-1 text-xs text-mute">{e.location}</p>
                        {e.description && <p className="mt-1.5 text-xs text-mute/80">{e.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
