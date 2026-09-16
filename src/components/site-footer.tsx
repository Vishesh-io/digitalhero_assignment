import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-volt text-bg">
                <HeartHandshake className="size-4.5" strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-semibold">
                Digital<span className="text-volt">Heroes</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-mute">
              A charity-first subscription prize club. Every subscription funds a cause —
              at least 10% goes straight to the charity you choose, and the prize pool
              keeps the game worth playing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="field-label">Platform</p>
              <ul className="space-y-2 text-sm text-mute">
                <li><Link className="hover:text-volt" href="/how-it-works">How it works</Link></li>
                <li><Link className="hover:text-volt" href="/pricing">Pricing</Link></li>
                <li><Link className="hover:text-volt" href="/charities">Charities</Link></li>
              </ul>
            </div>
            <div>
              <p className="field-label">Members</p>
              <ul className="space-y-2 text-sm text-mute">
                <li><Link className="hover:text-volt" href="/login">Log in</Link></li>
                <li><Link className="hover:text-volt" href="/signup">Sign up</Link></li>
                <li><Link className="hover:text-volt" href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="field-label">Fair play</p>
              <ul className="space-y-2 text-sm text-mute">
                <li>18+ only</li>
                <li>Play responsibly</li>
                <li>Verified payouts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-mute/70 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Digital Heroes Club Ltd. All rights reserved.</p>
          <p>Prize draws are simulated in demo mode when payments are not configured.</p>
        </div>
      </div>
    </footer>
  );
}
