import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, HandCoins, Heart } from "lucide-react";
import { db } from "@/db";
import { charities as charitiesTable, donations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/core";
import { formatDate, formatMoney } from "@/lib/money";
import { CharityPicker, DonationBox } from "@/components/dashboard-widgets";
import { FadeInOnLoad } from "@/components/motion";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Charity & giving" };
export const dynamic = "force-dynamic";

export default async function CharityDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ donate?: string }>;
}) {
  const { donate } = await searchParams;
  const user = await requireUser();
  const s = await getSettings();

  const [allCharities, myDonations] = await Promise.all([
    db
      .select({ id: charitiesTable.id, name: charitiesTable.name, slug: charitiesTable.slug, imageUrl: charitiesTable.imageUrl, isFeatured: charitiesTable.isFeatured })
      .from(charitiesTable)
      .where(eq(charitiesTable.isActive, true)),
    db.select().from(donations).where(eq(donations.userId, user.id)).orderBy(desc(donations.createdAt)),
  ]);

  const charityNames = new Map(allCharities.map((c) => [c.id, c.name]));
  const current = allCharities.find((c) => c.id === user.charityId) ?? null;
  const totalGiven = myDonations.reduce((a, d) => a + d.amount, 0);

  return (
    <FadeInOnLoad>
      <p className="kicker">Giving</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Charity & giving</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Choose who your subscription supports, raise your pledge, or make independent donations outside the game.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <p className="font-display text-lg font-semibold">Your pledge</p>
          {current && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-volt/25 bg-volt/[0.05] p-4">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line">
                {current.imageUrl && <img src={current.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.name}</p>
                <Link href={`/charities/${current.slug}`} className="inline-flex items-center gap-1 text-xs text-volt hover:underline">
                  View profile <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <span className="ml-auto rounded-full bg-volt/15 px-2.5 py-1 text-xs font-bold text-volt">
                {user.charityPercent}%
              </span>
            </div>
          )}
          <div className="mt-5">
            <CharityPicker
              charities={allCharities.map((c) => ({ id: c.id, name: c.name }))}
              currentId={user.charityId}
              percent={user.charityPercent}
              minPercent={s.minCharityPercent}
            />
          </div>
        </div>

        <div className="card p-6">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <HandCoins className="size-5 text-volt" /> Independent donation
          </p>
          <p className="mt-1.5 text-xs text-mute">
            Feel generous between draws? These go 100% to the chosen charity&apos;s ledger.
          </p>
          <div className="mt-5">
            <DonationBox
              charities={allCharities.map((c) => ({ id: c.id, name: c.name }))}
              preselect={donate ?? user.charityId}
            />
          </div>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">Your giving ledger</p>
          <span className="chip !border-volt/30 !text-volt">
            <Heart className="size-3.5" /> {formatMoney(totalGiven, { decimals: false })} lifetime
          </span>
        </div>
        {myDonations.length === 0 ? (
          <div className="mt-6"><EmptyState icon={<HandCoins className="size-5" />} title="Nothing here yet" body="Your subscription pledges and direct donations will appear here." /></div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Charity</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Pledge</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {myDonations.map((d) => (
                  <tr key={d.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-4 text-mute">{formatDate(d.createdAt)}</td>
                    <td className="py-3 pr-4 font-medium">{d.charityId ? charityNames.get(d.charityId) ?? "—" : "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`chip !text-[10px] ${d.kind === "direct" ? "!border-gold/40 !text-gold" : ""}`}>
                        {d.kind === "direct" ? "Direct donation" : "Subscription pledge"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-mute">{d.percent}%</td>
                    <td className="py-3 text-right font-semibold text-volt">{formatMoney(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FadeInOnLoad>
  );
}
