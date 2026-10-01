# Digital Heroes

A subscription platform that combines golf score tracking, monthly prize draws, and charity giving.

[Live demo](#) · [Screenshots](#screenshots) · [PRD](#)

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-38bdf8?logo=tailwindcss&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F)

## How it works

1. **Play:** Members log their five most recent Stableford scores (1–45).
2. **Give:** At least 10% of each membership (configurable up to 100%) goes to a charity the member chooses.
3. **Win:** Each month, five numbers (1–45) are drawn. Members matching 3, 4, or 5 share the prize tiers.

| Tier | Share of pool | If no winner |
| :-- | :-- | :-- |
| 5 matches (jackpot) | 50% + prior rollover | Rolls into next month |
| 4 matches | 30% | <!-- state behavior --> |
| 3 matches | 20% | <!-- state behavior --> |

Draws run in **Random** (CSPRNG) or **Algorithmic** mode (weighted by the distribution of member scores).

## Screenshots

<!-- Landing page, member dashboard, admin draw manager -->

## Features

**Public:** landing page, charity directory with search, pricing table, live stats.

**Members:** subscription management (monthly £10 / yearly £100 by default), score entry
(one per date, rolling last five), charity selection and donation history, draw results,
winnings and payout status.

**Admins (`/admin`):** member and score management, charity curation, draw simulation and
publishing, winner proof review and payout marking, and global settings (pricing, pool
percentages, minimum charity %, draw day).

**Payments:** Stripe Checkout and webhooks. With no Stripe keys set, a demo gateway
simulates the flow so you can run everything locally.

## Quick start

**Requirements:** Node 20.9+, npm 9+, a PostgreSQL database (local, Neon, or Supabase).

```bash
git clone <repo-url> && cd digital-heroes-development-plan
npm install
cp .env.example .env.local   # then fill in values below
npm run db:push
npm run db:seed              # local/dev only
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Description |
| :-- | :-- | :-- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `DATABASE_SSL` | No | `true` for most hosted DBs (default) |
| `STRIPE_SECRET_KEY` | No | Omit to use the demo gateway |
| `STRIPE_WEBHOOK_SECRET` | No | Required if Stripe is enabled |
| <!-- add session secret, app URL, storage keys --> | | |

### Testing Stripe locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Demo accounts (seeded, development only)

| Role | Email | Password |
| :-- | :-- | :-- |
| Admin | admin@digitalheroes.club | Admin1234! |
| Member | james@example.com | Demo1234! |
| Member | sarah@example.com | Demo1234! |

> **Never run `db:seed` against production.** These credentials are public.

## Scripts

| Command | Purpose |
| :-- | :-- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync Drizzle schema to the database |
| `npm run db:seed` | Load demo data |

## Project structure

```text
src/
├── app/          # Routes: public pages, /admin, /dashboard, /api
├── components/   # UI, admin, dashboard, and form components
├── db/           # Drizzle schema, pool connection, seed
└── lib/          # auth, core (settings, validation), engine (draws), money
```

## Deployment (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Set the environment variables above. Use your provider's **pooled** connection string
   for `DATABASE_URL`, since serverless functions can exhaust direct connections.
3. Run `npm run db:push` once against the production database. Do not seed it.
4. Point your Stripe webhook at `https://<your-domain>/api/webhooks/stripe`.
5. Make sure proof uploads go to persistent storage (<!-- name it -->), not local disk.

## Known limitations

<!-- e.g. single currency (GBP), no email notifications, manual payouts -->

## License

<!-- MIT / proprietary -->
