"use client";

import type { MemoryTag } from "@/lib/types";
import { MEMORY_TAGS } from "@/lib/types";
import { TagPill } from "@/components/ui/TagPill";

export function TagFilterBar({
  active,
  counts,
  onChange,
}: {
  active: MemoryTag | "All";
  counts: Record<MemoryTag | "All", number>;
  onChange: (tag: MemoryTag | "All") => void;
}) {
  const tags: Array<MemoryTag | "All"> = ["All", ...MEMORY_TAGS];

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto py-2">
      {tags.map((tag) => (
        <TagPill key={tag} active={active === tag} onClick={() => onChange(tag)}>
          {tag} ({counts[tag]})
        </TagPill>
      ))}
    </div>
  );
}
