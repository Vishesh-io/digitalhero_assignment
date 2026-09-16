import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { charities, donations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to donate." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const charityId = String(body.charityId ?? "");
  const pounds = Number(body.amount);
  const pence = Math.round(pounds * 100);

  if (!Number.isFinite(pence) || pence < 100) {
    return NextResponse.json({ error: "Minimum donation is £1." }, { status: 400 });
  }
  if (pence > 100_000_00) {
    return NextResponse.json({ error: "Please contact the club for donations over £100,000." }, { status: 400 });
  }

  const rows = await db
    .select({ id: charities.id })
    .from(charities)
    .where(and(eq(charities.id, charityId), eq(charities.isActive, true)))
    .limit(1);
  if (!rows[0]) return NextResponse.json({ error: "That charity is not available." }, { status: 400 });

  await db.insert(donations).values({
    userId: user.id,
    charityId,
    amount: pence,
    percent: 100,
    kind: "direct",
  });

  return NextResponse.json({ ok: true });
}
