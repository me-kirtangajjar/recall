"use client";

import type { Memory } from "@/lib/types";
import { MemoryCard } from "@/components/timeline/MemoryCard";
import { getYear } from "@/lib/dateUtils";

export function YearView({
  memories,
  query,
  highlightedId,
  onOpen,
}: {
  memories: Memory[];
  query: string;
  highlightedId: string | null;
  onOpen: (memory: Memory) => void;
}) {
  const grouped = memories.reduce<Record<string, Memory[]>>((groups, memory) => {
    const year = getYear(memory.date);
    groups[year] = [...(groups[year] ?? []), memory];
    return groups;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-14">
      {years.map((year) => (
        <section key={year} className="relative">
          <h2 className="pointer-events-none font-serif text-[82px] leading-none text-[var(--text)] opacity-[0.08] sm:text-8xl">
            {year}
          </h2>
          <div className="-mt-5 grid gap-4 sm:grid-cols-2">
            {grouped[year].map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                query={query}
                compact
                highlighted={highlightedId === memory.id}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
