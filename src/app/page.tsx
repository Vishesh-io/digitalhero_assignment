import Link from "next/link";
import { sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Gem,
  Heart,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { charities as charitiesTable, donations, subscriptions, winners } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, isSubscriptionActive, nextDrawDate, poolContributionPence } from "@/lib/core";
import { formatDate, formatMoney } from "@/lib/money";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal, CountUp, Marquee, FadeInOnLoad } from "@/components/motion";
import { CharityCard, SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const s = await getSettings();

  const [allCharities, allDonations, allSubs, paidWins] = await Promise.all([
    db.select().from(charitiesTable),
    db.select().from(donations),
    db.select().from(subscriptions),
    db.select({ total: sql<number>`coalesce(sum(${winners.prize}),0)::int` }).from(winners),
  ]);

  const activeSubs = allSubs.filter(isSubscriptionActive);
  const raisedByCharity = new Map<string, number>();
  let totalRaised = 0;
  for (const d of allDonations) {
    totalRaised += d.amount;
    if (d.charityId) raisedByCharity.set(d.charityId, (raisedByCharity.get(d.charityId) ?? 0) + d.amount);
  }
  const prizePaid = paidWins[0]?.total ?? 0;
  const estimatedPool =
    activeSubs.reduce((sum, sub) => sum + poolContributionPence(sub.plan, s), 0) + s.jackpotRollover;
  const nextDraw = nextDrawDate(s);

  const active = allCharities.filter((c) => c.isActive);
  const featured = active.find((c) => c.isFeatured) ?? active[0];
  const others = active.filter((c) => c.id !== featured?.id).slice(0, 3);

  return (
    <div className="relative min-h-screen bg-bg">
      <SiteNav user={user ? { fullName: user.fullName, role: user.role } : null} />

      {/* --------------------------------- HERO --------------------------------- */}
      <section className="noise relative flex min-h-[100svh] items-center overflow-hidden">
        <img
          src="/images/hero-aurora.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/40 to-bg" />
        <div className="glow-volt absolute -left-40 top-1/3 size-[520px] rounded-full blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-32 sm:px-6">
          <FadeInOnLoad>
            <p className="chip mb-6 !border-volt/30 !text-volt">
              <Sparkles className="size-3.5" /> The charity-first prize club
            </p>
            <h1 className="max-w-4xl font-display text-[13vw] font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[6.5rem]">
              Play your game.
              <br />
              <em className="text-gradient-volt not-italic sm:italic">Fund what matters.</em>
              <br />
              Win the draw.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-mute sm:text-lg">
              Subscribe, choose a charity you love and log your five latest Stableford scores.
              Every month we draw five numbers — match <span className="text-ink">3, 4 or 5</span> to win,
              while at least <span className="text-volt">10% of every subscription</span> funds real causes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className="btn-volt">
                Start your subscription <ArrowRight className="size-4" />
              </Link>
              <Link href="/charities" className="btn-ghost">
                <Heart className="size-4" /> Meet the charities
              </Link>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-line pt-8">
              <div>
                <p className="font-display text-2xl font-semibold text-volt sm:text-4xl">
                  <CountUp to={totalRaised / 100} prefix="£" />
                </p>
                <p className="mt-1 text-xs tracking-wide text-mute">raised for charity</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-gold sm:text-4xl">
                  <CountUp to={estimatedPool / 100} prefix="£" />
                </p>
                <p className="mt-1 text-xs tracking-wide text-mute">in this month&apos;s pool</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold sm:text-4xl">
                  <CountUp to={activeSubs.length} />
                </p>
                <p className="mt-1 text-xs tracking-wide text-mute">active heroes</p>
              </div>
            </div>
          </FadeInOnLoad>
        </div>
      </section>

      {/* ------------------------------- MARQUEE -------------------------------- */}
      <Marquee className="border-y border-line bg-panel py-4">
        {[
          "EVERY SUBSCRIPTION FUNDS A CAUSE",
          "MINIMUM 10% TO CHARITY",
          "MONTHLY PRIZE DRAW",
          "JACKPOT ROLLOVER",
          "VERIFIED PAYOUTS",
        ].map((t, i) => (
          <span key={i} className="flex items-center gap-8 pr-8">
            <span className="text-sm font-bold tracking-[0.22em] text-mute">{t}</span>
            <Sparkles className="size-4 text-volt" />
          </span>
        ))}
      </Marquee>

      {/* ------------------------------ HOW IT WORKS ---------------------------- */}
      <section id="how" className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHead
          kicker="How it works"
          title={
            <>
              Three steps to play
              <br />
              with purpose
            </>
          }
          sub="No tickets, no queues. Your game already generates the numbers — we just make them count for something bigger."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: <CreditCard className="size-5" />,
              title: "Subscribe & give",
              body: "Pick monthly or yearly. Choose your charity and pledge at least 10% of your subscription to them — you can always give more.",
            },
            {
              n: "02",
              icon: <Target className="size-5" />,
              title: "Log your scores",
              body: "Enter your latest Stableford scores (1–45). We keep your five most recent rounds — those five numbers are your draw entry.",
            },
            {
              n: "03",
              icon: <Trophy className="size-5" />,
              title: "Match & win",
              body: "Each month five numbers between 1 and 45 are drawn. Match 3, 4 or all 5 of your scores to take home a share of the pool.",
            },
          ].map((s2, i) => (
            <Reveal key={s2.n} delay={i * 0.12}>
              <div className="card group relative h-full overflow-hidden p-7">
                <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[7rem] font-semibold leading-none text-white/[0.04] transition group-hover:text-volt/10">
                  {s2.n}
                </span>
                <span className="grid size-11 place-items-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
                  {s2.icon}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{s2.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mute">{s2.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link href="/how-it-works" className="btn-ghost !py-2.5 text-xs">
            Full draw rules <ArrowRight className="size-3.5" />
          </Link>
        </Reveal>
      </section>

      {/* ------------------------------ PRIZE SPLIT ----------------------------- */}
      <section className="relative border-y border-line bg-panel/60 py-24 sm:py-32">
        <div className="glow-gold pointer-events-none absolute right-0 top-0 size-[420px] rounded-full blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="kicker">The prize pool</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Five numbers.
              <br />
              Three ways to win.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-mute">
              {s.prizePoolPercent}% of every monthly subscription feeds the pool. It&apos;s split across three
              match tiers — and winners in the same tier always share equally.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                { icon: <Gem className="size-4" />, text: "No 5-match winner? The 40% jackpot rolls into next month." },
                { icon: <Users className="size-4" />, text: "Multiple winners in a tier split the prize equally." },
                { icon: <BadgeCheck className="size-4" />, text: "Winners verify with proof of scores before payout." },
              ].map((li, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-mute">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-gold/15 text-gold">
                    {li.icon}
                  </span>
                  <span className="pt-0.5">{li.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-3 text-sm text-mute">
              <CalendarDays className="size-4 text-volt" />
              Next draw: <span className="font-semibold text-ink">{formatDate(nextDraw)}</span>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="card space-y-5 p-7 sm:p-9">
              {[
                { label: "5-match — Jackpot", share: 40, tone: "bg-gold", glow: "shadow-[0_0_20px_rgba(242,201,76,0.4)]" },
                { label: "4-match — Major", share: 35, tone: "bg-volt", glow: "shadow-[0_0_20px_rgba(199,242,78,0.35)]" },
                { label: "3-match — Minor", share: 25, tone: "bg-mint", glow: "" },
              ].map((b, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink">{b.label}</span>
                    <span className="font-display text-xl font-semibold">{b.share}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${b.tone} ${b.glow} transition-all duration-1000`}
                      style={{ width: `${b.share}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-mute">
                    ≈ {formatMoney(Math.round((estimatedPool * b.share) / 100), { decimals: false })} of this month&apos;s
                    estimated pool
                  </p>
                </div>
              ))}
              <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-xs leading-relaxed text-mute">
                <span className="font-semibold text-gold">Current rollover:</span>{" "}
                {formatMoney(s.jackpotRollover, { decimals: false })} carried into the jackpot from previous draws.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- CHARITIES ------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHead
          kicker="Where the money goes"
          title={
            <>
              Real charities.
              <br />
              Real impact, every month.
            </>
          }
          sub="You pick who your subscription supports — and you can switch or increase your pledge any time."
        />

        {featured && (
          <Reveal className="mt-16">
            <Link
              href={`/charities/${featured.slug}`}
              className="card group grid overflow-hidden transition-all duration-500 hover:border-volt/30 lg:grid-cols-2"
            >
              <div className="relative h-64 overflow-hidden lg:h-auto">
                <img
                  src={featured.imageUrl || "/images/hero-aurora.jpg"}
                  alt={featured.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#101218]/40" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-volt px-3 py-1 text-[10px] font-bold tracking-wide text-[#0a0b0e]">
                  <Sparkles className="size-3" /> CHARITY OF THE MONTH
                </span>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <p className="chip w-fit">{featured.category} · {featured.location}</p>
                <h3 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">{featured.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{featured.tagline}</p>
                {featured.events && featured.events.length > 0 && (
                  <p className="mt-4 flex items-center gap-2 text-xs text-gold">
                    <CalendarDays className="size-3.5" />
                    Next event: {featured.events[0].title} — {featured.events[0].date}
                  </p>
                )}
                <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                  <div>
                    <p className="text-xs text-mute">Raised with Heroes</p>
                    <p className="font-display text-xl font-semibold text-volt">
                      {formatMoney(raisedByCharity.get(featured.id) ?? 0, { decimals: false })}
                    </p>
                  </div>
                  <span className="btn-ghost !px-5 !py-2 text-xs">
                    Read their story <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.1}>
              <CharityCard charity={c} raised={raisedByCharity.get(c.id) ?? 0} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link href="/charities" className="btn-ghost">
            Browse all charities <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>

      {/* ------------------------------ IMPACT BAND ----------------------------- */}
      <section className="border-y border-line bg-panel/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-4">
          {[
            { icon: <Heart className="size-4" />, v: totalRaised / 100, prefix: "£", label: "donated to charities" },
            { icon: <Trophy className="size-4" />, v: prizePaid / 100, prefix: "£", label: "prizes paid out" },
            { icon: <Users className="size-4" />, v: activeSubs.length, prefix: "", label: "active heroes" },
            { icon: <ShieldCheck className="size-4" />, v: s.minCharityPercent, prefix: "", suffix: "%", label: "minimum giving pledge" },
          ].map((st, i) => (
            <Reveal key={i} delay={i * 0.08} className="text-center">
              <span className="mx-auto mb-3 grid size-9 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
                {st.icon}
              </span>
              <p className="font-display text-3xl font-semibold sm:text-4xl">
                <CountUp to={st.v} prefix={st.prefix} suffix={st.suffix ?? ""} />
              </p>
              <p className="mt-1 text-xs tracking-wide text-mute">{st.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------- PRICING ------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <SectionHead
          kicker="Simple pricing"
          title="One club. Two ways in."
          sub="Both plans enter every monthly draw while you`re subscribed and let you direct your giving."
        />
        <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
          {[
            {
              name: "Monthly",
              price: formatMoney(s.monthlyPrice, { decimals: false }),
              per: "per month",
              note: "Flexible — cancel any time",
              cta: "Go monthly",
              accent: false,
            },
            {
              name: "Yearly",
              price: formatMoney(s.yearlyPrice, { decimals: false }),
              per: "per year",
              note: `Two months on us — ${formatMoney(Math.round(s.yearlyPrice / 12), { decimals: false })}/mo equivalent`,
              cta: "Go yearly",
              accent: true,
            },
          ].map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <div
                className={`card relative h-full p-8 ${
                  p.accent ? "border-volt/40 bg-volt/[0.05]" : ""
                }`}
              >
                {p.accent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-volt px-3 py-1 text-[10px] font-bold tracking-wide text-[#0a0b0e]">
                    BEST VALUE
                  </span>
                )}
                <p className="field-label">{p.name}</p>
                <p className="font-display text-4xl font-semibold">{p.price}</p>
                <p className="mt-1 text-xs text-mute">{p.per}</p>
                <p className="mt-5 border-t border-line pt-4 text-sm text-mute">{p.note}</p>
                <Link
                  href={user ? `/pricing?plan=${p.name.toLowerCase()}` : "/signup"}
                  className={`${p.accent ? "btn-volt" : "btn-ghost"} mt-6 w-full`}
                >
                  {p.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------- FINAL CTA ------------------------------ */}
      <section className="noise relative overflow-hidden border-t border-line">
        <img src="/images/hero-aurora.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/70 to-bg" />
        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-36">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Be someone&apos;s
              <span className="text-gradient-volt"> hero</span> —
              <br />
              starting this week.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-mute">
              Join the club, pick your charity, log five scores. The next draw is{" "}
              <span className="text-ink">{formatDate(nextDraw)}</span>.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-volt !px-8 !py-3.5">
                Become a Hero <ArrowRight className="size-4" />
              </Link>
              <Link href="/pricing" className="btn-ghost !px-8 !py-3.5">
                See pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
