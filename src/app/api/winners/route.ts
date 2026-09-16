import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { winners } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 1.5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });

  const winnerId = String(form.get("winnerId") ?? "");
  const file = form.get("file");

  const rows = await db
    .select()
    .from(winners)
    .where(and(eq(winners.id, winnerId), eq(winners.userId, user.id)))
    .limit(1);
  const win = rows[0];
  if (!win) return NextResponse.json({ error: "Winner record not found." }, { status: 404 });
  if (win.verification !== "pending_proof" && win.verification !== "rejected") {
    return NextResponse.json({ error: "Proof already submitted for this win." }, { status: 400 });
  }

  if (!(file instanceof File)) return NextResponse.json({ error: "Please attach a screenshot." }, { status: 400 });
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Proof must be a PNG, JPG, WebP or GIF image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Screenshot must be smaller than 1.5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await db
    .update(winners)
    .set({
      proofUrl: dataUrl,
      verification: "proof_submitted",
      adminNotes: "",
      updatedAt: new Date(),
    })
    .where(eq(winners.id, win.id));

  return NextResponse.json({ ok: true });
}
