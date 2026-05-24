"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type TextareaHTMLAttributes } from "react";
import { cn, countWords } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, value, ...props },
  forwardedRef,
) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(forwardedRef, () => ref.current as HTMLTextAreaElement);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        rows={5}
        className={cn(
          "w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm leading-7 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]",
          className,
        )}
        {...props}
      />
      <p className="mt-1 text-xs text-[var(--muted)]">{countWords(value)} words</p>
    </div>
  );
});
