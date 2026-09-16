import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err) {
    // Drizzle wraps driver errors, so walk the `cause` chain to expose the
    // underlying reason (e.g. ECONNREFUSED when no database is reachable).
    let e = err as { code?: string; message?: string; cause?: unknown };
    while (e.cause && typeof e.cause === "object") {
      e = e.cause as typeof e;
    }
    return Response.json(
      { ok: false, code: e.code ?? null, error: e.message ?? "unknown error" },
      { status: 500 },
    );
  }
}
