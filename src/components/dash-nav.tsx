"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/money";

export type DashNavItem = { href: string; label: string; icon: React.ReactNode };

export function DashNav({ items }: { items: DashNavItem[] }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const active =
          item.href === "/dashboard" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const isPending = pendingHref === item.href && !active;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={() => {
              if (item.href !== pathname) {
                setPendingHref(item.href);
              }
            }}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-all duration-150",
              active
                ? "border border-volt/25 bg-volt/10 text-volt font-medium"
                : isPending
                ? "border border-volt/40 bg-volt/15 text-volt animate-pulse"
                : "border border-transparent text-mute hover:bg-white/5 hover:text-ink"
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
            {isPending && <Loader2 className="ml-auto size-3.5 animate-spin text-volt" />}
          </Link>
        );
      })}
    </nav>
  );
}
