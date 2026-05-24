"use client";

import { X } from "lucide-react";
import type { Memory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { MemoryCard } from "@/components/timeline/MemoryCard";

export function MemoryOfTheDay({
  memory,
  onDismiss,
  onOpen,
}: {
  memory: Memory;
  onDismiss: () => void;
  onOpen: (memory: Memory) => void;
}) {
  return (
    <section className="relative rounded-xl border border-[var(--border)] bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <p className="metadata text-[var(--accent)]">Remember this?</p>
        <Button variant="ghost" aria-label="Dismiss memory of the day" className="min-h-8 rounded-full px-2" onClick={onDismiss}>
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <MemoryCard memory={memory} query="" highlighted={false} onOpen={onOpen} />
    </section>
  );
}
