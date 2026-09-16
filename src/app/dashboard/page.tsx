import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  Dices,
  Gem,
  HandCoins,
  Heart,
  PartyPopper,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { db } from "@/db";
import { charities, donations, drawEntries, draws, winners } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import {
  getSettings,
  getUserSubscription,
  isSubscriptionActive,
  latestScoresFor,
  nextDrawDate,
} from "@/lib/core";
import { formatDate, formatMoney, tierLabel } from "@/lib/money";
import { NumberBall, StatusBadge } from "@/components/ui";
import { FadeInOnLoad } from "@/components/motion";
import { SubscriptionControls } from "@/components/dashboard-widgets";
import { SubscribeButton } from "@/components/public-forms";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>;
}) {
  const { activated } = await searchParams;
  const user = await requireUser();
  const [s, sub] = await Promise.all([
    getSettings(),
    getUserSubscription(user.id),
  ]);
  const active = isSubscriptionActive(sub);

  const [myScores, myDonations, myWins, charityRow, lastDrawRow, myEntries] = await Promise.all([
    latestScoresFor(user.id),
    db.select().from(donations).where(eq(donations.userId, user.id)),
    db.select().from(winners).where(eq(winners.userId, user.id)),
    user.charityId
      ? db.select().from(charities).where(eq(charities.id, user.charityId)).limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(draws)
      .where(eq(draws.status, "published"))
      .orderBy(desc(draws.publishedAt))
      .limit(1),
    db.select().from(drawEntries).where(eq(drawEntries.userId, user.id)),
  ]);

  const five = myScores.slice(0, 5);
  const charity = charityRow[0] ?? null;
  const totalGiven = myDonations.reduce((a, d) => a + d.amount, 0);
  const totalWon = myWins.reduce((a, w) => a + w.prize, 0);
  const nextDraw = nextDrawDate(s);
  const lastDraw = lastDrawRow[0] ?? null;
  const lastEntry = lastDraw ? myEntries.find((e) => e.drawId === lastDraw.id) : null;

  const entered = active && five.length > 0;

  return (
    <FadeInOnLoad>
      {activated === "1" && (
        <div className="card mb-6 flex items-center gap-3 border-volt/40 bg-volt/[0.07] p-4">
          <PartyPopper className="size-5 shrink-0 text-volt" />
          <p className="text-sm">
            <span className="font-semibold text-volt">Membership active.</span>{" "}
            <span className="text-mute">
              Your giving pledge has been logged to the charity ledger. Log five scores to enter the next draw.
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Member dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Hello, {user.fullName.split(" ")[0]}
          </h1>
        </div>
        <span className="chip"><CalendarDays className="size-3.5 text-volt" /> Next draw: {formatDate(nextDraw)}</span>
      </div>

      {/* Stat row */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: <Target className="size-4" />,
            label: "Draw entry",
            value: entered ? "Entered" : `${five.length}/5 scores`,
            ok: entered,
            href: "/dashboard/scores",
          },
          {
            icon: <HandCoins className="size-4" />,
            label: "Given to charity",
            value: formatMoney(totalGiven, { decimals: false }),
            ok: true,
            href: "/dashboard/charity",
          },
          {
            icon: <Trophy className="size-4" />,
            label: "Total winnings",
            value: formatMoney(totalWon, { decimals: false }),
            ok: true,
            href: "/dashboard/winnings",
          },
          {
            icon: <Dices className="size-4" />,
            label: "Draws entered",
            value: String(myEntries.length),
            ok: true,
            href: "/dashboard/draws",
          },
        ].map((st) => (
          <Link key={st.label} href={st.href} className="card group p-5 transition hover:border-volt/30">
            <span className="grid size-9 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
              {st.icon}
            </span>
            <p className={`mt-3 font-display text-xl font-semibold ${st.ok ? "" : "text-gold"}`}>{st.value}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-mute">
              {st.label} <ArrowRight className="size-3 opacity-0 transition group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Subscription card */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Membership</p>
            {sub ? <StatusBadge status={sub.status} /> : <StatusBadge status="inactive" />}
          </div>
          {sub && (active || sub.status !== "inactive") ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-mute">Plan</span>
                <span className="text-sm font-semibold capitalize">{sub.plan}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-mute">
                  {sub.status === "cancelled" ? "Access until" : "Renews"}
                </span>
                <span className="text-sm font-semibold">{formatDate(sub.currentPeriodEnd)}</span>
              </div>
              <div className="pt-2">
                <SubscriptionControls status={sub.status} isActive={active} />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-mute">
                You don&apos;t have an active membership yet. Activate one to log scores and enter the monthly draw.
              </p>
              <div className="mt-5 grid gap-2.5">
                <SubscribeButton authed plan="monthly" label={`Monthly — ${formatMoney(s.monthlyPrice, { decimals: false })}`} className="btn-volt w-full !py-2.5 text-xs" />
                <SubscribeButton authed plan="yearly" label={`Yearly — ${formatMoney(s.yearlyPrice, { decimals: false })}`} className="btn-ghost w-full !py-2.5 text-xs" />
              </div>
            </div>
          )}
        </div>

        {/* Charity card */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Your charity</p>
            <Link href="/dashboard/charity" className="chip hover:text-volt">
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          {charity ? (
            <div className="mt-4">
              <div className="flex items-center gap-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-line">
                  {charity.imageUrl && <img src={charity.imageUrl} alt={charity.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold">{charity.name}</p>
                  <p className="text-xs text-mute">{charity.category}</p>
                </div>
                <span className="ml-auto rounded-full bg-volt/15 px-3 py-1 text-sm font-bold text-volt">
                  {user.charityPercent}%
                </span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-mute">
                {user.charityPercent}% of every subscription payment goes to {charity.name}.
                {charity.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-gold">
                    {" "}<Sparkles className="size-3" /> Charity of the month
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="flex items-start gap-2 text-sm text-gold">
                <Heart className="mt-0.5 size-4 shrink-0" />
                You haven&apos;t chosen a charity — pick one so your payments know where to go.
              </p>
              <Link href="/dashboard/charity" className="btn-volt mt-4 !py-2.5 text-xs">
                Choose a charity
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Scores + last draw */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Latest five scores</p>
            <Link href="/dashboard/scores" className="chip hover:text-volt">
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          {five.length === 0 ? (
            <p className="mt-4 text-sm text-mute">No scores logged yet.</p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              {five.map((sc, i) => (
                <div key={sc.id} className="flex flex-col items-center gap-1.5">
                  <NumberBall n={sc.score} tone={i === 0 ? "volt" : "dim"} />
                  <span className="text-[10px] text-mute">{formatDate(sc.scoreDate)}</span>
                </div>
              ))}
            </div>
          )}
          {active && five.length > 0 && five.length < 3 && (
            <p className="mt-4 text-xs text-gold">
              You&apos;re entered, but you&apos;ll need at least 3 scores to be able to match a prize tier.
            </p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Last published draw</p>
            <Link href="/dashboard/draws" className="chip hover:text-volt">
              History <ArrowRight className="size-3" />
            </Link>
          </div>
          {lastDraw ? (
            <div className="mt-5">
              <div className="flex flex-wrap gap-3">
                {(lastDraw.drawnNumbers ?? []).map((n) => (
                  <NumberBall
                    key={n}
                    n={n}
                    tone={lastEntry?.scoresSnapshot?.includes(n) ? "hit" : "volt"}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {lastEntry ? (
                  lastEntry.tier ? (
                    <span className="chip !border-gold/40 !text-gold">
                      <Gem className="size-3.5" /> {tierLabel(lastEntry.tier)} winner — {lastEntry.matchCount} matches
                    </span>
                  ) : (
                    <span className="text-mute">You matched {lastEntry.matchCount} number{lastEntry.matchCount === 1 ? "" : "s"} — no prize this time.</span>
                  )
                ) : (
                  <span className="text-mute">You weren&apos;t entered in that draw.</span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-mute">The first draw hasn&apos;t been published yet — check back after {formatDate(nextDraw)}.</p>
          )}
        </div>
      </div>
    </FadeInOnLoad>
  );
}
