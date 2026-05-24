"use client";

import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SearchBar({
  value,
  onChange,
  onClear,
  total,
  shown,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  total: number;
  shown: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24 }}
      className="overflow-hidden"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search titles, details, and tags..."
            className="pl-10 pr-12"
            autoFocus
          />
          {value ? (
            <Button
              variant="ghost"
              aria-label="Clear search"
              className="absolute right-1 top-1/2 min-h-8 -translate-y-1/2 rounded-full px-2"
              onClick={onClear}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Showing {shown} of {total} memories
        </p>
      </div>
    </motion.div>
  );
}
