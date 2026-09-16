import Link from "next/link";
import {
  BarChart3,
  Dices,
  HandHeart,
  HeartHandshake,
  Home,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { DashNav } from "@/components/dash-nav";
import { LogoutButton } from "@/components/public-forms";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const items = [
    { href: "/admin", label: "Overview", icon: <BarChart3 className="size-4" /> },
    { href: "/admin/draws", label: "Draws", icon: <Dices className="size-4" /> },
    { href: "/admin/charities", label: "Charities", icon: <HandHeart className="size-4" /> },
    { href: "/admin/winners", label: "Winners", icon: <Trophy className="size-4" /> },
    { href: "/admin/users", label: "Members", icon: <Users className="size-4" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gold text-bg">
              <HeartHandshake className="size-4" strokeWidth={2.4} />
            </span>
            <span className="font-display text-base font-semibold">
              Digital<span className="text-gold">Heroes</span>
              <span className="ml-2 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gold">
                ADMIN
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-mute sm:block">{user.fullName}</span>
            <Link href="/" className="chip hover:text-ink">
              <Home className="size-3.5" /> Site
            </Link>
            <Link href="/dashboard" className="chip hover:text-ink">
              My dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <DashNav items={items} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
