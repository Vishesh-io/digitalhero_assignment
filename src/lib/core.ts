import { cache } from "react";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  settings,
  subscriptions,
  scores,
  type Settings,
  type Subscription,
  type Score,
  type PlanType,
} from "@/db/schema";

/* --------------------------------- settings -------------------------------- */

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(settings).limit(1);
  if (rows[0]) return rows[0];
  const inserted = await db.insert(settings).values({ id: 1 }).returning();
  return inserted[0];
});

export function nextDrawDate(s: Settings): Date {
  const day = Math.min(Math.max(s.drawDay || 1, 1), 28);
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), day, 20, 0, 0);
  if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, day, 20, 0, 0);
  return d;
}

/* ------------------------------- subscriptions ----------------------------- */

export const getUserSubscription = cache(async (userId: string): Promise<Subscription | null> => {
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return rows[0] ?? null;
});

/** Active means paying now OR cancelled-but-still-in-paid-period. */
export function isSubscriptionActive(sub?: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (
    sub.status === "cancelled" &&
    sub.cancelAtPeriodEnd &&
    sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd) > new Date()
  ) {
    return true;
  }
  return false;
}

/** Monthly-equivalent gross contribution of a plan, in pence. */
export function planContributionPence(plan: PlanType | string, s: Settings): number {
  if (plan === "yearly") return Math.round(s.yearlyPrice / 12);
  return s.monthlyPrice;
}

/** Prize-pool contribution (pence) of one subscriber for one monthly draw. */
export function poolContributionPence(plan: PlanType | string, s: Settings): number {
  return Math.round((planContributionPence(plan, s) * s.prizePoolPercent) / 100);
}

/* ---------------------------------- scores --------------------------------- */

export async function latestScoresFor(userId: string): Promise<Score[]> {
  return db
    .select()
    .from(scores)
    .where(eq(scores.userId, userId))
    .orderBy(desc(scores.scoreDate), desc(scores.createdAt))
    .limit(5);
}

export type ScoreResult = { ok: boolean; error?: string; scores?: Score[] };

const SCORE_MIN = 1;
const SCORE_MAX = 45;

export async function addScoreForUser(userId: string, value: number, dateStr: string): Promise<ScoreResult> {
  const score = Math.round(Number(value));
  if (!Number.isFinite(score) || score < SCORE_MIN || score > SCORE_MAX) {
    return { ok: false, error: `Score must be a whole number between ${SCORE_MIN} and ${SCORE_MAX}.` };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) {
    return { ok: false, error: "A valid round date is required." };
  }
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  if (dateStr > todayStr) {
    return { ok: false, error: "Round date cannot be in the future." };
  }

  const existing = await db
    .select({ id: scores.id })
    .from(scores)
    .where(and(eq(scores.userId, userId), eq(scores.scoreDate, dateStr)))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "You already have a score logged for that date." };
  }

  await db.insert(scores).values({ userId, score, scoreDate: dateStr });

  // Rolling window: only the latest 5 scores are retained.
  const all = await db
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.userId, userId))
    .orderBy(desc(scores.scoreDate), desc(scores.createdAt));
  const overflow = all.slice(5);
  for (const row of overflow) {
    await db.delete(scores).where(eq(scores.id, row.id));
  }

  return { ok: true, scores: (await latestScoresFor(userId)).slice(0, 5) };
}

export async function deleteScoreForUser(userId: string, scoreId: string): Promise<ScoreResult> {
  await db.delete(scores).where(and(eq(scores.id, scoreId), eq(scores.userId, userId)));
  return { ok: true, scores: (await latestScoresFor(userId)).slice(0, 5) };
}

export async function updateScoreForUser(
  userId: string,
  scoreId: string,
  value: number,
  dateStr: string
): Promise<ScoreResult> {
  const score = Math.round(Number(value));
  if (!Number.isFinite(score) || score < SCORE_MIN || score > SCORE_MAX) {
    return { ok: false, error: `Score must be a whole number between ${SCORE_MIN} and ${SCORE_MAX}.` };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) {
    return { ok: false, error: "A valid round date is required." };
  }
  const dupe = await db
    .select({ id: scores.id })
    .from(scores)
    .where(and(eq(scores.userId, userId), eq(scores.scoreDate, dateStr), sql`${scores.id} <> ${scoreId}`))
    .limit(1);
  if (dupe.length > 0) {
    return { ok: false, error: "You already have a score logged for that date." };
  }
  await db
    .update(scores)
    .set({ score, scoreDate: dateStr })
    .where(and(eq(scores.id, scoreId), eq(scores.userId, userId)));
  return { ok: true, scores: (await latestScoresFor(userId)).slice(0, 5) };
}

export { SCORE_MIN, SCORE_MAX };
