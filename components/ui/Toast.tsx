"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.24 }}
            className={cn(
              "rounded-xl border bg-white p-4 shadow-elevated",
              toast.type === "success" && "border-emerald-200",
              toast.type === "error" && "border-red-200",
              toast.type === "warning" && "border-amber-200",
              toast.type === "info" && "border-[var(--border)]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{toast.description}</p>
                ) : null}
              </div>
              <Button variant="ghost" className="min-h-8 rounded-full px-2 py-1" onClick={() => onDismiss(toast.id)}>
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Dismiss notification</span>
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
