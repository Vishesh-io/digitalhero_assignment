import { db } from "@/db";
import { charities as charitiesTable, donations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { CharityDirectory } from "@/components/charity-directory";
import { formatMoney } from "@/lib/money";
import { eq } from "drizzle-orm";

export const metadata = { title: "Charities", description: "Browse the Digital Heroes charity directory. Choose who your subscription supports — every Hero picks one cause to fund with at least 10% of their membership." };
export const dynamic = "force-dynamic";

export default async function CharitiesPage() {
  const user = await getCurrentUser();
  const rows = await db.select().from(charitiesTable).where(eq(charitiesTable.isActive, true));
  const allDonations = await db.select().from(donations);

  const raised: Record<string, number> = {};
  for (const d of allDonations) {
    if (d.charityId) raised[d.charityId] = (raised[d.charityId] ?? 0) + d.amount;
  }

  const list = rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    tagline: c.tagline ?? "",
    category: c.category ?? "Community",
    description: c.description ?? "",
    impact: c.impact ?? "",
    imageUrl: c.imageUrl ?? "",
    websiteUrl: c.websiteUrl ?? "",
    location: c.location ?? "",
    events: c.events ?? [],
    isFeatured: c.isFeatured,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  const totalRaised = Object.values(raised).reduce((a, b) => a + b, 0);

  return (
    <div className="relative min-h-screen bg-bg">
      <SiteNav user={user ? { fullName: user.fullName, role: user.role } : null} />

      <section className="relative overflow-hidden border-b border-line">
        <div className="glow-volt absolute -left-32 top-16 size-[400px] rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-32 sm:px-6">
          <Reveal>
            <p className="kicker">The directory</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Choose who your game supports
            </h1>
            <p className="mt-5 max-w-xl text-base text-mute">
              Every Hero picks one charity. Together, members have raised{" "}
              <span className="font-semibold text-volt">{formatMoney(totalRaised, { decimals: false })}</span>{" "}
              across the directory.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <CharityDirectory charities={list} raised={raised} />
      </section>

      <SiteFooter />
    </div>
  );
}
