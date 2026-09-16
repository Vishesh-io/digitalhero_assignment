import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { charities, draws, settings as settingsTable, users, winners } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/core";
import { publishDraw, runDrawSimulation } from "@/lib/engine";
import { slugify } from "@/lib/money";

async function requireAdminJson() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Please log in first." }, { status: 401 }) };
  if (user.role !== "admin")
    return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  return { user };
}

type CharityPayload = {
  name?: string;
  tagline?: string;
  category?: string;
  description?: string;
  impact?: string;
  imageUrl?: string;
  websiteUrl?: string;
  location?: string;
  eventsJson?: string;
  isFeatured?: boolean;
  isActive?: boolean;
};

function parseCharity(body: CharityPayload) {
  let events: { title: string; date: string; location: string; description?: string }[] = [];
  if (body.eventsJson && body.eventsJson.trim()) {
    try {
      const parsed = JSON.parse(body.eventsJson);
      if (Array.isArray(parsed)) {
        events = parsed
          .filter((e) => e && typeof e.title === "string")
          .map((e) => ({
            title: String(e.title).slice(0, 120),
            date: String(e.date ?? "").slice(0, 40),
            location: String(e.location ?? "").slice(0, 120),
            description: e.description ? String(e.description).slice(0, 400) : undefined,
          }))
          .slice(0, 6);
      }
    } catch {
      return { error: "Events must be valid JSON, e.g. [{\"title\":\"Charity Golf Day\",\"date\":\"12 Jun\",\"location\":\"St Andrews\"}]" };
    }
  }
  return {
    name: String(body.name ?? "").trim().slice(0, 120),
    tagline: String(body.tagline ?? "").trim().slice(0, 200),
    category: String(body.category ?? "Community").trim().slice(0, 60) || "Community",
    description: String(body.description ?? "").trim(),
    impact: String(body.impact ?? "").trim(),
    imageUrl: String(body.imageUrl ?? "").trim(),
    websiteUrl: String(body.websiteUrl ?? "").trim(),
    location: String(body.location ?? "").trim().slice(0, 120),
    events,
    isFeatured: !!body.isFeatured,
    isActive: body.isActive !== false,
  };
}

