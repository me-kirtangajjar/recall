"use client";

import { CalendarDays, ListTree } from "lucide-react";
import type { ViewMode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <div className="flex rounded-full border border-[var(--border)] bg-white p-1 shadow-soft">
      <Button
        variant="ghost"
        aria-label="Timeline view"
        className={cn("min-h-9 rounded-full px-3", value === "timeline" && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:text-white")}
        onClick={() => onChange("timeline")}
      >
        <ListTree className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        aria-label="Year view"
        className={cn("min-h-9 rounded-full px-3", value === "year" && "bg-[var(--accent)] text-white hover:bg-[var(--accent)] hover:text-white")}
        onClick={() => onChange("year")}
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
