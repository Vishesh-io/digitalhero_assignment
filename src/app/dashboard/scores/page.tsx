import { requireUser } from "@/lib/auth";
import { getUserSubscription, isSubscriptionActive, latestScoresFor } from "@/lib/core";
import { ScoreManager } from "@/components/dashboard-widgets";
import { FadeInOnLoad } from "@/components/motion";

export const metadata = { title: "My scores" };
export const dynamic = "force-dynamic";

export default async function ScoresPage() {
  const user = await requireUser();
  const sub = await getUserSubscription(user.id);
  const active = isSubscriptionActive(sub);
  const scores = (await latestScoresFor(user.id)).slice(0, 5);

  return (
    <FadeInOnLoad>
      <p className="kicker">Stableford scores</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">My scores</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        Your five most recent scores are your entry in every monthly draw.
        Only one score per date — values between 1 and 45.
      </p>

      <div className="mt-8">
        <ScoreManager
          locked={!active}
          initialScores={scores.map((sc) => ({ id: sc.id, score: sc.score, date: sc.scoreDate }))}
        />
      </div>
    </FadeInOnLoad>
  );
}
