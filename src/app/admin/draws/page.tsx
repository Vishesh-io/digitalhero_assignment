import { desc, eq } from "drizzle-orm";
import { formatDate, formatMoney } from "@/lib/money";
import { monthName } from "@/lib/engine";
import { db } from "@/db";
import { drawEntries, draws, users, winners } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/core";
import { DrawManager, type SimDraw } from "@/components/admin-widgets";
import { NumberBall } from "@/components/ui";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Admin — Draws" };
export const dynamic = "force-dynamic";

export default async function AdminDrawsPage() {
  await requireAdmin();

  // Run independent queries in parallel
  const [s, simRows, published, allWinners] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(draws)
      .where(eq(draws.status, "simulated"))
      .orderBy(desc(draws.createdAt))
      .limit(1),
    db
      .select()
      .from(draws)
      .where(eq(draws.status, "published"))
      .orderBy(desc(draws.publishedAt))
      .limit(12),
    db.select({ drawId: winners.drawId }).from(winners),
  ]);

  let initial: SimDraw | null = null;
  if (simRows[0]) {
    const d = simRows[0];
    const entries = await db
      .select({ entry: drawEntries, name: users.fullName, email: users.email })
      .from(drawEntries)
      .innerJoin(users, eq(drawEntries.userId, users.id))
      .where(eq(drawEntries.drawId, d.id));
    const winnersByTier = { five: 0, four: 0, three: 0 };
    for (const e of entries) if (e.entry.tier) winnersByTier[e.entry.tier] += 1;
    entries.sort((a, b) => b.entry.matchCount - a.entry.matchCount);
    initial = {
      id: d.id,
      drawMonth: d.drawMonth,
      drawYear: d.drawYear,
      drawType: d.drawType,
      drawnNumbers: d.drawnNumbers ?? [],
      subscriberCount: d.subscriberCount,
      basePool: d.basePool,
      rolloverIn: d.rolloverIn,
      totalPool: d.totalPool,
      fivePool: d.fivePool,
      fourPool: d.fourPool,
      threePool: d.threePool,
      winnersByTier,
      entries: entries.map((e) => ({
        id: e.entry.id,
        name: e.name,
        email: e.email,
        scores: e.entry.scoresSnapshot ?? [],
        matchCount: e.entry.matchCount,
        tier: e.entry.tier,
      })),
    };
  }

  return (
    <FadeInOnLoad>
      <p className="kicker">Draw engine</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Draw management</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Simulate the monthly draw, review projected winners and splits, then publish.
        Jackpot rollover: <span className="font-semibold text-gold">{formatMoney(s.jackpotRollover, { decimals: false })}</span>.
      </p>

      <div className="mt-8">
        <DrawManager initial={initial} />
      </div>

      <div className="card mt-10 p-6">
        <p className="font-display text-lg font-semibold">Published draw history</p>
        {published.length === 0 ? (
          <p className="mt-4 text-sm text-mute">No draws published yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {published.map((d) => {
              const dw = allWinners.filter((w) => w.drawId === d.id);
              return (
                <div key={d.id} className="rounded-xl border border-line bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{monthName(d.drawMonth)} {d.drawYear}</p>
                      <p className="text-xs text-mute">
                        {d.drawType} · {d.subscriberCount} entrants · pool {formatMoney(d.totalPool, { decimals: false })} · {dw.length} winners
                      </p>
                    </div>
                    <span className="text-xs text-mute">{d.publishedAt ? formatDate(d.publishedAt) : ""}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(d.drawnNumbers ?? []).map((n) => (
                      <NumberBall key={n} n={n} size="sm" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FadeInOnLoad>
  );
}
