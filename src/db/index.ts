import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Managed Postgres providers (Supabase, Neon, RDS…) serve certificates that
// Node's default trust store does not recognise, and some networks re-sign the
// TLS chain — both surface as "self-signed certificate in certificate chain".
// Local databases keep full verification; remote hosts use an encrypted
// connection with verification relaxed. Set DATABASE_SSL=false to opt out.
const isLocalHost = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(databaseUrl);
const ssl =
  process.env.DATABASE_SSL === "false" || isLocalHost
    ? undefined
    : { rejectUnauthorized: false };

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
