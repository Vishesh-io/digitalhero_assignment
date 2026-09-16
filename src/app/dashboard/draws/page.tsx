import { desc, eq } from "drizzle-orm";
import { Dices, Gem, Sigma } from "lucide-react";
import { db } from "@/db";
import { drawEntries, draws, winners } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getSettings, nextDrawDate } from "@/lib/core";
import { monthName } from "@/lib/engine";
import { formatDate, formatMoney, tierLabel } from "@/lib/money";
import { EmptyState, NumberBall, StatusBadge } from "@/components/ui";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Draws" };
export const dynamic = "force-dynamic";

export default async function DrawsPage() {
  const user = await requireUser();
  const s = await getSettings();
  const next = nextDrawDate(s);

  const publishedDraws = await db
    .select()
    .from(draws)
    .where(eq(draws.status, "published"))
    .orderBy(desc(draws.publishedAt))
    .limit(24);

  const myEntries = await db.select().from(drawEntries).where(eq(drawEntries.userId, user.id));
  const myWins = await db.select().from(winners).where(eq(winners.userId, user.id));
  const entryByDraw = new Map(myEntries.map((e) => [e.drawId, e]));
  const winByDraw = new Map(myWins.map((w) => [w.drawId, w]));

  return (
    <FadeInOnLoad>
      <p className="kicker">Monthly draws</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Draws</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Every published draw, the winning numbers, and how your five scores matched up.
      </p>

      {/* Next draw banner */}
      <div className="card mt-8 flex flex-col items-start justify-between gap-5 border-volt/30 bg-volt/[0.05] p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-volt text-[#0a0b0e]">
            <Dices className="size-6" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">Next draw — {formatDate(next)}</p>
            <p className="text-sm text-mute">
              Jackpot rollover of {formatMoney(s.jackpotRollover, { decimals: false })} is on the line.
            </p>
          </div>
        </div>
        <StatusBadge status={s.jackpotRollover > 0 ? "pending" : "active"} />
      </div>

      {publishedDraws.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Dices className="size-5" />}
            title="No draws published yet"
            body={`The first draw will be published after ${formatDate(next)}. Make sure your five scores are in.`}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {publishedDraws.map((d) => {
            const entry = entryByDraw.get(d.id);
            const win = winByDraw.get(d.id);
            return (
              <div key={d.id} className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {monthName(d.drawMonth)} {d.drawYear}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-mute">
                      {d.drawType === "algorithmic" ? (
                        <span className="inline-flex items-center gap-1 text-mint"><Sigma className="size-3" /> Algorithmic weighted</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Dices className="size-3" /> Random</span>
                      )}
                      · {d.subscriberCount} entrants · pool {formatMoney(d.totalPool, { decimals: false })}
                    </p>
                  </div>
                  {d.publishedAt && <span className="text-xs text-mute">Published {formatDate(d.publishedAt)}</span>}
                </div>

                <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="flex-1">
                    <p className="field-label">Winning numbers</p>
                    <div className="flex flex-wrap gap-2.5">
                      {(d.drawnNumbers ?? []).map((n) => (
                        <NumberBall key={n} n={n} tone={entry?.scoresSnapshot?.includes(n) ? "hit" : "volt"} />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="field-label">Your entry</p>
                    {entry ? (
                      <>
                        <div className="flex flex-wrap gap-2.5">
                          {(entry.scoresSnapshot ?? []).map((n, i) => (
                            <NumberBall key={i} n={n} tone={(d.drawnNumbers ?? []).includes(n) ? "hit" : "dim"} />
                          ))}
                        </div>
                        <p className="mt-3 text-sm">
                          {entry.tier ? (
                            <span className="chip !border-gold/40 !text-gold">
                              <Gem className="size-3.5" /> {tierLabel(entry.tier)} — {entry.matchCount} matches
                              {win ? ` · prize ${formatMoney(win.prize, { decimals: false })}` : ""}
                            </span>
                          ) : (
                            <span className="text-mute">
                              {entry.matchCount} match{entry.matchCount === 1 ? "" : "es"} — just short of the 3-match tier.
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-mute">You weren&apos;t a member for this draw.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FadeInOnLoad>
  );
}
