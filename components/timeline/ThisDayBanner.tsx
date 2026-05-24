"use client";

import { X } from "lucide-react";
import type { Memory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { getCoverImage } from "@/lib/utils";
import { yearsAgo } from "@/lib/dateUtils";
import { MediaView } from "@/components/ui/MediaView";

export function ThisDayBanner({ memory, onDismiss, onOpen }: { memory: Memory; onDismiss: () => void; onOpen: () => void }) {
  const cover = getCoverImage(memory);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white p-5 shadow-soft">
      {cover ? (
        <>
          <MediaView media={cover} className="absolute inset-0 h-full w-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-white/80" />
        </>
      ) : null}
      <div className="relative flex items-start gap-4">
        <button type="button" className="flex-1 text-left" onClick={onOpen}>
          <p className="metadata text-[var(--accent)]">This Day in History</p>
          <h2 className="mt-2 font-serif text-2xl text-[var(--text)]">
            {yearsAgo(memory.date)} years ago today · {memory.title}
          </h2>
        </button>
        <Button variant="ghost" aria-label="Dismiss this day in history" className="min-h-8 rounded-full px-2" onClick={onDismiss}>
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
