import { Check, Gem, Heart, Sparkles, Target, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, getUserSubscription, isSubscriptionActive, nextDrawDate } from "@/lib/core";
import { formatDate, formatMoney } from "@/lib/money";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { SectionHead, StatusBadge } from "@/components/ui";
import { SubscribeButton } from "@/components/public-forms";
import Link from "next/link";

export const metadata = { title: "Pricing", description: "Choose monthly or yearly membership. Both plans enter you in every monthly draw and let you direct at least 10% of your subscription to charity." };
export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const user = await getCurrentUser();
  const s = await getSettings();
  const sub = user ? await getUserSubscription(user.id) : null;
  const active = isSubscriptionActive(sub);
  const nextDraw = nextDrawDate(s);

  const yearlySaving = Math.round(((s.monthlyPrice * 12 - s.yearlyPrice) / (s.monthlyPrice * 12)) * 100);

  const includes = [
    "Entry into every monthly draw",
    `${s.prizePoolPercent}% of your fee feeds the prize pool`,
    `Minimum ${s.minCharityPercent}% goes to your chosen charity`,
    "Switch charity or raise your pledge any time",
    "Independent donations whenever you feel generous",
    "Verified winner payouts",
  ];

  return (
    <div className="relative min-h-screen bg-bg">
      <SiteNav user={user ? { fullName: user.fullName, role: user.role } : null} />

      <section className="noise relative overflow-hidden border-b border-line">
        <div className="glow-volt absolute -left-40 top-20 size-[460px] rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-32 text-center sm:px-6">
          <Reveal>
            <p className="kicker">Membership</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Memberships that <span className="text-gradient-volt">give back</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-mute">
              One club, two plans. You&apos;re in every monthly draw while subscribed — the next one is{" "}
              <span className="text-ink">{formatDate(nextDraw)}</span>.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {active && sub && (
          <div className="card mb-8 flex flex-col items-start justify-between gap-4 border-volt/30 bg-volt/[0.05] p-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge status={sub.status} />
                <span className="chip capitalize">{sub.plan}</span>
              </div>
              <p className="mt-2 text-sm text-mute">
                You&apos;re already a member. Manage your subscription from your dashboard.
              </p>
            </div>
            <Link href="/dashboard" className="btn-volt !py-2.5 text-xs">Open dashboard</Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly */}
          <Reveal>
            <div className="card flex h-full flex-col p-8">
              <p className="field-label">Monthly</p>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-5xl font-semibold">{formatMoney(s.monthlyPrice, { decimals: false })}</p>
                <span className="text-sm text-mute">/month</span>
              </div>
              <p className="mt-3 text-sm text-mute">Rolling monthly. Cancel any time — you keep access until the paid period ends.</p>
              <ul className="mt-7 flex-1 space-y-3">
                {includes.map((li) => (
                  <li key={li} className="flex items-start gap-2.5 text-sm text-mute">
                    <Check className="mt-0.5 size-4 shrink-0 text-volt" /> {li}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <SubscribeButton
                  plan="monthly"
                  authed={!!user}
                  label={active ? "Switch to monthly" : "Subscribe monthly"}
                  className="btn-ghost w-full"
                />
              </div>
            </div>
          </Reveal>

          {/* Yearly */}
          <Reveal delay={0.1}>
            <div className="card relative flex h-full flex-col border-volt/40 bg-volt/[0.05] p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-volt px-3 py-1 text-[10px] font-bold tracking-wide text-[#0a0b0e]">
                <Sparkles className="size-3" /> SAVE {yearlySaving}% — BEST VALUE
              </span>
              <p className="field-label">Yearly</p>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-5xl font-semibold">{formatMoney(s.yearlyPrice, { decimals: false })}</p>
                <span className="text-sm text-mute">/year</span>
              </div>
              <p className="mt-3 text-sm text-mute">
                {formatMoney(Math.round(s.yearlyPrice / 12))} per month equivalent — committed giving your charity
                can rely on, plus one larger donation moment each year.
              </p>
              <ul className="mt-7 flex-1 space-y-3">
                {includes.map((li) => (
                  <li key={li} className="flex items-start gap-2.5 text-sm text-mute">
                    <Check className="mt-0.5 size-4 shrink-0 text-volt" /> {li}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <SubscribeButton
                  plan="yearly"
                  authed={!!user}
                  label={active ? "Switch to yearly" : "Subscribe yearly"}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Split explainer */}
        <Reveal className="mt-12">
          <div className="card grid gap-6 p-8 sm:grid-cols-3">
            {[
              { icon: <Heart className="size-5" />, h: `${s.minCharityPercent}%+ to charity`, p: "Your chosen share of every payment goes straight to your charity's ledger." },
              { icon: <Gem className="size-5" />, h: `${s.prizePoolPercent}% to the pool`, p: "Feeds the 40 / 35 / 25 prize split, including the rolling jackpot." },
              { icon: <Trophy className="size-5" />, h: "The rest runs the club", p: "Platform costs, verification work, and growing the community." },
            ].map((c) => (
              <div key={c.h} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">{c.icon}</span>
                <div>
                  <h3 className="font-display text-base font-semibold">{c.h}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-mute">{c.p}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {!user && (
          <Reveal className="mt-10 text-center">
            <p className="text-sm text-mute">
              New here?{" "}
              <Link href={`/signup${plan ? `?plan=${plan}` : ""}`} className="font-semibold text-volt hover:underline">
                Create an account
              </Link>{" "}
              first — it takes 30 seconds.
            </p>
          </Reveal>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
