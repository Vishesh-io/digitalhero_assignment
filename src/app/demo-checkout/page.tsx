import Link from "next/link";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/core";
import { formatMoney } from "@/lib/money";
import { DemoPayButton } from "@/components/public-forms";

export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function DemoCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const plan = planParam === "yearly" ? "yearly" : "monthly";
  const user = await requireUser(`/demo-checkout?plan=${plan}`);
  const s = await getSettings();

  const amount = plan === "yearly" ? s.yearlyPrice : s.monthlyPrice;

  return (
    <div className="noise relative flex min-h-screen items-center justify-center bg-bg px-4 py-16">
      <div className="glow-volt pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Digital Heroes — Checkout</p>
              <span className="chip !border-gold/40 !text-gold"><Lock className="size-3" /> Demo</span>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <div>
                <p className="text-sm capitalize text-mute">{plan} membership</p>
                <p className="text-xs text-mute/70">for {user.fullName}</p>
              </div>
              <p className="font-display text-3xl font-semibold">{formatMoney(amount)}</p>
            </div>
            <p className="mt-2 text-xs text-mute">
              Includes your giving pledge and {s.prizePoolPercent}% prize-pool contribution.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="field-label">Card number</label>
              <div className="relative">
                <input className="field pr-11" defaultValue="4242 4242 4242 4242" readOnly />
                <CreditCard className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Expiry</label>
                <input className="field" defaultValue="12 / 29" readOnly />
              </div>
              <div>
                <label className="field-label">CVC</label>
                <input className="field" defaultValue="424" readOnly />
              </div>
            </div>
            <DemoPayButton plan={plan} amount={formatMoney(amount)} />
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-mute">
              <ShieldCheck className="size-3.5 text-volt" /> PCI-DSS demo environment
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-mute">
          Changed your mind?{" "}
          <Link href="/pricing" className="font-semibold text-volt hover:underline">
            Back to pricing
          </Link>
        </p>
      </div>
    </div>
  );
}
