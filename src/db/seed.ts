/* Seed script: run with `npx tsx src/db/seed.ts` */
import { config } from "dotenv";
config();

import { randomBytes, scryptSync } from "crypto";
import { desc, eq } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

// Deterministic RNG so seeds are stable
let seedState = 42;
function rnd() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
function randInt(min: number, max: number) {
  return min + Math.floor(rnd() * (max - min + 1));
}
function daysAgo(n: number) {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthsAgoDate(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

const IMG = {
  water: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  education: "https://images.pexels.com/photos/8364065/pexels-photo-8364065.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mind: "https://images.pexels.com/photos/7176137/pexels-photo-7176137.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  trees: "https://images.pexels.com/photos/36210259/pexels-photo-36210259.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  hospice: "https://images.pexels.com/photos/6129493/pexels-photo-6129493.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  food: "https://images.pexels.com/photos/6647050/pexels-photo-6647050.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

async function main() {
  const { db } = await import("./index");
  const schema = await import("./schema");

  console.log("Seeding Digital Heroes…");

  /* ------------------------------- settings -------------------------------- */
  await db
    .insert(schema.settings)
    .values({ id: 1 })
    .onConflictDoNothing();

  /* ------------------------------- charities ------------------------------- */
  const charitySeed = [
    {
      name: "Wellspring Water Trust",
      slug: "wellspring-water-trust",
      tagline: "Clean water projects that change entire villages — one well at a time.",
      category: "Clean Water",
      location: "London & East Africa",
      imageUrl: IMG.water,
      websiteUrl: "https://example.com/wellspring",
      isFeatured: true,
      description:
        "Wellspring funds, drills and maintains community water points in regions where a walk for water steals hours of every day.\nSince 2014 the trust has completed over 400 water projects, always pairing infrastructure with local training so the wells outlive the headlines.",
      impact: "£25 keeps one family supplied with safe drinking water for a year. Typical monthly member pledges fund roughly two family-years of clean water.",
      events: [
        { title: "Wellspring Charity Golf Day", date: "14 Jun 2026", location: "Muirfield, Scotland", description: "18 holes, auctions and a long-drive comp — every penny to well projects." },
        { title: "Walk for Water 10K", date: "20 Sep 2026", location: "Richmond Park, London" },
      ],
    },
    {
      name: "Bright Futures Academy",
      slug: "bright-futures-academy",
      tagline: "After-school learning clubs for children who need them most.",
      category: "Education",
      location: "Manchester, UK",
      imageUrl: IMG.education,
      websiteUrl: "https://example.com/brightfutures",
      description:
        "Bright Futures runs free after-school clubs in 23 communities — hot meals, reading mentors and a safe place to do homework.\nAttendance at their clubs lifts literacy scores by an average of two grade levels within one school year.",
      impact: "£12 funds a full week of club sessions for one child, including meals and materials.",
      events: [
        { title: "Birdies for Books Golf Classic", date: "3 Jul 2026", location: "Royal Birkdale", description: "Four-ball better-ball format with junior-coaching taster sessions." },
      ],
    },
    {
      name: "MindShape Collective",
      slug: "mindshape-collective",
      tagline: "Free group therapy and crisis support, without the waiting list.",
      category: "Mental Health",
      location: "Bristol, UK",
      imageUrl: IMG.mind,
      websiteUrl: "https://example.com/mindshape",
      description:
        "MindShape pairs people with peer-support groups and professional counsellors within 72 hours of referral — not months.\nTheir clubhouse model has supported 9,000 people through anxiety, depression and loss.",
      impact: "£30 covers one professionally facilitated group therapy session seat for someone in crisis.",
      events: [
        { title: "The Longest Day Challenge", date: "21 Jun 2026", location: "The Bristol Golf Club", description: "72 holes in one day — sponsorship per hole completed." },
      ],
    },
    {
      name: "Evergreen Roots",
      slug: "evergreen-roots",
      tagline: "Native woodland restoration, planted by the communities who keep it.",
      category: "Environment",
      location: "Highlands, Scotland",
      imageUrl: IMG.trees,
      websiteUrl: "https://example.com/evergreenroots",
      description:
        "Evergreen Roots reforests degraded highland land with native species — planted by local volunteers and school groups.\nEvery site is GPS-mapped, and members can track canopy growth year over year.",
      impact: "£8 plants and protects one native sapling for its first critical three years.",
      events: [
        { title: "Fairways to Forests Invitational", date: "30 Aug 2026", location: "Gleneagles", description: "Shotgun start; each entry plants 25 trees." },
      ],
    },
    {
      name: "Harbour House Hospices",
      slug: "harbour-house-hospices",
      tagline: "Dignity, comfort and laughter in life's hardest season.",
      category: "Palliative Care",
      location: "Cornwall, UK",
      imageUrl: IMG.hospice,
      websiteUrl: "https://example.com/harbourhouse",
      description:
        "Harbour House provides end-of-life care, family counselling and bereavement support across Cornwall — free at the point of need.\nNurses, gardeners, cooks and volunteers work as one team around every family.",
      impact: "£40 funds one hour of specialist in-home nursing care for a patient and their family.",
      events: [
        { title: "Harbour Cup Pro-Am", date: "11 Sep 2026", location: "St Enodoc", description: "Play alongside tour professionals on the church course." },
      ],
    },
    {
      name: "Full Plate Project",
      slug: "full-plate-project",
      tagline: "Community kitchens turning surplus food into shared dinners.",
      category: "Community",
      location: "Leeds, UK",
      imageUrl: IMG.food,
      websiteUrl: "https://example.com/fullplate",
      description:
        "Full Plate rescues supermarket surplus and turns it into restaurant-quality community dinners — pay-what-you-can, always.\nForty-one kitchens serve 60,000 meals a month, with cooking classes that hand skills back to the neighbourhood.",
      impact: "£15 serves ten hot, nutritious community meals.",
      events: [
        { title: "Slice Out Hunger Golf Day", date: "25 Jun 2026", location: "Alwoodley Golf Club", description: "Prizes donated by local restaurants — slices for a good cause only." },
      ],
    },
  ];

  const charityIds: Record<string, string> = {};
  for (const c of charitySeed) {
    const existing = await db.select().from(schema.charities).where(eq(schema.charities.slug, c.slug)).limit(1);
    if (existing[0]) {
      charityIds[c.slug] = existing[0].id;
      continue;
    }
    const [row] = await db.insert(schema.charities).values(c).returning();
    charityIds[c.slug] = row.id;
  }
  console.log(`✓ charities (${Object.keys(charityIds).length})`);

  /* --------------------------------- users --------------------------------- */
  const adminEmail = "admin@digitalheroes.club";
  const haveAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1);
  if (!haveAdmin[0]) {
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash: hashPassword("Admin1234!"),
      fullName: "Club Admin",
      role: "admin",
      charityId: charityIds["wellspring-water-trust"],
      charityPercent: 50,
    });
  }

  const memberSeed: { name: string; email: string; plan: "monthly" | "yearly"; pct: number; charity: string; status?: string }[] = [
    { name: "James Cartwright", email: "james@example.com", plan: "yearly", pct: 20, charity: "wellspring-water-trust" },
    { name: "Priya Raman", email: "priya@example.com", plan: "monthly", pct: 15, charity: "bright-futures-academy" },
    { name: "Tom Ellison", email: "tom@example.com", plan: "monthly", pct: 10, charity: "mindshape-collective" },
    { name: "Sofia Marchetti", email: "sofia@example.com", plan: "yearly", pct: 25, charity: "evergreen-roots" },
    { name: "Daniel Okafor", email: "daniel@example.com", plan: "monthly", pct: 10, charity: "harbour-house-hospices" },
    { name: "Grace Hopkins", email: "grace@example.com", plan: "monthly", pct: 30, charity: "full-plate-project" },
    { name: "Liam Ferreira", email: "liam@example.com", plan: "monthly", pct: 15, charity: "wellspring-water-trust" },
    { name: "Hannah Byrne", email: "hannah@example.com", plan: "yearly", pct: 10, charity: "bright-futures-academy" },
    { name: "Marcus Webb", email: "marcus@example.com", plan: "monthly", pct: 10, charity: "mindshape-collective" },
    { name: "Aisha Karim", email: "aisha@example.com", plan: "monthly", pct: 20, charity: "full-plate-project" },
    { name: "Oliver Tan", email: "oliver@example.com", plan: "monthly", pct: 10, charity: "evergreen-roots" },
    { name: "Emma Sørensen", email: "emma@example.com", plan: "monthly", pct: 15, charity: "harbour-house-hospices" },
    { name: "Noah Whitfield", email: "noah@example.com", plan: "monthly", pct: 10, charity: "bright-futures-academy" },
    { name: "Isabelle Moreau", email: "isabelle@example.com", plan: "monthly", pct: 10, charity: "wellspring-water-trust" },
    { name: "Ryan Doyle", email: "ryan@example.com", plan: "monthly", pct: 15, charity: "mindshape-collective", status: "cancelled" },
    { name: "Chloe Adeyemi", email: "chloe@example.com", plan: "monthly", pct: 10, charity: "full-plate-project", status: "inactive" },
  ];

  const password = hashPassword("Demo1234!");
  const userIds: Record<string, string> = {};
  for (const m of memberSeed) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, m.email)).limit(1);
    if (existing[0]) {
      userIds[m.email] = existing[0].id;
      continue;
    }
    const [row] = await db
      .insert(schema.users)
      .values({
        email: m.email,
        passwordHash: password,
        fullName: m.name,
        role: "subscriber",
        charityId: charityIds[m.charity],
        charityPercent: m.pct,
      })
      .returning();
    userIds[m.email] = row.id;
  }
  console.log(`✓ users (${Object.keys(userIds).length} members + admin)`);

  /* ------------------------------ subscriptions ----------------------------- */
  const MONTHLY = 1299;
  const YEARLY = 12999;
  for (const m of memberSeed) {
    const uid = userIds[m.email];
    const existing = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, uid)).limit(1);
    if (existing[0]) continue;
    if (m.status === "inactive") continue;
    const start = monthsAgoDate(randInt(1, 5));
    const end = new Date(start);
    if (m.plan === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    const cancelled = m.status === "cancelled";
    await db.insert(schema.subscriptions).values({
      userId: uid,
      plan: m.plan,
      status: "active",
      cancelAtPeriodEnd: cancelled,
      currentPeriodStart: cancelled ? new Date(Date.now() - 12 * 24 * 3600 * 1000) : start,
      currentPeriodEnd: cancelled ? new Date(Date.now() + 16 * 24 * 3600 * 1000) : end,
    });
  }
  console.log("✓ subscriptions");

  /* --------------------------------- scores -------------------------------- */
  const emails = Object.keys(userIds);
  for (let u = 0; u < emails.length; u++) {
    const uid = userIds[emails[u]];
    const existing = await db.select().from(schema.scores).where(eq(schema.scores.userId, uid)).limit(1);
    if (existing[0]) continue;
    for (let i = 0; i < 5; i++) {
      await db.insert(schema.scores).values({
        userId: uid,
        score: randInt(12, 40),
        scoreDate: daysAgo(3 + i * 8 + (u % 4)),
        createdAt: new Date(Date.now() - (3 + i * 8 + (u % 4)) * 24 * 3600 * 1000),
      });
    }
  }
  console.log("✓ scores");

  // Guarantee James has a 4-match in the seeded draw: set 4 of his scores to
  // four of the most frequent numbers across all members (picked below).
  const jamesScores = await db
    .select()
    .from(schema.scores)
    .where(eq(schema.scores.userId, userIds["james@example.com"]))
    .orderBy(desc(schema.scores.scoreDate));
  const freq = new Map<number, number>();
  for (const email of emails) {
    if (email === "james@example.com") continue;
    const rows = await db.select().from(schema.scores).where(eq(schema.scores.userId, userIds[email]));
    for (const r of rows) freq.set(r.score, (freq.get(r.score) ?? 0) + 1);
  }
  const topNumbers = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n);
  for (let i = 0; i < Math.min(4, jamesScores.length); i++) {
    await db.update(schema.scores).set({ score: topNumbers[i] }).where(eq(schema.scores.id, jamesScores[i].id));
  }

  /* ------------------------------- donations ------------------------------- */
  const haveDonations = await db.select().from(schema.donations).limit(1);
  if (!haveDonations[0]) {
    for (const m of memberSeed) {
      const uid = userIds[m.email];
      if (m.status === "inactive") continue;
      const cid = charityIds[m.charity];
      const price = m.plan === "yearly" ? YEARLY : MONTHLY;
      // pledge rows across the months they've been active
      const months = m.plan === "yearly" ? [0] : [0, 1, 2];
      for (const back of months) {
        await db.insert(schema.donations).values({
          userId: uid,
          charityId: cid,
          amount: Math.round((price * m.pct) / 100),
          percent: m.pct,
          kind: "subscription",
          createdAt: monthsAgoDate(back),
        });
      }
    }
    // Direct donations for flavour
    const direct = [
      { email: "james@example.com", charity: "wellspring-water-trust", amount: 5000, back: 1 },
      { email: "sofia@example.com", charity: "evergreen-roots", amount: 2500, back: 6 },
      { email: "grace@example.com", charity: "full-plate-project", amount: 1500, back: 12 },
      { email: "priya@example.com", charity: "bright-futures-academy", amount: 2000, back: 3 },
    ];
    for (const d of direct) {
      await db.insert(schema.donations).values({
        userId: userIds[d.email],
        charityId: charityIds[d.charity],
        amount: d.amount,
        percent: 100,
        kind: "direct",
        createdAt: new Date(Date.now() - d.back * 24 * 3600 * 1000),
      });
    }
  }
  console.log("✓ donations");

  /* ---------------------------- seeded published draw ----------------------- */
  const haveDraw = await db.select().from(schema.draws).where(eq(schema.draws.status, "published")).limit(1);
  if (!haveDraw[0]) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // drawn numbers = 5 most frequent scores (algorithmic flavour)
    freq.clear();
    for (const email of emails) {
      const rows = await db.select().from(schema.scores).where(eq(schema.scores.userId, userIds[email]));
      for (const r of rows) freq.set(r.score, (freq.get(r.score) ?? 0) + 1);
    }
    const numbers = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n).sort((a, b) => a - b);

    const activeMembers = memberSeed.filter((m) => m.status !== "inactive");
    const basePool = activeMembers.reduce(
      (sum, m) => sum + Math.round(((m.plan === "yearly" ? Math.round(YEARLY / 12) : MONTHLY) * 50) / 100),
      0
    );
    const rolloverIn = 125000; // £1,250 fictional carry-in
    const totalPool = basePool + rolloverIn;
    const fivePool = Math.round(totalPool * 0.4);
    const fourPool = Math.round(totalPool * 0.35);
    const threePool = Math.round(totalPool * 0.25);

    const adminRow = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1);

    const [draw] = await db
      .insert(schema.draws)
      .values({
        drawMonth: lastMonth.getMonth() + 1,
        drawYear: lastMonth.getFullYear(),
        drawType: "algorithmic",
        status: "published",
        drawnNumbers: numbers,
        subscriberCount: activeMembers.length,
        basePool,
        rolloverIn,
        totalPool,
        fivePool,
        fourPool,
        threePool,
        publishedAt: new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate(), 28) - 20 > 0 ? Math.min(now.getDate(), 28) - 20 : 2),
        createdBy: adminRow[0]?.id ?? null,
        createdAt: monthsAgoDate(0),
      })
      .returning();

    const drawnSet = new Set(numbers);
    const winnersByTier: { five: string[]; four: string[]; three: string[] } = { five: [], four: [], three: [] };

    for (const m of activeMembers) {
      const uid = userIds[m.email];
      const rows = await db
        .select()
        .from(schema.scores)
        .where(eq(schema.scores.userId, uid))
        .orderBy(desc(schema.scores.scoreDate))
        .limit(5);
      const vals = rows.map((r) => r.score);
      const mc = new Set(vals.filter((v) => drawnSet.has(v))).size;
      const tier = mc >= 5 ? "five" : mc === 4 ? "four" : mc === 3 ? "three" : null;
      await db.insert(schema.drawEntries).values({
        drawId: draw.id,
        userId: uid,
        scoresSnapshot: vals,
        matchCount: mc,
        tier,
      });
      if (tier) winnersByTier[tier].push(m.email);
    }

    // Winners: ensure none matched all 5 (so jackpot visibly rolls over)
    const fiveCount = winnersByTier.five.length;
    if (fiveCount > 0) {
      // nudge: demote jackpot winners by removing their tier
      for (const email of winnersByTier.five) {
        const uid = userIds[email];
        await db
          .update(schema.drawEntries)
          .set({ tier: "four", matchCount: 4 })
          .where(eq(schema.drawEntries.drawId, draw.id));
        winnersByTier.four.push(...winnersByTier.five.splice(0));
        break;
      }
    }

    async function makeWinner(email: string, tier: "four" | "three", pool: number, sharers: number, verification: string, payment: string) {
      const uid = userIds[email];
      const entry = await db
        .select()
        .from(schema.drawEntries)
        .where(eq(schema.drawEntries.userId, uid))
        .limit(1);
      await db.insert(schema.winners).values({
        drawId: draw.id,
        userId: uid,
        tier,
        matchCount: entry[0]?.matchCount ?? (tier === "four" ? 4 : 3),
        prize: Math.floor(pool / Math.max(1, sharers)),
        verification: verification as never,
        payment: payment as never,
      });
    }

    const fourWinners = winnersByTier.four;
    const threeWinners = winnersByTier.three;

    if (fourWinners[0]) await makeWinner(fourWinners[0], "four", fourPool, fourWinners.length, "pending_proof", "pending");
    if (fourWinners[1]) await makeWinner(fourWinners[1], "four", fourPool, fourWinners.length, "approved", "pending");
    if (threeWinners[0]) await makeWinner(threeWinners[0], "three", threePool, threeWinners.length, "proof_submitted", "pending");
    if (threeWinners[1]) await makeWinner(threeWinners[1], "three", threePool, threeWinners.length, "approved", "paid");
    if (threeWinners[2]) await makeWinner(threeWinners[2], "three", threePool, threeWinners.length, "pending_proof", "pending");

    // Rollover carried forward (no 5-match winner)
    await db.update(schema.settings).set({ jackpotRollover: fivePool }).where(eq(schema.settings.id, 1));
    console.log(`✓ seeded published draw (${numbers.join(", ")}) with rollover ${fivePool / 100}`);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
