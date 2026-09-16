import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addScoreForUser,
  deleteScoreForUser,
  getUserSubscription,
  isSubscriptionActive,
  updateScoreForUser,
} from "@/lib/core";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };

  if (action === "add") {
    const sub = await getUserSubscription(user.id);
    if (!isSubscriptionActive(sub)) {
      return NextResponse.json(
        { error: "An active subscription is required to log scores." },
        { status: 403 }
      );
    }
    const result = await addScoreForUser(user.id, Number(body.score), String(body.date ?? ""));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, scores: result.scores });
  }

  if (action === "update") {
    const result = await updateScoreForUser(
      user.id,
      String(body.id ?? ""),
      Number(body.score),
      String(body.date ?? "")
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, scores: result.scores });
  }

  if (action === "delete") {
    const result = await deleteScoreForUser(user.id, String(body.id ?? ""));
    return NextResponse.json({ ok: true, scores: result.scores });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
