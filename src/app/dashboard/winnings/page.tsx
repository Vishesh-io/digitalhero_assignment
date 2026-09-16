import { desc, eq } from "drizzle-orm";
import { BadgeCheck, CircleAlert, Gem, Hourglass, Trophy, Wallet } from "lucide-react";
import { db } from "@/db";
import { draws, winners } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { monthName } from "@/lib/engine";
import { formatDate, formatMoney, tierLabel } from "@/lib/money";
import { EmptyState, NumberBall, StatusBadge } from "@/components/ui";
import { ProofUpload } from "@/components/dashboard-widgets";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Winnings" };
export const dynamic = "force-dynamic";

export default async function WinningsPage() {
  const user = await requireUser();

  const myWins = await db
    .select({ win: winners, draw: draws })
    .from(winners)
    .innerJoin(draws, eq(winners.drawId, draws.id))
    .where(eq(winners.userId, user.id))
    .orderBy(desc(winners.createdAt));

  const paidTotal = myWins.filter((w) => w.win.payment === "paid").reduce((a, w) => a + w.win.prize, 0);
  const pendingTotal = myWins
    .filter((w) => w.win.payment !== "paid" && w.win.verification !== "rejected")
    .reduce((a, w) => a + w.win.prize, 0);

  return (
    <FadeInOnLoad>
      <p className="kicker">Prizes</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Winnings</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Prizes are verified before payout — upload a screenshot of your scores from your golf platform,
        our team reviews it, then your prize is released.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="card p-5">
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-white/[0.04] text-volt">
            <Wallet className="size-4" />
          </span>
          <p className="mt-3 font-display text-2xl font-semibold text-volt">{formatMoney(paidTotal, { decimals: false })}</p>
          <p className="mt-0.5 text-xs text-mute">paid out to you</p>
        </div>
        <div className="card p-5">
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-white/[0.04] text-gold">
            <Hourglass className="size-4" />
          </span>
          <p className="mt-3 font-display text-2xl font-semibold text-gold">{formatMoney(pendingTotal, { decimals: false })}</p>
          <p className="mt-0.5 text-xs text-mute">in verification</p>
        </div>
      </div>

      {myWins.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Trophy className="size-5" />}
            title="No wins yet"
            body="Match 3, 4 or 5 of your latest scores in a monthly draw and your prizes will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {myWins.map(({ win, draw }) => (
            <div key={win.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !border-gold/40 !text-gold">
                      <Gem className="size-3.5" /> {tierLabel(win.tier)}
                    </span>
                    <StatusBadge status={win.verification} />
                    <StatusBadge status={win.payment} />
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold">{formatMoney(win.prize)}</p>
                  <p className="mt-1 text-xs text-mute">
                    {monthName(draw.drawMonth)} {draw.drawYear} draw · {win.matchCount} matches · won {formatDate(win.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(draw.drawnNumbers ?? []).map((n) => (
                    <NumberBall key={n} n={n} size="sm" tone="dim" />
                  ))}
                </div>
              </div>

              {win.verification === "pending_proof" && (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="mb-3 flex items-center gap-2 text-sm text-gold">
                    <CircleAlert className="size-4" /> Proof needed — upload your scorecard screenshot to unlock payout.
                  </p>
                  <ProofUpload winnerId={win.id} />
                </div>
              )}

              {win.verification === "rejected" && (
                <div className="mt-5 border-t border-line pt-5">
                  <p className="mb-1 flex items-center gap-2 text-sm text-ember">
                    <CircleAlert className="size-4" /> Proof was rejected{win.adminNotes ? `: ${win.adminNotes}` : "."}
                  </p>
                  <p className="mb-3 text-xs text-mute">Please upload a clearer screenshot showing your five rounds.</p>
                  <ProofUpload winnerId={win.id} />
                </div>
              )}

              {win.verification === "proof_submitted" && (
                <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-mint">
                  <Hourglass className="size-4" /> Proof received — an admin is reviewing it now.
                </p>
              )}

              {win.verification === "approved" && win.payment !== "paid" && (
                <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-volt">
                  <BadgeCheck className="size-4" /> Verified — payout is being processed.
                </p>
              )}

              {win.payment === "paid" && (
                <p className="mt-5 flex items-center gap-2 border-t border-line pt-5 text-sm text-volt">
                  <BadgeCheck className="size-4" /> Paid — congratulations again.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </FadeInOnLoad>
  );
}
