"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Dices,
  Loader2,
  Rocket,
  Save,
  ShieldCheck,
  Sigma,
  Trash2,
  UserCog,
} from "lucide-react";
import { cn, formatMoney, tierLabel } from "@/lib/money";
import { NumberBall } from "@/components/ui";

async function postAdmin(body: unknown) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function Note({ tone, msg }: { tone: "ok" | "err"; msg: string }) {
  return (
    <p
      className={cn(
        "rounded-xl border px-4 py-2.5 text-xs",
        tone === "ok" ? "border-volt/40 bg-volt/10 text-volt" : "border-ember/40 bg-ember/10 text-ember"
      )}
    >
      {msg}
    </p>
  );
}

/* ------------------------------- draw manager ------------------------------ */

export type SimEntry = {
  id: string;
  name: string;
  email: string;
  scores: number[];
  matchCount: number;
  tier: string | null;
};

export type SimDraw = {
  id: string;
  drawMonth: number;
  drawYear: number;
  drawType: string;
  drawnNumbers: number[];
  subscriberCount: number;
  basePool: number;
  rolloverIn: number;
  totalPool: number;
  fivePool: number;
  fourPool: number;
  threePool: number;
  winnersByTier: { five: number; four: number; three: number };
  entries: SimEntry[];
};

