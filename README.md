# Digital Heroes 🏌️‍♂️❤️🏆

> **A Golf Performance & Charity Draw Subscription Platform**  
> Built strictly according to the **Digital Heroes Product Requirements Document (PRD · 2026 Edition)**.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=flat)](https://orm.drizzle.team/)

---

## 🌟 Executive Overview

Digital Heroes connects golf enthusiasts, monthly cash prize draws, and charitable giving into a single cohesive platform.
* **Play:** Members log their rolling 5 latest Stableford scores (1–45).
* **Give:** At least 10% (configurable up to 100%) of every membership directly funds an approved charity of the member's choice.
* **Win:** Five random or algorithmic numbers (1–45) are drawn every month. Members matching 3, 4, or 5 numbers share progressive prize tiers, with unclaimed jackpots rolling over to the following month.

---

## 🚀 Key Features Built to PRD Specifications

### 1. User Roles & Authentication (§ 03)
* **Guest / Public:** Public landing page, charity directory with search and slug pages, interactive "How it works", dynamic pricing table, and real-time statistics counter.
* **Hero / Subscriber:** Private dashboard, subscription management (monthly/yearly), rolling 5 Stableford score entry buffer, charity selection & donation ledger, draw history, and winner payout tracking.
* **Platform Administrator:** Comprehensive admin command center (`/admin`):
  * Member inspection & score inspection/management.
  * Charity directory curation (feature/unfeature, create, edit, delete).
  * Draw simulation and one-click publishing with rollover calculations.
  * Winner verification workflow (review proof uploads, approve/reject with notes, mark payout completed).
  * Global platform settings (membership pricing, pool %, min charity %, draw day).

### 2. Subscription & Payment System (§ 04)
* Supports **Monthly (£10 default)** and **Yearly (£100 default)** subscription tiers.
* Integrated with **Stripe Checkout & Webhooks** with an automatic **Demo Gateway fallback** when Stripe keys are not configured.
* Complete subscription lifecycle: activation, cancellation (grace period until period end), and resumption.

### 3. Score Management Engine (§ 05)
* Strict validation: whole numbers between **1 and 45** (Stableford scale).
* Constraint: maximum of **one score per calendar date**.
* FIFO Rolling 5 Buffer: automatically tracks the five most recent rounds to use as active lottery entries for the monthly draw.

### 4. Prize Pool & Draw Engine (§ 06 & § 07)
* Flexible draw modes: **Random** (CSPRNG) or **Algorithmic** (score-distribution weighted).
* Real-time pool splitting:
  * **5 Matches (Jackpot):** 50% of pool (+ full rollover from previous months).
  * **4 Matches:** 30% of pool.
  * **3 Matches:** 20% of pool.
* Automatic rollover: if a tier produces no winners, its funds automatically roll into the next draw's pool.

### 5. Charity System & Ledger (§ 08)
* Charity directory with categorization, impact metrics, and featured charity highlights.
* Member-allocated pledge percentage (minimum 10%, up to 100%).
* Immutable donation ledger records every contribution per transaction.

### 6. Verification & Fraud Prevention (§ 11)
* Winner proof upload system (scorecard / golf club verification file upload).
* Admin audit and approval before marking prizes as "paid".

---

## 🔑 Demo Logins

The database comes pre-seeded with sample users, draws, scores, and charities:

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@digitalheroes.club` | `Admin1234!` | [`/admin`](http://localhost:3000/admin) |
| **Hero (Member)** | `james@example.com` | `Demo1234!` | [`/dashboard`](http://localhost:3000/dashboard) |
| **Hero (Member)** | `sarah@example.com` | `Demo1234!` | [`/dashboard`](http://localhost:3000/dashboard) |

---

## 🛠️ Getting Started Locally

### Prerequisites
* **Node.js**: v18.18.0 or later (v20+ recommended)
* **npm**: v9+ or **pnpm**
* **PostgreSQL Database**: Supabase, Neon, RDS, or local Postgres.

### Installation

1. **Clone or extract the repository:**
   ```bash
   cd digital-heroes-development-plan
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` or `.env`:
   ```bash
   cp .env.example .env.local
   ```
   Add your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
   ```

4. **Initialize & Seed the Database:**
   Push schema migrations and seed with demo data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

* `npm run dev` — Start the local Next.js development server with Turbopack.
* `npm run build` — Create an optimized production build.
* `npm run start` — Run the production server.
* `npm run typecheck` — Run TypeScript validation (`tsc --noEmit`).
* `npm run lint` — Run ESLint code quality checks.
* `npm run db:push` — Synchronize Drizzle schema directly with PostgreSQL.
* `npm run db:seed` — Populate database with test members, scores, charities, and past draws.

---

## 🏗️ Architecture & Project Structure

```text
├── src/
│   ├── app/                    # Next.js App Router (28 routes)
│   │   ├── (public pages)      # Landing (/), Pricing, How it works, Charities, Auth
│   │   ├── admin/              # Command centre: Draws, Charities, Winners, Members, Settings
│   │   ├── dashboard/          # Member dashboard: Scores, Charity, Draws, Winnings
│   │   ├── api/                # REST endpoints: Auth, Scores, Billing, Admin, Webhooks
│   │   ├── layout.tsx          # Root layout with Top Progress bar & font injection
│   │   └── globals.css         # Tailwind CSS v4 design system
│   ├── components/             # Reusable UI & Widget components
│   │   ├── admin-widgets.tsx   # Draw manager, User score inspector, Settings form
│   │   ├── admin-managers.tsx  # Charity & Winner verification tables
│   │   ├── dashboard-widgets.tsx # Score logger, Charity picker, Subscription controls
│   │   ├── public-forms.tsx    # Auth forms, Stripe checkout buttons
│   │   └── ui.tsx              # NumberBall, StatusBadge, Section headers
│   ├── db/                     # Database layer
│   │   ├── index.ts            # pg.Pool connection pooler
│   │   ├── schema.ts           # Drizzle PostgreSQL schema definitions
│   │   └── seed.ts             # Deterministic seed generator
│   └── lib/                    # Business logic & utilities
│       ├── auth.ts             # Session cookies & password hashing (scrypt)
│       ├── core.ts             # Cached settings, score validation, subscription logic
│       ├── engine.ts           # Draw simulation, matching, & rollover calculations
│       └── money.ts            # Currency formatting & helpers
├── drizzle.config.ts           # Drizzle kit configuration
├── package.json
└── README.md
```

---

## 🚢 Deployment Guide (Vercel)

1. Push your code to a GitHub / GitLab repository.
2. Import the project into **[Vercel](https://vercel.com/)**.
3. In the project settings, add the Environment Variables:
   * `DATABASE_URL` — Your hosted PostgreSQL connection string (e.g., Supabase / Neon).
   * `DATABASE_SSL` — Leave unset or set to `true` (remote hosts use SSL).
   * `STRIPE_SECRET_KEY` (optional)
   * `STRIPE_WEBHOOK_SECRET` (optional)
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch the application.
