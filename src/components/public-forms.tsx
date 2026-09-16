"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CreditCard,
  Heart,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function ErrorNote({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-2.5 text-xs text-ember">{msg}</p>
  );
}

/* --------------------------------- login ---------------------------------- */

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const { ok, data } = await post("/api/auth", {
      action: "login",
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!ok) {
      setError(data.error ?? "Login failed.");
      setBusy(false);
      return;
    }
    window.location.href = next || data.redirect || "/dashboard";
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote msg={error} />
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" placeholder="••••••••" />
      </div>
      <button disabled={busy} className="btn-volt w-full disabled:opacity-60">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Log in
      </button>
    </form>
  );
}

/* --------------------------------- signup --------------------------------- */

export function SignupForm({
  charities,
  minPercent,
  plan,
}: {
  charities: { id: string; name: string }[];
  minPercent: number;
  plan?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [percent, setPercent] = useState(Math.max(minPercent, 10));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const { ok, data } = await post("/api/auth", {
      action: "signup",
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      charityId: fd.get("charityId") || null,
      charityPercent: percent,
    });
    if (!ok) {
      setError(data.error ?? "Could not create your account.");
      setBusy(false);
      return;
    }
    window.location.href = data.redirect || "/dashboard";
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote msg={error} />
      <div>
        <label className="field-label" htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" required className="field" placeholder="Jordan Smith" />
      </div>
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" placeholder="Minimum 8 characters" />
      </div>
      <div>
        <label className="field-label" htmlFor="charityId">
          <span className="inline-flex items-center gap-1.5"><Heart className="size-3 text-volt" /> Charity you&apos;ll support</span>
        </label>
        <select id="charityId" name="charityId" className="field" defaultValue={charities[0]?.id ?? ""}>
          {charities.map((c) => (
            <option key={c.id} value={c.id} className="bg-panel text-ink">
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="field-label !mb-0" htmlFor="percent">Your giving pledge</label>
          <span className="rounded-full bg-volt/15 px-2.5 py-0.5 text-xs font-bold text-volt">{percent}%</span>
        </div>
        <input
          id="percent"
          type="range"
          min={minPercent}
          max={60}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="mt-2 w-full accent-[#c7f24e]"
        />
        <p className="mt-1 text-[11px] text-mute">
          Minimum {minPercent}% — this share of every payment goes straight to your charity.
        </p>
      </div>
      <button disabled={busy} className="btn-volt w-full disabled:opacity-60">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Create my account{plan ? ` — ${plan} plan` : ""}
      </button>
    </form>
  );
}

/* -------------------------------- subscribe -------------------------------- */

export function SubscribeButton({
  plan,
  label,
  authed,
  className = "btn-volt w-full",
}: {
  plan: "monthly" | "yearly";
  label: string;
  authed: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!authed) {
      router.push(`/signup?plan=${plan}`);
      return;
    }
    setBusy(true);
    const { ok, data } = await post("/api/billing", { action: "checkout", plan });
    if (!ok) {
      setBusy(false);
      alert(data.error ?? "Checkout failed.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <button onClick={go} disabled={busy} className={`${className} disabled:opacity-60`}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
      {label}
    </button>
  );
}

/* ------------------------------ demo checkout ------------------------------ */

export function DemoPayButton({ plan, amount }: { plan: "monthly" | "yearly"; amount: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/billing", { action: "activate", plan, demo: true });
    if (!ok) {
      setError(data.error ?? "Payment failed.");
      setBusy(false);
      return;
    }
    window.location.href = "/dashboard?activated=1";
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-2.5 text-xs text-ember">{error}</p>}
      <button onClick={pay} disabled={busy} className="btn-volt w-full !py-3.5 disabled:opacity-60">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Pay {amount} — activate {plan}
      </button>
      <p className="text-center text-[11px] text-mute">
        Demo gateway — no real card is charged. Connect Stripe keys to enable live billing.
      </p>
    </div>
  );
}

/* --------------------------------- logout ---------------------------------- */

export function LogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await post("/api/auth", { action: "logout" });
        window.location.href = "/";
      }}
      disabled={busy}
      className={className ?? "chip hover:border-ember/40 hover:text-ember"}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
      Log out
    </button>
  );
}

export function ArrowLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-volt hover:underline">
      {label} <ArrowRight className="size-3.5" />
    </a>
  );
}
