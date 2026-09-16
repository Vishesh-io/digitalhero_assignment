import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */

export const roleEnum = pgEnum("role", ["subscriber", "admin"]);
export const planEnum = pgEnum("plan_type", ["monthly", "yearly"]);
export const subStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "cancelled",
  "past_due",
  "expired",
]);
export const drawTypeEnum = pgEnum("draw_type", ["random", "algorithmic"]);
export const drawStatusEnum = pgEnum("draw_status", ["simulated", "published"]);
export const tierEnum = pgEnum("winner_tier", ["five", "four", "three"]);
export const verificationEnum = pgEnum("verification_status", [
  "pending_proof",
  "proof_submitted",
  "approved",
  "rejected",
]);
export const paymentEnum = pgEnum("payment_status", ["pending", "paid"]);

/* --------------------------------- tables --------------------------------- */

export const charities = pgTable("charities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").default(""),
  category: text("category").default("Community"),
  description: text("description").default(""),
  impact: text("impact").default(""),
  imageUrl: text("image_url").default(""),
  websiteUrl: text("website_url").default(""),
  location: text("location").default(""),
  events: jsonb("events")
    .$type<{ title: string; date: string; location: string; description?: string }[]>()
    .default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull().default("subscriber"),
  charityId: uuid("charity_id").references(() => charities.id, { onDelete: "set null" }),
  charityPercent: integer("charity_percent").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("monthly"),
  status: subStatusEnum("status").notNull().default("inactive"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    scoreDate: date("score_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("scores_user_date_idx").on(t.userId, t.scoreDate)]
);

export const draws = pgTable("draws", {
  id: uuid("id").defaultRandom().primaryKey(),
  drawMonth: integer("draw_month").notNull(),
  drawYear: integer("draw_year").notNull(),
  drawType: drawTypeEnum("draw_type").notNull().default("random"),
  status: drawStatusEnum("status").notNull().default("simulated"),
  drawnNumbers: jsonb("drawn_numbers").$type<number[]>().notNull().default([]),
  subscriberCount: integer("subscriber_count").notNull().default(0),
  basePool: integer("base_pool").notNull().default(0), // pence
  rolloverIn: integer("rollover_in").notNull().default(0),
  totalPool: integer("total_pool").notNull().default(0),
  fivePool: integer("five_pool").notNull().default(0),
  fourPool: integer("four_pool").notNull().default(0),
  threePool: integer("three_pool").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drawEntries = pgTable(
  "draw_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scoresSnapshot: jsonb("scores_snapshot").$type<number[]>().notNull().default([]),
    matchCount: integer("match_count").notNull().default(0),
    tier: tierEnum("tier"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("draw_entries_draw_user_idx").on(t.drawId, t.userId)]
);

export const winners = pgTable("winners", {
  id: uuid("id").defaultRandom().primaryKey(),
  drawId: uuid("draw_id")
    .notNull()
    .references(() => draws.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: tierEnum("tier").notNull(),
  matchCount: integer("match_count").notNull(),
  prize: integer("prize").notNull().default(0), // pence
  verification: verificationEnum("verification").notNull().default("pending_proof"),
  payment: paymentEnum("payment").notNull().default("pending"),
  proofUrl: text("proof_url"),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const donations = pgTable("donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  charityId: uuid("charity_id").references(() => charities.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(), // pence
  percent: integer("percent").notNull().default(10),
  kind: text("kind").notNull().default("subscription"), // subscription | direct
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  monthlyPrice: integer("monthly_price").notNull().default(1299), // pence
  yearlyPrice: integer("yearly_price").notNull().default(12999),
  prizePoolPercent: integer("prize_pool_percent").notNull().default(50),
  minCharityPercent: integer("min_charity_percent").notNull().default(10),
  drawDay: integer("draw_day").notNull().default(1),
  jackpotRollover: integer("jackpot_rollover").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ---------------------------------- types --------------------------------- */

export type PlanType = "monthly" | "yearly";
export type Tier = "five" | "four" | "three";
export type Role = "subscriber" | "admin";
export type User = typeof users.$inferSelect;
export type Charity = typeof charities.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type Draw = typeof draws.$inferSelect;
export type DrawEntry = typeof drawEntries.$inferSelect;
export type Winner = typeof winners.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Settings = typeof settings.$inferSelect;
