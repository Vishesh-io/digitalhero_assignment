import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, donations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/core";

function periodEnd(plan: "monthly" | "yearly", from = new Date()) {
  const end = new Date(from);
  if (plan === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const s = await getSettings();

  /* -------------------------------- checkout ------------------------------- */
  if (action === "checkout") {
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    const origin = new URL(req.url).origin;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey);
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: user.email,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "gbp",
                unit_amount: plan === "yearly" ? s.yearlyPrice : s.monthlyPrice,
                recurring: { interval: plan === "yearly" ? "year" : "month" },
                product_data: { name: `Digital Heroes — ${plan} membership` },
              },
            },
          ],
          metadata: { userId: user.id, plan },
          success_url: `${origin}/dashboard?activated=1`,
          cancel_url: `${origin}/pricing`,
        });
        return NextResponse.json({ ok: true, url: session.url });
      } catch (err) {
        console.error("Stripe checkout failed:", err);
        return NextResponse.json({ error: "Could not start Stripe checkout." }, { status: 500 });
      }
    }

    // Demo gateway fallback when Stripe is not configured.
    return NextResponse.json({ ok: true, url: `/demo-checkout?plan=${plan}` });
  }

  /* --------------------------- demo activation ----------------------------- */
  if (action === "activate") {
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    const now = new Date();
    const end = periodEnd(plan, now);
    const price = plan === "yearly" ? s.yearlyPrice : s.monthlyPrice;

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(subscriptions)
        .set({
          plan,
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          updatedAt: now,
        })
        .where(eq(subscriptions.userId, user.id));
    } else {
      await db.insert(subscriptions).values({
        userId: user.id,
        plan,
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodStart: now,
        currentPeriodEnd: end,
      });
    }

    // Charity ledger: the member's pledge share of this payment.
    if (user.charityId) {
      const give = Math.round((price * user.charityPercent) / 100);
      if (give > 0) {
        await db.insert(donations).values({
          userId: user.id,
          charityId: user.charityId,
          amount: give,
          percent: user.charityPercent,
          kind: "subscription",
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  /* -------------------------------- cancel --------------------------------- */
  if (action === "cancel") {
    const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
    if (!rows[0]) return NextResponse.json({ error: "No subscription found." }, { status: 400 });
    await db
      .update(subscriptions)
      .set({ status: "cancelled", cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptions.userId, user.id));
    return NextResponse.json({ ok: true });
  }

  /* -------------------------------- resume --------------------------------- */
  if (action === "resume") {
    await db
      .update(subscriptions)
      .set({ status: "active", cancelAtPeriodEnd: false, updatedAt: new Date() })
      .where(eq(subscriptions.userId, user.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
