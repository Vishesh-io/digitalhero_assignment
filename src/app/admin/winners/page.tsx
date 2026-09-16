import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { draws, users, winners } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { monthName } from "@/lib/engine";
import { WinnerManager, type AdminWinnerRow } from "@/components/admin-managers";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Admin — Winners" };
export const dynamic = "force-dynamic";

export default async function AdminWinnersPage() {
  await requireAdmin();

  const rows = await db
    .select({ win: winners, name: users.fullName, email: users.email, draw: draws })
    .from(winners)
    .innerJoin(users, eq(winners.userId, users.id))
    .innerJoin(draws, eq(winners.drawId, draws.id))
    .orderBy(desc(winners.createdAt));

  const items: AdminWinnerRow[] = rows.map((r) => ({
    id: r.win.id,
    userName: r.name,
    userEmail: r.email,
    drawLabel: `${monthName(r.draw.drawMonth)} ${r.draw.drawYear}`,
    tier: r.win.tier,
    matchCount: r.win.matchCount,
    prize: r.win.prize,
    verification: r.win.verification,
    payment: r.win.payment,
    proofUrl: r.win.proofUrl,
    adminNotes: r.win.adminNotes,
    createdAt: r.win.createdAt.toISOString(),
  }));

  return (
    <FadeInOnLoad>
      <p className="kicker">Verification & payouts</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Winner management</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Review uploaded proof of scores, approve or reject with notes, then mark payouts as completed.
      </p>

      <div className="mt-8">
        <WinnerManager winners={items} />
      </div>
    </FadeInOnLoad>
  );
}
