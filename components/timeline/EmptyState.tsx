"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
      <motion.svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <path d="M35 85C52 56 70 51 89 64C103 73 115 72 130 45" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="35" cy="85" r="7" fill="#fff" stroke="#111" />
        <circle cx="89" cy="64" r="7" fill="#fff" stroke="#111" />
        <circle cx="130" cy="45" r="7" fill="#fff" stroke="#111" />
        <path d="M45 101H121" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
      </motion.svg>
      <h2 className="mt-6 font-serif text-4xl text-[var(--text)]">No memories yet.</h2>
      <p className="mt-3 max-w-sm leading-7 text-[var(--muted)]">Add your first one, and let this little private archive begin.</p>
      <Button className="mt-6" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add Memory
      </Button>
    </div>
  );
}