export async function POST(req: Request) {
  const auth = await requireAdminJson();
  if ("error" in auth) return auth.error;
  const admin = auth.user;

  const body = await req.json().catch(() => ({}));
  const { resource, action } = body as { resource?: string; action?: string };

  /* -------------------------------- charities ------------------------------ */
  if (resource === "charity") {
    const data = parseCharity(body);
    if ("error" in data) return NextResponse.json({ error: data.error }, { status: 400 });
    if (!data.name) return NextResponse.json({ error: "Charity name is required." }, { status: 400 });

    if (action === "create") {
      const base = slugify(data.name) || "charity";
      const all = await db.select({ slug: charities.slug }).from(charities);
      const taken = new Set(all.map((c) => c.slug));
      let slug = base;
      let i = 2;
      while (taken.has(slug)) slug = `${base}-${i++}`;
      const [row] = await db.insert(charities).values({ ...data, slug }).returning();
      return NextResponse.json({ ok: true, charity: row });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      await db.update(charities).set(data).where(eq(charities.id, id));
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      await db.delete(charities).where(eq(charities.id, id));
      return NextResponse.json({ ok: true });
    }
  }

  /* --------------------------------- draws --------------------------------- */
  if (resource === "draw") {
    if (action === "simulate") {
      const drawType = body.drawType === "algorithmic" ? "algorithmic" : "random";
      const result = await runDrawSimulation(drawType, admin.id);
      return NextResponse.json({
        ok: true,
        draw: result.draw,
        winnersByTier: result.winnersByTier,
        entries: result.entries.slice(0, 50).map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          scores: e.scoresSnapshot,
          matchCount: e.matchCount,
          tier: e.tier,
        })),
      });
    }

    if (action === "publish") {
      const result = await publishDraw(String(body.drawId ?? ""));
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    if (action === "discard") {
      const id = String(body.drawId ?? "");
      await db.delete(draws).where(eq(draws.id, id));
      return NextResponse.json({ ok: true });
    }
  }

  /* -------------------------------- winners -------------------------------- */
  if (resource === "winner") {
    const winnerId = String(body.winnerId ?? body.id ?? "");

    if (action === "review") {
      const approve = !!body.approve;
      await db
        .update(winners)
        .set({
          verification: approve ? "approved" : "rejected",
          adminNotes: String(body.notes ?? "").slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(winners.id, winnerId));
      return NextResponse.json({ ok: true });
    }

    if (action === "pay") {
      const rows = await db.select().from(winners).where(eq(winners.id, winnerId)).limit(1);
      if (!rows[0]) return NextResponse.json({ error: "Winner not found." }, { status: 404 });
      if (rows[0].verification !== "approved") {
        return NextResponse.json({ error: "Winner must be approved before payout." }, { status: 400 });
      }
      await db.update(winners).set({ payment: "paid", updatedAt: new Date() }).where(eq(winners.id, winnerId));
      return NextResponse.json({ ok: true });
    }
  }

  /* -------------------------------- settings ------------------------------- */
  if (resource === "settings" && action === "update") {
    const s = await getSettings();
    const monthly = Math.round(Number(body.monthlyPrice) * 100);
    const yearly = Math.round(Number(body.yearlyPrice) * 100);
    const poolPct = Math.round(Number(body.prizePoolPercent));
    const minPct = Math.round(Number(body.minCharityPercent));
    const drawDay = Math.round(Number(body.drawDay));

    if (!Number.isFinite(monthly) || monthly < 100)
      return NextResponse.json({ error: "Monthly price must be at least £1." }, { status: 400 });
    if (!Number.isFinite(yearly) || yearly < 100)
      return NextResponse.json({ error: "Yearly price must be at least £1." }, { status: 400 });
    if (poolPct < 1 || poolPct > 90)
      return NextResponse.json({ error: "Prize pool percentage must be 1–90." }, { status: 400 });
    if (minPct < 1 || minPct > 100)
      return NextResponse.json({ error: "Minimum charity percentage must be 1–100." }, { status: 400 });
    if (drawDay < 1 || drawDay > 28)
      return NextResponse.json({ error: "Draw day must be between 1 and 28." }, { status: 400 });

    await db
      .update(settingsTable)
      .set({
        monthlyPrice: monthly,
        yearlyPrice: yearly,
        prizePoolPercent: poolPct,
        minCharityPercent: minPct,
        drawDay,
        updatedAt: new Date(),
      })
      .where(eq(settingsTable.id, s.id));
    return NextResponse.json({ ok: true });
  }

  /* --------------------------------- users --------------------------------- */
  if (resource === "user") {
    if (action === "role") {
      const id = String(body.userId ?? "");
      const role = body.role === "admin" ? "admin" : "subscriber";
      if (id === admin.id && role !== "admin") {
        return NextResponse.json({ error: "You cannot demote yourself." }, { status: 400 });
      }
      await db.update(users).set({ role }).where(eq(users.id, id));
      return NextResponse.json({ ok: true });
    }

    if (action === "scores") {
      const { scores } = await import("@/db/schema");
      const { desc } = await import("drizzle-orm");
      const userId = String(body.userId ?? "");
      const rows = await db
        .select()
        .from(scores)
        .where(eq(scores.userId, userId))
        .orderBy(desc(scores.scoreDate), desc(scores.createdAt))
        .limit(5);
      return NextResponse.json({
        ok: true,
        scores: rows.map((s) => ({
          id: s.id,
          score: s.score,
          date: typeof s.scoreDate === "string" ? s.scoreDate : s.scoreDate,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    }

    if (action === "delete-score") {
      const { scores } = await import("@/db/schema");
      const scoreId = String(body.scoreId ?? "");
      await db.delete(scores).where(eq(scores.id, scoreId));
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ error: "Unknown admin operation." }, { status: 400 });
}
