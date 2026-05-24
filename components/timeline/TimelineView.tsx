"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Memory } from "@/lib/types";
import { MemoryCard } from "@/components/timeline/MemoryCard";
import { TimelineLine } from "@/components/timeline/TimelineLine";

export function TimelineView({
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
  return (
    <div className="relative">
      <TimelineLine />
      <AnimatePresence mode="popLayout">
        {memories.map((memory, index) => (
          <motion.div
            key={memory.id}
            className="relative mb-5 pl-10 sm:pl-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: index * 0.035, duration: 0.24 }}
          >
            <span className="absolute left-[11px] top-8 h-3 w-3 rounded-full border-2 border-white bg-[var(--accent)] shadow-sm sm:left-[19px]" />
            <MemoryCard
              memory={memory}
              query={query}
              highlighted={highlightedId === memory.id}
              onOpen={onOpen}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
