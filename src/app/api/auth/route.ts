import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getSettings } from "@/lib/core";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "signup") {
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const charityId = body.charityId ? String(body.charityId) : null;

    if (fullName.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const s = await getSettings();
    const pct = Math.min(
      100,
      Math.max(s.minCharityPercent, Math.round(Number(body.charityPercent) || s.minCharityPercent))
    );

    const [user] = await db
      .insert(users)
      .values({ fullName, email, passwordHash: hashPassword(password), charityId, charityPercent: pct })
      .returning();

    await createSession(user.id);
    return NextResponse.json({ ok: true, redirect: "/pricing" });
  }

  if (action === "login") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true, redirect: user.role === "admin" ? "/admin" : "/dashboard" });
  }

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
