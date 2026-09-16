"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  CircleDollarSign,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatDate, formatMoney, tierLabel } from "@/lib/money";
import { StatusBadge } from "@/components/ui";

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

/* ----------------------------- charity manager ----------------------------- */

export type EditableCharity = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  description: string;
  impact: string;
  imageUrl: string;
  websiteUrl: string;
  location: string;
  eventsJson: string;
  isFeatured: boolean;
  isActive: boolean;
};

const EMPTY_FORM = {
  name: "",
  tagline: "",
  category: "Community",
  description: "",
  impact: "",
  imageUrl: "",
  websiteUrl: "",
  location: "",
  eventsJson: "",
  isFeatured: false,
  isActive: true,
};

export function CharityManager({ charities }: { charities: EditableCharity[] }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function startEdit(c: EditableCharity) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      tagline: c.tagline,
      category: c.category,
      description: c.description,
      impact: c.impact,
      imageUrl: c.imageUrl,
      websiteUrl: c.websiteUrl,
      location: c.location,
      eventsJson: c.eventsJson,
      isFeatured: c.isFeatured,
      isActive: c.isActive,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setNote(null);
    const payload = {
      resource: "charity",
      action: editingId ? "update" : "create",
      id: editingId,
      ...form,
    };
    const { ok, data } = await postAdmin(payload);
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not save charity." });
    window.location.reload();
  }

  async function remove(id: string) {
    if (!confirm("Delete this charity? Donation history will stay, linked entries are detached.")) return;
    setBusy(id);
    await postAdmin({ resource: "charity", action: "delete", id });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mute">{charities.length} charities on the platform</p>
        <button onClick={() => (showForm ? reset() : setShowForm(true))} className="btn-volt !px-5 !py-2.5 text-xs">
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? "Close form" : "Add charity"}
        </button>
      </div>
      {note && <Note tone={note.tone} msg={note.msg} />}

      {showForm && (
        <form onSubmit={save} className="card space-y-5 p-6">
          <p className="font-display text-lg font-semibold">
            {editingId ? "Edit charity" : "New charity"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Name *</label>
              <input required value={form.name} onChange={field("name")} className="field" placeholder="Wellspring Water Trust" />
            </div>
            <div>
              <label className="field-label">Category</label>
              <input value={form.category} onChange={field("category")} className="field" placeholder="Clean Water" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Tagline</label>
              <input value={form.tagline} onChange={field("tagline")} className="field" placeholder="One line that captures the mission" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Description (blank line between paragraphs)</label>
              <textarea rows={4} value={form.description} onChange={field("description")} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Impact statement</label>
              <textarea rows={2} value={form.impact} onChange={field("impact")} className="field" placeholder="£10 funds…" />
            </div>
            <div>
              <label className="field-label">Image URL</label>
              <input value={form.imageUrl} onChange={field("imageUrl")} className="field" placeholder="https://images.pexels.com/…" />
            </div>
            <div>
              <label className="field-label">Website URL</label>
              <input value={form.websiteUrl} onChange={field("websiteUrl")} className="field" placeholder="https://…" />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input value={form.location} onChange={field("location")} className="field" placeholder="Edinburgh, UK" />
            </div>
            <div>
              <label className="field-label">Events (JSON array — golf days etc.)</label>
              <textarea
                rows={3}
                value={form.eventsJson}
                onChange={field("eventsJson")}
                className="field font-mono text-xs"
                placeholder='[{"title":"Charity Golf Day","date":"14 Jun 2026","location":"Muirfield"}]'
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mute">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="size-4 accent-[#c7f24e]"
              />
              Featured (homepage spotlight)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mute">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="size-4 accent-[#c7f24e]"
              />
              Active (visible in directory)
            </label>
          </div>
          <button disabled={busy === "save"} className="btn-volt !py-2.5 text-xs">
            {busy === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {editingId ? "Save changes" : "Create charity"}
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {charities.map((c) => (
          <div key={c.id} className="card overflow-hidden">
            <div className="relative h-32">
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-panel2 text-mute">
                  <ImageIcon className="size-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e]/90 to-transparent" />
              <div className="absolute bottom-2 left-3 flex gap-1.5">
                {c.isFeatured && (
                  <span className="chip !border-volt/50 !bg-volt !text-[#0a0b0e] !text-[9px]">
                    <Star className="size-2.5 fill-current" /> Featured
                  </span>
                )}
                {!c.isActive && <span className="chip !text-[9px] !text-ember !border-ember/40">Inactive</span>}
              </div>
            </div>
            <div className="p-4">
              <p className="font-display text-base font-semibold">{c.name}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-mute">{c.tagline || c.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => startEdit(c)} className="chip flex-1 justify-center hover:text-volt">
                  <Pencil className="size-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(c.id)}
                  disabled={busy === c.id}
                  className="chip justify-center hover:border-ember/40 hover:text-ember"
                >
                  {busy === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ winner manager ----------------------------- */

export type AdminWinnerRow = {
  id: string;
  userName: string;
  userEmail: string;
  drawLabel: string;
  tier: string;
  matchCount: number;
  prize: number;
  verification: string;
  payment: string;
  proofUrl: string | null;
  adminNotes: string | null;
  createdAt: string;
};

export function WinnerManager({ winners }: { winners: AdminWinnerRow[] }) {
  const [filter, setFilter] = useState<string>("needs_review");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const counts = {
    needs_review: winners.filter((w) => w.verification === "proof_submitted").length,
    pending_proof: winners.filter((w) => w.verification === "pending_proof").length,
    approved_unpaid: winners.filter((w) => w.verification === "approved" && w.payment !== "paid").length,
    all: winners.length,
  };

  const filtered = winners.filter((w) => {
    if (filter === "needs_review") return w.verification === "proof_submitted";
    if (filter === "pending_proof") return w.verification === "pending_proof";
    if (filter === "approved_unpaid") return w.verification === "approved" && w.payment !== "paid";
    if (filter === "paid") return w.payment === "paid";
    return true;
  });

  async function review(id: string, approve: boolean) {
    setBusy(id);
    setNote(null);
    const { ok, data } = await postAdmin({ resource: "winner", action: "review", winnerId: id, approve, notes });
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Review failed." });
    window.location.reload();
  }

  async function pay(id: string) {
    setBusy(id);
    setNote(null);
    const { ok, data } = await postAdmin({ resource: "winner", action: "pay", winnerId: id });
    setBusy(null);
    if (!ok) return setNote({ tone: "err", msg: data.error ?? "Could not mark paid." });
    window.location.reload();
  }

  const FILTERS = [
    { key: "needs_review", label: `Needs review (${counts.needs_review})` },
    { key: "pending_proof", label: `Awaiting proof (${counts.pending_proof})` },
    { key: "approved_unpaid", label: `Approved · unpaid (${counts.approved_unpaid})` },
    { key: "paid", label: "Paid" },
    { key: "all", label: `All (${counts.all})` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn("chip transition", filter === f.key && "!border-volt/50 !bg-volt/10 !text-volt")}
          >
            {f.label}
          </button>
        ))}
      </div>
      {note && <Note tone={note.tone} msg={note.msg} />}

      {filtered.length === 0 ? (
        <p className="card px-6 py-12 text-center text-sm text-mute">Nothing in this view right now.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((w) => (
            <div key={w.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {w.proofUrl ? (
                    <button onClick={() => setLightbox(w.proofUrl)} className="group relative shrink-0">
                      <img
                        src={w.proofUrl}
                        alt="Proof"
                        className="size-16 rounded-xl border border-line object-cover transition group-hover:border-volt/50"
                      />
                      <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/40 text-[9px] font-bold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">
                        View
                      </span>
                    </button>
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-dashed border-white/15 text-mute">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{w.userName}</p>
                    <p className="text-xs text-mute">{w.userEmail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="chip !border-gold/40 !text-gold">{tierLabel(w.tier)} · {w.matchCount} matches</span>
                      <StatusBadge status={w.verification} />
                      <StatusBadge status={w.payment} />
                    </div>
                    <p className="mt-1.5 text-xs text-mute">
                      {w.drawLabel} · {formatDate(w.createdAt)}
                      {w.adminNotes ? ` · notes: ${w.adminNotes}` : ""}
                    </p>
                  </div>
                </div>
                <p className="font-display text-xl font-semibold text-gold">{formatMoney(w.prize)}</p>
              </div>

              {w.verification === "proof_submitted" && (
                <div className="mt-4 border-t border-line pt-4">
                  {reviewing === w.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Review notes (optional — shared with the member if rejected)"
                        className="field"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => review(w.id, true)}
                          disabled={busy !== null}
                          className="btn-volt !px-5 !py-2 text-xs"
                        >
                          {busy === w.id ? <Loader2 className="size-3.5 animate-spin" /> : <BadgeCheck className="size-3.5" />}
                          Approve proof
                        </button>
                        <button
                          onClick={() => review(w.id, false)}
                          disabled={busy !== null}
                          className="btn-danger !px-5 !py-2 text-xs"
                        >
                          <X className="size-3.5" /> Reject
                        </button>
                        <button onClick={() => setReviewing(null)} className="btn-ghost !px-5 !py-2 text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReviewing(w.id); setNotes(""); }} className="btn-ghost !px-5 !py-2 text-xs">
                      <BadgeCheck className="size-3.5" /> Review proof
                    </button>
                  )}
                </div>
              )}

              {w.verification === "approved" && w.payment !== "paid" && (
                <div className="mt-4 border-t border-line pt-4">
                  <button onClick={() => pay(w.id)} disabled={busy !== null} className="btn-gold !px-5 !py-2 text-xs">
                    {busy === w.id ? <Loader2 className="size-3.5 animate-spin" /> : <CircleDollarSign className="size-3.5" />}
                    Mark as paid
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Proof" className="max-h-[85vh] max-w-full rounded-2xl border border-line object-contain" />
        </div>
      )}
    </div>
  );
}
