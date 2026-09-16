import { randomInt } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  draws,
  drawEntries,
  winners,
  subscriptions,
  settings as settingsTable,
  type Draw,
  type DrawEntry,
  type Tier,
} from "@/db/schema";
import {
  getSettings,
  isSubscriptionActive,
  latestScoresFor,
  poolContributionPence,
} from "./core";

export const DRAW_NUMBER_MIN = 1;
export const DRAW_NUMBER_MAX = 45;
export const DRAW_NUMBER_COUNT = 5;

/* ------------------------------ number picking ----------------------------- */

export function pickRandomNumbers(): number[] {
  const pool = Array.from(
    { length: DRAW_NUMBER_MAX - DRAW_NUMBER_MIN + 1 },
    (_, i) => DRAW_NUMBER_MIN + i
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DRAW_NUMBER_COUNT).sort((a, b) => a - b);
}

/**
 * Algorithmic weighted draw — numbers are weighted by how frequently they
 * appear across every active subscriber's latest five Stableford scores
 * (Laplace-smoothed), then sampled without replacement.
 */
export function pickWeightedNumbers(freq: Map<number, number>): number[] {
  const pool = Array.from(
    { length: DRAW_NUMBER_MAX - DRAW_NUMBER_MIN + 1 },
    (_, i) => DRAW_NUMBER_MIN + i
  );
  const picked: number[] = [];
  const working = [...pool];
  while (picked.length < DRAW_NUMBER_COUNT && working.length > 0) {
    const weights = working.map((n) => (freq.get(n) ?? 0) + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = randomInt(0, total);
    let idx = 0;
    for (; idx < working.length; idx++) {
      roll -= weights[idx];
      if (roll < 0) break;
    }
    idx = Math.min(idx, working.length - 1);
    picked.push(working[idx]);
    working.splice(idx, 1);
  }
  return picked.sort((a, b) => a - b);
}

/* --------------------------------- matching -------------------------------- */

export function matchCountFor(userScores: number[], drawn: number[]): number {
  const drawnSet = new Set(drawn);
  return new Set(userScores.filter((n) => drawnSet.has(n))).size;
}

export function tierForCount(matchCount: number): Tier | null {
  if (matchCount >= 5) return "five";
  if (matchCount === 4) return "four";
  if (matchCount === 3) return "three";
  return null;
}

/* ------------------------------ draw lifecycle ----------------------------- */

export type SimulationResult = {
  draw: Draw;
  entries: (DrawEntry & { name: string; email: string })[];
  winnersByTier: Record<Tier, number>;
};

export async function runDrawSimulation(
  drawType: "random" | "algorithmic",
  actorId: string
): Promise<SimulationResult> {
  const s = await getSettings();

  // Everyone with an active (or in-grace) subscription participates.
  const allSubs = await db.select().from(subscriptions);
  const active = allSubs.filter(isSubscriptionActive);

  const entrants: { userId: string; plan: string; scores: number[] }[] = [];
  const freq = new Map<number, number>();
  for (const sub of active) {
    const latest = (await latestScoresFor(sub.userId)).slice(0, 5);
    const vals = latest.map((sc) => sc.score);
    for (const v of vals) freq.set(v, (freq.get(v) ?? 0) + 1);
    entrants.push({ userId: sub.userId, plan: sub.plan, scores: vals });
  }

  const numbers = drawType === "algorithmic" ? pickWeightedNumbers(freq) : pickRandomNumbers();

  const basePool = entrants.reduce((sum, e) => sum + poolContributionPence(e.plan, s), 0);
  const rolloverIn = s.jackpotRollover;
  const totalPool = basePool + rolloverIn;
  const fivePool = Math.round(totalPool * 0.4);
  const fourPool = Math.round(totalPool * 0.35);
  const threePool = Math.round(totalPool * 0.25);

  const now = new Date();

  // A simulation is disposable: clear previous unpublished draws.
  await db.delete(draws).where(eq(draws.status, "simulated"));

  const [draw] = await db
    .insert(draws)
    .values({
      drawMonth: now.getMonth() + 1,
      drawYear: now.getFullYear(),
      drawType,
      status: "simulated",
      drawnNumbers: numbers,
      subscriberCount: active.length,
      basePool,
      rolloverIn,
      totalPool,
      fivePool,
      fourPool,
      threePool,
      createdBy: actorId,
    })
    .returning();

  const userNames = new Map<string, { name: string; email: string }>();
  const { users } = await import("@/db/schema");
  const allUsers = await db
    .select({ id: users.id, name: users.fullName, email: users.email })
    .from(users);
  for (const u of allUsers) userNames.set(u.id, { name: u.name, email: u.email });

  const winnersByTier: Record<Tier, number> = { five: 0, four: 0, three: 0 };
  const entryRows: (DrawEntry & { name: string; email: string })[] = [];
  for (const e of entrants) {
    const mc = matchCountFor(e.scores, numbers);
    const tier = tierForCount(mc);
    if (tier) winnersByTier[tier] += 1;
    const [row] = await db
      .insert(drawEntries)
      .values({ drawId: draw.id, userId: e.userId, scoresSnapshot: e.scores, matchCount: mc, tier })
      .returning();
    entryRows.push({ ...row, name: userNames.get(e.userId)?.name ?? "Member", email: userNames.get(e.userId)?.email ?? "" });
  }

  entryRows.sort((a, b) => b.matchCount - a.matchCount);
  return { draw, entries: entryRows, winnersByTier };
}

export type PublishResult = {
  ok: boolean;
  error?: string;
  winnersCreated?: number;
  rolloverForNext?: number;
};

export async function publishDraw(drawId: string): Promise<PublishResult> {
  const rows = await db.select().from(draws).where(eq(draws.id, drawId)).limit(1);
  const draw = rows[0];
  if (!draw) return { ok: false, error: "Draw not found." };
  if (draw.status !== "simulated") return { ok: false, error: "Only a simulated draw can be published." };

  const entries = await db
    .select()
    .from(drawEntries)
    .where(eq(drawEntries.drawId, drawId))
    .orderBy(desc(drawEntries.matchCount));

  const byTier: Record<Tier, DrawEntry[]> = { five: [], four: [], three: [] };
  for (const e of entries) if (e.tier) byTier[e.tier].push(e);

  const poolFor = (t: Tier) => (t === "five" ? draw.fivePool : t === "four" ? draw.fourPool : draw.threePool);

  let winnersCreated = 0;
  for (const tier of ["five", "four", "three"] as Tier[]) {
    const group = byTier[tier];
    if (group.length === 0) continue;
    // Multiple winners in the same tier split the prize equally.
    const each = Math.floor(poolFor(tier) / group.length);
    for (const e of group) {
      await db.insert(winners).values({
        drawId,
        userId: e.userId,
        tier,
        matchCount: e.matchCount,
        prize: each,
      });
      winnersCreated += 1;
    }
  }

  await db
    .update(draws)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(draws.id, drawId));

  // Jackpot rollover only applies to the 5-match pool.
  const s = await getSettings();
  const rolloverForNext = byTier.five.length === 0 ? draw.fivePool : 0;
  await db
    .update(settingsTable)
    .set({ jackpotRollover: rolloverForNext, updatedAt: new Date() })
    .where(eq(settingsTable.id, s.id));

  return { ok: true, winnersCreated, rolloverForNext };
}

export function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en-GB", { month: "long" });
}
