"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CharityCard } from "@/components/ui";

export type DirectoryCharity = {
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
  events: { title: string; date: string; location: string; description?: string }[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
};

export function CharityDirectory({
  charities,
  raised,
}: {
  charities: DirectoryCharity[];
  raised: Record<string, number>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set(charities.map((c) => c.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [charities]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return charities.filter((c) => {
      if (cat !== "All" && c.category !== cat) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.tagline.toLowerCase().includes(needle) ||
        c.location.toLowerCase().includes(needle)
      );
    });
  }, [charities, q, cat]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search charities…"
            className="field !pl-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`chip transition ${
                cat === c ? "!border-volt/50 !bg-volt/10 !text-volt" : "hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card mt-8 px-6 py-12 text-center text-sm text-mute">
          No charities match that search yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CharityCard
              key={c.id}
              charity={c as unknown as Parameters<typeof CharityCard>[0]["charity"]}
              raised={raised[c.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
