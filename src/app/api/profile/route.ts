import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { charities, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/core";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "charity") {
    const charityId = String(body.charityId ?? "");
    const rows = await db
      .select({ id: charities.id })
      .from(charities)
      .where(and(eq(charities.id, charityId), eq(charities.isActive, true)))
      .limit(1);
    if (!rows[0]) return NextResponse.json({ error: "That charity is not available." }, { status: 400 });
    await db.update(users).set({ charityId }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  }

  if (action === "percent") {
    const s = await getSettings();
    const pct = Math.round(Number(body.percent));
    if (!Number.isFinite(pct) || pct < s.minCharityPercent || pct > 100) {
      return NextResponse.json(
        { error: `Pledge must be between ${s.minCharityPercent}% and 100%.` },
        { status: 400 }
      );
    }
    await db.update(users).set({ charityPercent: pct }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true, percent: pct });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