export function DrawManager({ initial }: { initial: SimDraw | null }) {
  const [sim, setSim] = useState<SimDraw | null>(initial);
  const [drawType, setDrawType] = useState<"random" | "algorithmic">("random");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  async function simulate() {
    setBusy("simulate");
    setNote(null);
    const { ok, data } = await postAdmin({ resource: "draw", action: "simulate", drawType });
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Simulation failed." });
    setSim({
      id: data.draw.id,
      drawMonth: data.draw.drawMonth,
      drawYear: data.draw.drawYear,
      drawType: data.draw.drawType,
      drawnNumbers: data.draw.drawnNumbers,
      subscriberCount: data.draw.subscriberCount,
      basePool: data.draw.basePool,
      rolloverIn: data.draw.rolloverIn,
      totalPool: data.draw.totalPool,
      fivePool: data.draw.fivePool,
      fourPool: data.draw.fourPool,
      threePool: data.draw.threePool,
      winnersByTier: data.winnersByTier,
      entries: data.entries,
    });
    setNote({ tone: "ok", msg: "Simulation complete — review the numbers, then publish when ready." });
  }

  async function publish() {
    if (!sim) return;
    setBusy("publish");
    setNote(null);
    const { ok, data } = await postAdmin({ resource: "draw", action: "publish", drawId: sim.id });
    setBusy(null);
    if (!ok) {
      setBusy(null);
      return setNote({ tone: "err", msg: data.error ?? "Publish failed." });
    }
    setNote({
      tone: "ok",
      msg: `Published — ${data.winnersCreated} winner${data.winnersCreated === 1 ? "" : "s"} created. Rollover for next month: ${formatMoney(
        data.rolloverForNext ?? 0,
        { decimals: false }
      )}.`,
    });
    setTimeout(() => window.location.reload(), 1600);
  }

  async function discard() {
    if (!sim) return;
    setBusy("discard");
    await postAdmin({ resource: "draw", action: "discard", drawId: sim.id });
    window.location.reload();
  }

  const tierRows = sim
    ? ([
        { tier: "five" as const, pool: sim.fivePool, count: sim.winnersByTier.five },
        { tier: "four" as const, pool: sim.fourPool, count: sim.winnersByTier.four },
        { tier: "three" as const, pool: sim.threePool, count: sim.winnersByTier.three },
      ] as const)
    : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label" htmlFor="drawType">Draw engine</label>
          <select
            id="drawType"
            value={drawType}
            onChange={(e) => setDrawType(e.target.value as "random" | "algorithmic")}
            className="field"
          >
            <option value="random" className="bg-panel">Random — pure chance</option>
            <option value="algorithmic" className="bg-panel">Algorithmic — weighted by score frequency</option>
          </select>
        </div>
        <button onClick={simulate} disabled={busy !== null} className="btn-volt !py-3 text-xs">
          {busy === "simulate" ? <Loader2 className="size-3.5 animate-spin" /> : <Dices className="size-3.5" />}
          Run simulation
        </button>
      </div>
      {note && <Note tone={note.tone} msg={note.msg} />}

      {/* Simulation view */}
      {sim && (
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-gold/[0.05] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="chip !border-gold/40 !text-gold">
                  {sim.drawType === "algorithmic" ? <Sigma className="size-3.5" /> : <Dices className="size-3.5" />}
                  Unpublished simulation
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {sim.drawnNumbers.map((n) => (
                    <NumberBall key={n} n={n} size="lg" tone="gold" />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={discard} disabled={busy !== null} className="btn-danger !px-5 !py-2.5 text-xs">
                  {busy === "discard" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Discard
                </button>
                <button onClick={publish} disabled={busy !== null} className="btn-gold !px-6 !py-2.5 text-xs">
                  {busy === "publish" ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                  Publish draw
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-line/60 sm:grid-cols-4">
            {[
              { l: "Entrants", v: String(sim.subscriberCount) },
              { l: "Base pool", v: formatMoney(sim.basePool, { decimals: false }) },
              { l: "Rollover in", v: formatMoney(sim.rolloverIn, { decimals: false }) },
              { l: "Total pool", v: formatMoney(sim.totalPool, { decimals: false }) },
            ].map((c) => (
              <div key={c.l} className="bg-panel p-5">
                <p className="font-display text-xl font-semibold">{c.v}</p>
                <p className="mt-0.5 text-xs text-mute">{c.l}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {tierRows.map((t) => (
              <div key={t.tier} className="rounded-xl border border-line bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{tierLabel(t.tier)}</p>
                  <span className="chip !text-[10px]">{t.count} winner{t.count === 1 ? "" : "s"}</span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-gold">
                  {t.count > 0 ? formatMoney(Math.floor(t.pool / t.count), { decimals: false }) : "—"}
                </p>
                <p className="mt-0.5 text-xs text-mute">
                  per winner (pool {formatMoney(t.pool, { decimals: false })})
                </p>
                {t.tier === "five" && t.count === 0 && (
                  <p className="mt-2 text-[11px] text-gold">No jackpot winner — rolls over on publish.</p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-line p-6">
            <p className="field-label">Entries ({sim.entries.length})</p>
            <div className="mt-3 max-h-96 overflow-y-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-panel">
                  <tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
                    <th className="pb-2 pr-4 font-medium">Member</th>
                    <th className="pb-2 pr-4 font-medium">Scores</th>
                    <th className="pb-2 pr-4 font-medium">Matches</th>
                    <th className="pb-2 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.entries.map((e) => (
                    <tr key={e.id} className="border-b border-line/50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-mute">{e.email}</p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs tabular-nums text-mute">[{e.scores.join(", ") || "no scores"}]</span>
                      </td>
                      <td className="py-2.5 pr-4 font-semibold">{e.matchCount}</td>
                      <td className="py-2.5">
                        {e.tier ? (
                          <span className="chip !border-gold/40 !text-gold">{tierLabel(e.tier)}</span>
                        ) : (
                          <span className="text-xs text-mute">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- settings manager ---------------------------- */

export function SettingsManager({
  initial,
}: {
  initial: {
    monthlyPrice: number;
    yearlyPrice: number;
    prizePoolPercent: number;
    minCharityPercent: number;
    drawDay: number;
    jackpotRollover: number;
  };
}) {
  const [form, setForm] = useState({
    monthlyPrice: (initial.monthlyPrice / 100).toFixed(2),
    yearlyPrice: (initial.yearlyPrice / 100).toFixed(2),
    prizePoolPercent: String(initial.prizePoolPercent),
    minCharityPercent: String(initial.minCharityPercent),
    drawDay: String(initial.drawDay),
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const { ok, data } = await postAdmin({
      resource: "settings",
      action: "update",
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: Number(form.yearlyPrice),
      prizePoolPercent: Number(form.prizePoolPercent),
      minCharityPercent: Number(form.minCharityPercent),
      drawDay: Number(form.drawDay),
    });
    setBusy(false);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not save settings." });
    setNote({ tone: "ok", msg: "Settings saved — they apply to the next simulation and checkout." });
  }

  return (
    <form onSubmit={save} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Monthly price (£)</label>
          <input type="number" step="0.01" min={1} value={form.monthlyPrice} onChange={set("monthlyPrice")} className="field" />
        </div>
        <div>
          <label className="field-label">Yearly price (£)</label>
          <input type="number" step="0.01" min={1} value={form.yearlyPrice} onChange={set("yearlyPrice")} className="field" />
        </div>
        <div>
          <label className="field-label">Prize pool percentage</label>
          <input type="number" min={1} max={90} value={form.prizePoolPercent} onChange={set("prizePoolPercent")} className="field" />
        </div>
        <div>
          <label className="field-label">Minimum charity pledge (%)</label>
          <input type="number" min={1} max={100} value={form.minCharityPercent} onChange={set("minCharityPercent")} className="field" />
        </div>
        <div>
          <label className="field-label">Draw day of month (1–28)</label>
          <input type="number" min={1} max={28} value={form.drawDay} onChange={set("drawDay")} className="field" />
        </div>
        <div>
          <label className="field-label">Jackpot rollover (auto)</label>
          <input readOnly value={formatMoney(initial.jackpotRollover)} className="field opacity-60" />
        </div>
      </div>
      {note && <Note tone={note.tone} msg={note.msg} />}
      <button disabled={busy} className="btn-volt !py-2.5 text-xs">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        Save settings
      </button>
    </form>
  );
}

/* ------------------------------- user manager ------------------------------ */

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  subStatus: string;
  subPlan: string;
  scoresCount: number;
  given: number;
};

export function UserManager({ users, selfId }: { users: AdminUserRow[]; selfId: string }) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedScores, setExpandedScores] = useState<{ id: string; score: number; date: string }[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  const filtered = users.filter((u) => {
    const n = q.trim().toLowerCase();
    if (!n) return true;
    return u.fullName.toLowerCase().includes(n) || u.email.toLowerCase().includes(n);
  });

  async function toggleRole(u: AdminUserRow) {
    setBusyId(u.id);
    await postAdmin({
      resource: "user",
      action: "role",
      userId: u.id,
      role: u.role === "admin" ? "subscriber" : "admin",
    });
    window.location.reload();
  }

  async function toggleScores(userId: string) {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setExpandedScores([]);
      return;
    }
    setExpandedUser(userId);
    setLoadingScores(true);
    const { ok, data } = await postAdmin({ resource: "user", action: "scores", userId });
    setLoadingScores(false);
    if (ok && data.scores) setExpandedScores(data.scores);
    else setExpandedScores([]);
  }

  async function deleteScore(scoreId: string, userId: string) {
    setBusyId(scoreId);
    await postAdmin({ resource: "user", action: "delete-score", scoreId });
    setBusyId(null);
    // Refresh the scores
    const { ok, data } = await postAdmin({ resource: "user", action: "scores", userId });
    if (ok && data.scores) setExpandedScores(data.scores);
    else setExpandedScores([]);
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg font-semibold">Members ({users.length})</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="field sm:max-w-xs"
        />
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-mute">
              <th className="pb-3 pr-4 font-medium">Member</th>
              <th className="pb-3 pr-4 font-medium">Subscription</th>
              <th className="pb-3 pr-4 font-medium">Scores</th>
              <th className="pb-3 pr-4 font-medium">Given</th>
              <th className="pb-3 text-right font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <>
                <tr key={u.id} className="border-b border-line/50 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-xs text-mute">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="capitalize text-mute">{u.subStatus}</span>
                    {u.subStatus !== "inactive" && <span className="text-xs text-mute"> · {u.subPlan}</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => toggleScores(u.id)}
                      className={cn(
                        "chip transition hover:text-volt",
                        expandedUser === u.id && "!border-volt/50 !text-volt"
                      )}
                    >
                      {u.scoresCount}/5
                      <span className="text-[9px]">{expandedUser === u.id ? "▲" : "▼"}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-volt">{formatMoney(u.given, { decimals: false })}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={busyId !== null || u.id === selfId}
                      className={cn(
                        "chip transition disabled:opacity-40",
                        u.role === "admin" ? "!border-volt/40 !text-volt" : "hover:text-ink"
                      )}
                    >
                      {busyId === u.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : u.role === "admin" ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <UserCog className="size-3.5" />
                      )}
                      {u.role === "admin" ? "Admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
                {expandedUser === u.id && (
                  <tr key={`${u.id}-scores`} className="border-b border-line/50">
                    <td colSpan={5} className="bg-white/[0.01] px-6 py-4">
                      {loadingScores ? (
                        <div className="flex items-center gap-2 text-xs text-mute">
                          <Loader2 className="size-3.5 animate-spin" /> Loading scores…
                        </div>
                      ) : expandedScores.length === 0 ? (
                        <p className="text-xs text-mute">No scores logged.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-mute">
                            {u.fullName}&apos;s scores
                          </p>
                          {expandedScores.map((sc) => (
                            <div
                              key={sc.id}
                              className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2"
                            >
                              <NumberBall n={sc.score} size="sm" tone="dim" />
                              <span className="flex-1 text-xs text-mute">
                                {String(sc.date).slice(0, 10)}
                              </span>
                              <button
                                onClick={() => deleteScore(sc.id, u.id)}
                                disabled={busyId === sc.id}
                                className="chip !px-2 !py-1 hover:border-ember/40 hover:text-ember"
                                title="Delete this score"
                              >
                                {busyId === sc.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-mute">No members match that search.</p>}
      </div>
    </div>
  );
}

/* ------------------------------ review helpers ----------------------------- */

export function ApprovedDot() {
  return <BadgeCheck className="size-4 text-volt" />;
}
