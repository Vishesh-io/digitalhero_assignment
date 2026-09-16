import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/core";
import { SettingsManager } from "@/components/admin-widgets";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "Admin — Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const s = await getSettings();

  return (
    <FadeInOnLoad>
      <p className="kicker">Configuration</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Platform settings</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Prices, pool maths and draw timing. Changes apply to new checkouts and the next simulation immediately.
      </p>

      <div className="mt-8 max-w-2xl">
        <SettingsManager
          initial={{
            monthlyPrice: s.monthlyPrice,
            yearlyPrice: s.yearlyPrice,
            prizePoolPercent: s.prizePoolPercent,
            minCharityPercent: s.minCharityPercent,
            drawDay: s.drawDay,
            jackpotRollover: s.jackpotRollover,
          }}
        />
      </div>
    </FadeInOnLoad>
  );
}
