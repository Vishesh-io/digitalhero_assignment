import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Dices,
  Gem,
  ListOrdered,
  ShieldCheck,
  Sigma,
  Target,
  Trophy,
  UploadCloud,
  Users,
  Wallet,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, nextDrawDate } from "@/lib/core";
import { formatDate, formatMoney } from "@/lib/money";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { NumberBall, SectionHead } from "@/components/ui";

export const metadata = { title: "How it works", description: "Subscribe, log your five latest Stableford scores, support a charity with at least 10% of your fee, and match 3, 4 or 5 numbers to win the monthly prize pool." };
export const dynamic = "force-dynamic";

function Rule({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
        {icon}
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-mute">{body}</p>
      </div>
    </div>
  );
}

export default async function HowItWorksPage() {
  const user = await getCurrentUser();
  const s = await getSettings();
  const nextDraw = nextDrawDate(s);

  return (
    <div className="relative min-h-screen bg-bg">
      <SiteNav user={user ? { fullName: user.fullName, role: user.role } : null} />

      <section className="relative overflow-hidden border-b border-line">
        <div className="glow-volt absolute -right-32 top-10 size-[420px] rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6">
          <Reveal>
            <p className="kicker">The rules of the club</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              How Digital Heroes works
            </h1>
            <p className="mt-5 max-w-xl text-base text-mute">
              Everything is transparent — how scores become entries, how pools are funded,
              and how winners are verified and paid.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Step detail */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
          <Reveal>
            <div className="card h-full p-7">
              <span className="chip mb-5"><CreditCard className="size-3.5 text-volt" /> Step 01</span>
              <h2 className="font-display text-2xl font-semibold">Subscribe & pledge</h2>
              <ul className="mt-5 space-y-4 text-sm leading-relaxed text-mute">
                <li>Monthly ({formatMoney(s.monthlyPrice)}) or yearly ({formatMoney(s.yearlyPrice)}) membership.</li>
                <li>Pick any charity from our directory during signup — switch later any time.</li>
                <li>Your giving pledge starts at {s.minCharityPercent}% of your subscription. Increase it whenever you like.</li>
                <li>Only active subscribers enter the monthly draw.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-7">
              <span className="chip mb-5"><Target className="size-3.5 text-volt" /> Step 02</span>
              <h2 className="font-display text-2xl font-semibold">Log Stableford scores</h2>
              <ul className="mt-5 space-y-4 text-sm leading-relaxed text-mute">
                <li>Scores must be whole numbers between <span className="text-ink">1 and 45</span>.</li>
                <li>Every score is tied to the date of the round — <span className="text-ink">one score per date</span>; duplicates are rejected.</li>
                <li>We only ever keep your <span className="text-ink">five most recent</span> scores — a new round automatically drops the oldest.</li>
                <li>Your latest five scores are your entry for every draw.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="card h-full p-7">
              <span className="chip mb-5"><Trophy className="size-3.5 text-volt" /> Step 03</span>
              <h2 className="font-display text-2xl font-semibold">The monthly draw</h2>
              <ul className="mt-5 space-y-4 text-sm leading-relaxed text-mute">
                <li>Five unique numbers between 1 and 45 are drawn each month.</li>
                <li>Match <span className="text-ink">3, 4 or 5</span> of your scores against the drawn numbers to win.</li>
                <li>Draws are always simulated first, reviewed, then published by the club.</li>
                <li>Next draw: <span className="text-ink">{formatDate(nextDraw)}</span>.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Draw mechanics */}
      <section className="border-y border-line bg-panel/60 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <SectionHead
              align="left"
              kicker="Draw mechanics"
              title="Two draw engines, always fair"
              sub="The club chooses the engine per draw. Both produce five unique numbers between 1 and 45."
            />
            <div className="mt-8 space-y-6">
              <Rule
                icon={<Dices className="size-4.5" />}
                title="Random draw"
                body="A straight cryptographically-random pick of five unique numbers. Pure chance, like any raffle."
              />
              <Rule
                icon={<Sigma className="size-4.5" />}
                title="Algorithmic weighted draw"
                body="Numbers are weighted by how often each value appears across every subscriber's latest five scores, then sampled without replacement. Popular scores get slightly higher odds — the weighting table is auditable."
              />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="card p-8">
              <p className="field-label">An example draw</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {[7, 12, 19, 28, 36].map((n) => (
                  <NumberBall key={n} n={n} size="lg" />
                ))}
              </div>
              <div className="mt-7 border-t border-line pt-5">
                <p className="field-label">Your latest five scores</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {[12, 19, 24, 28, 33, ].map((n, i) => (
                    <NumberBall key={i} n={n} tone={[12, 19, 28].includes(n) ? "hit" : "dim"} />
                  ))}
                </div>
                <p className="mt-4 text-sm text-mute">
                  You matched <span className="font-semibold text-mint">12, 19 and 28</span> — that&apos;s a{" "}
                  <span className="font-semibold text-ink">3-match</span>, worth 25% of the pool, split with any
                  other 3-match winners.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pools & rollover */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          kicker="Pools, splits & rollover"
          title="Where every pound goes"
          sub="A fixed, published split — no hidden maths."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: <Gem className="size-5" />,
              h: "5-match — 40% jackpot",
              p: "The big one. If nobody matches all five, this entire tier rolls forward into next month's jackpot. It keeps growing until someone wins it.",
            },
            {
              icon: <Trophy className="size-5" />,
              h: "4-match — 35%",
              p: "A serious prize for four matches. Shared equally between everyone who matches four. Never rolls over — it's won or it rests.",
            },
            {
              icon: <Target className="size-5" />,
              h: "3-match — 25%",
              p: "The most common win. Shared equally between all three-match winners. Keeps the club rewarding even when the jackpot evades everyone.",
            },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="card h-full p-7">
                <span className="grid size-11 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                  {c.icon}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{c.h}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mute">{c.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-6">
          <div className="card flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
              <Wallet className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">Pool size = members × plan × {s.prizePoolPercent}%</h3>
              <p className="mt-1 text-sm text-mute">
                Every active subscriber contributes {s.prizePoolPercent}% of their monthly-equivalent fee
                ({formatMoney(s.monthlyPrice)} monthly, {formatMoney(s.yearlyPrice)} yearly) to the pool,
                plus any jackpot rollover.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Verification */}
      <section className="border-t border-line bg-panel/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            kicker="Verification & payout"
            title="Win it. Prove it. Get paid."
          />
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ListOrdered className="size-5" />, h: "1. Draw published", p: "Winners are created instantly from matched entries." },
              { icon: <UploadCloud className="size-5" />, h: "2. Upload proof", p: "Winners upload a screenshot from their golf platform as proof of scores." },
              { icon: <BadgeCheck className="size-5" />, h: "3. Club review", p: "An admin approves or rejects each proof with notes." },
              { icon: <ShieldCheck className="size-5" />, h: "4. Payout", p: "Approved prizes are marked paid and transferred to the winner." },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="card h-full p-6">
                  <span className="grid size-10 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
                    {c.icon}
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{c.h}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-mute">{c.p}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 text-center">
            <p className="mb-6 flex items-center justify-center gap-2 text-sm text-mute">
              <CalendarClock className="size-4 text-volt" /> Next draw: {formatDate(nextDraw)}
            </p>
            <Link href="/signup" className="btn-volt !px-8 !py-3.5">
              Join the club <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
