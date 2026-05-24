"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white shadow-soft hover:bg-[var(--accent-dark)]",
        variant === "secondary" && "border border-[var(--border)] bg-white text-[var(--text)] hover:bg-stone-50",
        variant === "ghost" && "text-[var(--muted)] hover:bg-stone-100 hover:text-[var(--text)]",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        variant === "icon" &&
          "h-10 w-10 rounded-full border border-[var(--border)] bg-white p-0 text-[var(--muted)] hover:bg-stone-50 hover:text-[var(--text)]",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
