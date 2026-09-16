"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartHandshake, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/money";

type NavUser = { fullName: string; role: string } | null;

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/charities", label: "Charities" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-volt text-bg transition-transform duration-300 group-hover:rotate-6">
            <HeartHandshake className="size-4.5" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Digital<span className="text-volt">Heroes</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-mute transition hover:text-ink",
                (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)) && "text-volt"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="btn-ghost !px-4 !py-2 text-xs">
                  <ShieldCheck className="size-3.5" /> Admin
                </Link>
              )}
              <Link href="/dashboard" className="btn-volt !px-4 !py-2 text-xs">
                <LayoutDashboard className="size-3.5" /> Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm text-mute transition hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="btn-volt !px-5 !py-2 text-xs">
                Become a Hero
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="grid size-10 place-items-center rounded-full border border-white/10 text-ink md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3 text-sm text-mute transition hover:bg-white/5 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link href="/admin" className="btn-ghost flex-1 !py-2.5 text-xs">Admin</Link>
                  )}
                  <Link href="/dashboard" className="btn-volt flex-1 !py-2.5 text-xs">Dashboard</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost flex-1 !py-2.5 text-xs">Log in</Link>
                  <Link href="/signup" className="btn-volt flex-1 !py-2.5 text-xs">Become a Hero</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
