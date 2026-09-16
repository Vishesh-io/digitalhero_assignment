import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  CircleAlert,
  Dices,
  Gem,
  HandCoins,
  Trophy,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { donations, draws, subscriptions, users, winners } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getSettings, isSubscriptionActive, nextDrawDate, poolContributionPence } from "@/lib/core";
import { formatDate, formatMoney, tierLabel } from "@/lib/money";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const s = await getSettings();

  const [allUsers, allSubs, allDonations, allWinners, publishedDraws] = await Promise.all([
    db.select().from(users),
    db.select().from(subscriptions),
    db.select().from(donations),
    db.select().from(winners),
    db.select().from(draws).where(eq(draws.status, "published")).orderBy(desc(draws.publishedAt)).limit(1),
  ]);

  const activeSubs = allSubs.filter(isSubscriptionActive);
  const totalRaised = allDonations.reduce((a, d) => a + d.amount, 0);
  const prizesPaid = allWinners.filter((w) => w.payment === "paid").reduce((a, w) => a + w.prize, 0);
  const pendingReview = allWinners.filter((w) => w.verification === "proof_submitted");
  const unpaidApproved = allWinners.filter((w) => w.verification === "approved" && w.payment !== "paid");
  const estimatedPool =
    activeSubs.reduce((sum, sub) => sum + poolContributionPence(sub.plan, s), 0) + s.jackpotRollover;
  const members = allUsers.filter((u) => u.role !== "admin");

  const stats = [
    { icon: <Users className="size-4" />, label: "Members", value: String(members.length), sub: `${activeSubs.length} active subscribers`, href: "/admin/users" },
    { icon: <HandCoins className="size-4" />, label: "Raised for charity", value: formatMoney(totalRaised, { decimals: false }), sub: `across ${new Set(allDonations.map((d) => d.charityId)).size} charities`, href: "/admin/charities" },
    { icon: <Gem className="size-4" />, label: "Next pool (est.)", value: formatMoney(estimatedPool, { decimals: false }), sub: `incl. ${formatMoney(s.jackpotRollover, { decimals: false })} rollover`, href: "/admin/draws" },
    { icon: <Trophy className="size-4" />, label: "Prizes paid", value: formatMoney(prizesPaid, { decimals: false }), sub: `${allWinners.length} total winners`, href: "/admin/winners" },
  ];

  return (
    <FadeInOnLoad>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Command centre</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Admin overview</h1>
        </div>
        <span className="chip"><Dices className="size-3.5 text-volt" /> Next draw: {formatDate(nextDrawDate(s))}</span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((st) => (
          <Link key={st.label} href={st.href} className="card group p-5 transition hover:border-volt/30">
            <span className="grid size-9 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
              {st.icon}
            </span>
            <p className="mt-3 font-display text-2xl font-semibold">{st.value}</p>
            <p className="mt-0.5 text-xs font-medium text-ink/80">{st.label}</p>
            <p className="text-xs text-mute">{st.sub}</p>
          </Link>
        ))}
      </div>

      {(pendingReview.length > 0 || unpaidApproved.length > 0) && (
        <div className="card mt-6 border-gold/30 bg-gold/[0.04] p-6">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <CircleAlert className="size-5 text-gold" /> Action needed
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {pendingReview.length > 0 && (
              <Link href="/admin/winners" className="chip !border-gold/40 !text-gold">
                {pendingReview.length} proof{pendingReview.length === 1 ? "" : "s"} awaiting review <ArrowRight className="size-3" />
              </Link>
            )}
            {unpaidApproved.length > 0 && (
              <Link href="/admin/winners" className="chip !border-gold/40 !text-gold">
                {unpaidApproved.length} approved · unpaid payout{unpaidApproved.length === 1 ? "" : "s"} <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Winning tiers */}
        <div className="card p-6">
          <p className="font-display text-lg font-semibold">Winners by tier</p>
          <div className="mt-4 space-y-3">
            {(["five", "four", "three"] as const).map((tier) => {
              const group = allWinners.filter((w) => w.tier === tier);
              const paid = group.filter((w) => w.payment === "paid").reduce((a, w) => a + w.prize, 0);
              return (
                <div key={tier} className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-3">
                  <span className="text-sm font-medium">{tierLabel(tier)}</span>
                  <span className="text-sm text-mute">
                    {group.length} winner{group.length === 1 ? "" : "s"} ·{" "}
                    <span className="text-gold">{formatMoney(paid, { decimals: false })} paid</span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-mute">
            Last published draw:{" "}
            {publishedDraws[0]?.publishedAt ? formatDate(publishedDraws[0].publishedAt) : "never"} — run simulations from{" "}
            <Link href="/admin/draws" className="text-volt hover:underline">Draws</Link>.
          </p>
        </div>

        {/* Recent signups */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Newest members</p>
            <Link href="/admin/users" className="chip hover:text-volt">All members <ArrowRight className="size-3" /></Link>
          </div>
          <ul className="mt-4 space-y-3">
            {[...allUsers]
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, 5)
              .map((u) => {
                const sub = allSubs.find((x) => x.userId === u.id);
                return (
                  <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.fullName}</p>
                      <p className="truncate text-xs text-mute">{u.email}</p>
                    </div>
                    <span className={`chip shrink-0 !text-[10px] ${isSubscriptionActive(sub) ? "!border-volt/40 !text-volt" : ""}`}>
                      {isSubscriptionActive(sub) ? "active" : sub?.status ?? "inactive"}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </FadeInOnLoad>
  );
}
