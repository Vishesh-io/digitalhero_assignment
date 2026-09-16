import { db } from "@/db";
import { donations, scores, subscriptions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/core";
import { UserManager, type AdminUserRow } from "@/components/admin-widgets";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Admin — Members" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const [allUsers, allSubs, allScores, allDonations] = await Promise.all([
    db.select().from(users),
    db.select().from(subscriptions),
    db.select({ userId: scores.userId }).from(scores),
    db.select({ userId: donations.userId, amount: donations.amount }).from(donations),
  ]);

  const scoreCounts = new Map<string, number>();
  for (const sc of allScores) scoreCounts.set(sc.userId, (scoreCounts.get(sc.userId) ?? 0) + 1);

  const givenBy = new Map<string, number>();
  for (const d of allDonations) {
    if (d.userId) givenBy.set(d.userId, (givenBy.get(d.userId) ?? 0) + d.amount);
  }

  const rows: AdminUserRow[] = allUsers.map((u) => {
    const sub = allSubs.find((s) => s.userId === u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      subStatus: sub ? (isSubscriptionActive(sub) ? "active" : sub.status) : "inactive",
      subPlan: sub?.plan ?? "",
      scoresCount: scoreCounts.get(u.id) ?? 0,
      given: givenBy.get(u.id) ?? 0,
    };
  });

  rows.sort((a, b) => (b.given - a.given) || a.fullName.localeCompare(b.fullName));

  return (
    <FadeInOnLoad>
      <p className="kicker">Community</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Member management</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Every member, their subscription state, score slots and lifetime giving.
      </p>

      <div className="mt-8">
        <UserManager users={rows} selfId={admin.id} />
      </div>
    </FadeInOnLoad>
  );
}
