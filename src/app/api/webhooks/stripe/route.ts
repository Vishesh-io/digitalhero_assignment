import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { getSettings } from "@/lib/core";

/**
 * Stripe webhook — only active when STRIPE_SECRET_KEY and
 * STRIPE_WEBHOOK_SECRET are configured. Demo mode does not use this.
 */
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 400 });
  }

  const stripe = new Stripe(key);
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan === "yearly" ? "yearly" : "monthly";
    if (userId) {
      const now = new Date();
      const end = new Date(now);
      if (plan === "yearly") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);
      await db
        .insert(subscriptions)
        .values({
          userId,
          plan,
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          stripeCustomerId: (session.customer as string) ?? null,
          stripeSubscriptionId: (session.subscription as string) ?? null,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            plan,
            status: "active",
            cancelAtPeriodEnd: false,
            currentPeriodStart: now,
            currentPeriodEnd: end,
            stripeCustomerId: (session.customer as string) ?? null,
            stripeSubscriptionId: (session.subscription as string) ?? null,
            updatedAt: now,
          },
        });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await db
      .update(subscriptions)
      .set({ status: "expired", cancelAtPeriodEnd: false, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = (invoice as { subscription?: string }).subscription;
    if (subId) {
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
    }
  }

  return NextResponse.json({ received: true });
}
