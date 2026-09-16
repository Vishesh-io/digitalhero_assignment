import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required");
}

// Mirror the TLS behaviour in src/db/index.ts: local databases verify normally,
// remote managed providers (Supabase/Neon/RDS) get verification relaxed because
// their certificate chain is not in Node's default trust store.
const isLocalHost = /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
    ssl: isLocalHost ? false : { rejectUnauthorized: false },
  },
});