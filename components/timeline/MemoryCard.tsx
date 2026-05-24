"use client";

import { memo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { Memory } from "@/lib/types";
import { TagPill } from "@/components/ui/TagPill";
import { formatDate } from "@/lib/dateUtils";
import { cn, getCoverImage } from "@/lib/utils";
import { splitHighlight } from "@/lib/searchUtils";

export const MemoryCard = memo(function MemoryCard({
  memory,
  query,
  highlighted,
  compact = false,
  onOpen,
}: {
  memory: Memory;
  query: string;
  highlighted: boolean;
  compact?: boolean;
  onOpen: (memory: Memory) => void;
}) {
  const cover = getCoverImage(memory);

  return (
    <motion.article
      data-memory-id={memory.id}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.24 }}
      className={cn(
        "group cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 shadow-soft transition-shadow hover:shadow-elevated",
        highlighted && "highlight-pulse",
      )}
      onClick={() => onOpen(memory)}
      tabIndex={0}
      role="button"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(memory);
        }
      }}
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="metadata text-[var(--accent)]">{formatDate(memory.date)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {memory.tag ? <TagPill className="pointer-events-none px-2 py-1">{memory.tag}</TagPill> : null}
            {memory.images.length > 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {memory.images.length}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 font-serif text-2xl leading-tight text-[var(--text)]">
            <Highlighted value={memory.title} query={query} />
          </h3>
          {memory.description ? (
            <p className={cn("mt-2 text-sm leading-6 text-[var(--muted)]", compact ? "line-clamp-2" : "line-clamp-2")}>
              <Highlighted value={memory.description} query={query} />
            </p>
          ) : null}
        </div>
        {cover ? (
          <div className="h-[90px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-stone-100 max-[420px]:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.base64} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}
      </div>
    </motion.article>
  );
});

function Highlighted({ value, query }: { value: string; query: string }) {
  return (
    <>
      {splitHighlight(value, query).map((part, index) =>
        part.match ? (
          <mark key={`${part.text}-${index}`} className="rounded bg-[color:var(--accent-soft)] px-0.5 text-[var(--text)]">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}
