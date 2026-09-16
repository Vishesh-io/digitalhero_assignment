import Link from "next/link";
import {
  Dices,
  Heart,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Target,
  Trophy,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DashNav } from "@/components/dash-nav";
import { LogoutButton } from "@/components/public-forms";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
    { href: "/dashboard/scores", label: "My scores", icon: <Target className="size-4" /> },
    { href: "/dashboard/charity", label: "Charity & giving", icon: <Heart className="size-4" /> },
    { href: "/dashboard/draws", label: "Draws", icon: <Dices className="size-4" /> },
    { href: "/dashboard/winnings", label: "Winnings", icon: <Trophy className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-volt text-bg">
              <HeartHandshake className="size-4" strokeWidth={2.4} />
            </span>
            <span className="font-display text-base font-semibold">
              Digital<span className="text-volt">Heroes</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-mute sm:block">{user.fullName}</span>
            <Link href="/" className="chip hover:text-ink">
              <Home className="size-3.5" /> Site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <DashNav items={items} />
            <div className="card mt-6 hidden p-4 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">Signed in as</p>
              <p className="mt-1.5 truncate text-sm font-semibold">{user.email}</p>
              <p className="mt-0.5 text-xs capitalize text-mute">{user.role}</p>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
