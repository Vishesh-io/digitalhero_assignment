import { db } from "@/db";
import { charities as charitiesTable } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { CharityManager, type EditableCharity } from "@/components/admin-managers";
import { FadeInOnLoad } from "@/components/motion";
import { desc } from "drizzle-orm";

export const metadata = { title: "Admin — Charities" };
export const dynamic = "force-dynamic";

export default async function AdminCharitiesPage() {
  await requireAdmin();
  const rows = await db.select().from(charitiesTable).orderBy(desc(charitiesTable.isFeatured), desc(charitiesTable.createdAt));

  const items: EditableCharity[] = rows.map((c) => ({
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
    eventsJson: c.events && c.events.length > 0 ? JSON.stringify(c.events, null, 1) : "",
    isFeatured: c.isFeatured,
    isActive: c.isActive,
  }));

  return (
    <FadeInOnLoad>
      <p className="kicker">Directory</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Charity management</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Add and curate the charities members can support. Featured charities get the homepage spotlight.
      </p>

      <div className="mt-8">
        <CharityManager charities={items} />
      </div>
    </FadeInOnLoad>
  );
}
