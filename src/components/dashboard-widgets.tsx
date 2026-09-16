"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CreditCard,
  HandCoins,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/money";
import { NumberBall } from "@/components/ui";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
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

/* ------------------------------ score manager ------------------------------ */

export type SimpleScore = { id: string; score: number; date: string };

export function ScoreManager({
  initialScores,
  locked,
}: {
  initialScores: SimpleScore[];
  locked: boolean;
}) {
  const [scores, setScores] = useState<SimpleScore[]>(initialScores);
  const [value, setValue] = useState(32);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState(30);
  const [editDate, setEditDate] = useState(today);

  function normalize(list: unknown): SimpleScore[] {
    if (!Array.isArray(list)) return [];
    return list.slice(0, 5).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      score: Number(s.score),
      date: String(s.scoreDate ?? s.date ?? "").slice(0, 10),
    }));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const { ok, data } = await post("/api/scores", { action: "add", score: value, date });
    setBusy(false);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not save score." });
    setScores(normalize(data.scores));
    setNote({ tone: "ok", msg: scores.length >= 5 ? "Saved — your oldest round rolled off." : "Score saved to your draw entry." });
  }

  async function remove(id: string) {
    setNote(null);
    const { ok, data } = await post("/api/scores", { action: "delete", id });
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not delete." });
    setScores(normalize(data.scores));
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setNote(null);
    const { ok, data } = await post("/api/scores", { action: "update", id, score: editVal, date: editDate });
    setBusy(false);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not update." });
    setScores(normalize(data.scores));
    setEditing(null);
    setNote({ tone: "ok", msg: "Score updated." });
  }

  if (locked) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white/[0.04] text-gold">
          <Lock className="size-5" />
        </span>
        <p className="font-display text-lg font-semibold">Scores unlock with membership</p>
        <p className="max-w-sm text-sm text-mute">
          Activate a monthly or yearly subscription to log Stableford scores and enter the monthly draw.
        </p>
        <Link href="/pricing" className="btn-volt mt-2 !py-2.5 text-xs">
          <CreditCard className="size-3.5" /> View membership plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">Log a round</p>
          <span className={cn("chip", scores.length === 5 ? "!border-volt/40 !text-volt" : "")}>
            {scores.length}/5 slots used
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="field-label" htmlFor="score">Stableford score (1–45)</label>
            <input
              id="score"
              type="number"
              min={1}
              max={45}
              required
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="date">Round date</label>
            <input
              id="date"
              type="date"
              required
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field"
            />
          </div>
          <div className="flex items-end">
            <button disabled={busy} className="btn-volt w-full !py-3 sm:w-auto">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add score
            </button>
          </div>
        </div>
        {note && <div className="mt-4"><Note tone={note.tone} msg={note.msg} /></div>}
        {scores.length === 5 && (
          <p className="mt-4 text-[11px] text-mute">
            Entry full — your next score will automatically replace your oldest round.
          </p>
        )}
      </form>

      <div className="card p-6">
        <p className="font-display text-lg font-semibold">Your latest five</p>
        {scores.length === 0 ? (
          <p className="mt-3 text-sm text-mute">No scores yet — log your first round above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {scores.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-white/[0.02] px-4 py-3"
              >
                <NumberBall n={s.score} tone={i === 0 ? "volt" : "dim"} size="sm" />
                {editing === s.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={45}
                      value={editVal}
                      onChange={(e) => setEditVal(Number(e.target.value))}
                      className="field !w-24 !px-3 !py-2"
                    />
                    <input
                      type="date"
                      max={today}
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="field !w-40 !px-3 !py-2"
                    />
                    <button onClick={() => saveEdit(s.id)} disabled={busy} className="chip !border-volt/40 !text-volt">
                      <Save className="size-3.5" /> Save
                    </button>
                    <button onClick={() => setEditing(null)} className="chip hover:text-ink">
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{s.score} points</p>
                      <p className="text-xs text-mute">{formatDate(s.date)}{i === 0 ? " · most recent" : ""}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditing(s.id);
                        setEditVal(s.score);
                        setEditDate(s.date);
                      }}
                      className="chip hover:text-ink"
                      aria-label="Edit score"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="chip hover:border-ember/40 hover:text-ember"
                      aria-label="Delete score"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* --------------------------- subscription panel ---------------------------- */

export function SubscriptionControls({
  status,
  isActive,
}: {
  status: string;
  isActive: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  async function call(action: "cancel" | "resume") {
    setBusy(true);
    setNote(null);
    const { ok, data } = await post("/api/billing", { action });
    setBusy(false);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Something went wrong." });
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isActive && status === "active" && (
        <button onClick={() => call("cancel")} disabled={busy} className="btn-danger !px-5 !py-2.5 text-xs">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          Cancel renewal
        </button>
      )}
      {status === "cancelled" && (
        <button onClick={() => call("resume")} disabled={busy} className="btn-volt !px-5 !py-2.5 text-xs">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Resume membership
        </button>
      )}
      {note && <Note tone={note.tone} msg={note.msg} />}
    </div>
  );
}

/* ------------------------------ charity panel ------------------------------ */

export function CharityPicker({
  charities,
  currentId,
  percent,
  minPercent,
}: {
  charities: { id: string; name: string }[];
  currentId: string | null;
  percent: number;
  minPercent: number;
}) {
  const [charityId, setCharityId] = useState(currentId ?? charities[0]?.id ?? "");
  const [pct, setPct] = useState(percent);
  const [busy, setBusy] = useState<"charity" | "pct" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  async function saveCharity() {
    setBusy("charity");
    setNote(null);
    const { ok, data } = await post("/api/profile", { action: "charity", charityId });
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not switch charity." });
    setNote({ tone: "ok", msg: "Charity updated — future payments will support them." });
  }

  async function savePct() {
    setBusy("pct");
    setNote(null);
    const { ok, data } = await post("/api/profile", { action: "percent", percent: pct });
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not update pledge." });
    setNote({ tone: "ok", msg: `Pledge updated to ${pct}%.` });
  }

  return (
    <div className="space-y-5">
      {note && <Note tone={note.tone} msg={note.msg} />}
      <div>
        <label className="field-label" htmlFor="charity">Your charity</label>
        <div className="flex gap-2">
          <select
            id="charity"
            value={charityId}
            onChange={(e) => setCharityId(e.target.value)}
            className="field"
          >
            {charities.map((c) => (
              <option key={c.id} value={c.id} className="bg-panel text-ink">
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={saveCharity}
            disabled={busy !== null || charityId === currentId}
            className="btn-volt shrink-0 !px-5 !py-3 text-xs disabled:opacity-40"
          >
            {busy === "charity" ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="field-label !mb-0" htmlFor="pct">Giving pledge</label>
          <span className="rounded-full bg-volt/15 px-2.5 py-0.5 text-xs font-bold text-volt">{pct}%</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="pct"
            type="range"
            min={minPercent}
            max={60}
            step={5}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="w-full accent-[#c7f24e]"
          />
          <button
            onClick={savePct}
            disabled={busy !== null || pct === percent}
            className="btn-ghost shrink-0 !px-4 !py-2 text-xs disabled:opacity-40"
          >
            {busy === "pct" ? <Loader2 className="size-3.5 animate-spin" /> : "Update"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-mute">Minimum {minPercent}% of each payment goes to your charity.</p>
      </div>
    </div>
  );
}

/* ------------------------------- donation box ------------------------------ */

export function DonationBox({
  charities,
  preselect,
}: {
  charities: { id: string; name: string }[];
  preselect?: string | null;
}) {
  const [charityId, setCharityId] = useState(preselect ?? charities[0]?.id ?? "");
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  async function donate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    const { ok, data } = await post("/api/donations", { charityId, amount: Number(amount) });
    setBusy(false);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Donation failed." });
    setNote({ tone: "ok", msg: `Thank you — £${Number(amount).toFixed(2)} donated. It has been added to the charity ledger.` });
  }

  return (
    <form onSubmit={donate} className="space-y-4">
      {note && <Note tone={note.tone} msg={note.msg} />}
      <div>
        <label className="field-label" htmlFor="donCharity">Donate directly to</label>
        <select
          id="donCharity"
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="field"
        >
          {charities.map((c) => (
            <option key={c.id} value={c.id} className="bg-panel text-ink">
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        {["5", "10", "25"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            className={cn("chip flex-1 justify-center", amount === v && "!border-volt/50 !bg-volt/10 !text-volt")}
          >
            £{v}
          </button>
        ))}
        <input
          type="number"
          min={1}
          step="0.5"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="field !w-24"
          aria-label="Custom amount"
        />
      </div>
      <button disabled={busy} className="btn-volt w-full !py-3 text-xs">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <HandCoins className="size-3.5" />}
        Donate £{Number(amount || 0).toFixed(2)}
      </button>
      <p className="text-center text-[10px] text-mute/70">Demo donation — recorded straight to the ledger.</p>
    </form>
  );
}

/* ------------------------------- proof upload ------------------------------ */

export function ProofUpload({ winnerId }: { winnerId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  async function upload() {
    if (!file) return setNote({ tone: "err", msg: "Choose a screenshot first." });
    setBusy(true);
    setNote(null);
    const fd = new FormData();
    fd.set("winnerId", winnerId);
    fd.set("file", file);
    const res = await fetch("/api/winners", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setNote({ tone: "err", msg: data.error ?? "Upload failed." });
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-4 transition hover:border-volt/40">
        <UploadCloud className="size-5 shrink-0 text-mute" />
        <span className="truncate text-xs text-mute">
          {file ? file.name : "Upload a screenshot of your scores (PNG, JPG, WebP — max 1.5MB)"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {note && <Note tone={note.tone} msg={note.msg} />}
      <button onClick={upload} disabled={busy || !file} className="btn-volt !px-5 !py-2.5 text-xs disabled:opacity-40">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
        Submit proof for review
      </button>
    </div>
  );
}
