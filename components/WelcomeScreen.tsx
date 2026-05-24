"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Lock, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useImport } from "@/components/export/useImport";
import { useMemories } from "@/context/MemoriesContext";
import { useUI } from "@/context/UIContext";
import { hasTimelineStorage } from "@/lib/storageUtils";

export function WelcomeScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { loaded, memories, startFresh, replaceMemories } = useMemories();
  const { addToast } = useUI();
  const { importing, readBackup } = useImport();

  useEffect(() => {
    document.title = "Recall — A Local-First Memory Timeline";
    if (memories.length > 0 || hasTimelineStorage()) {
      router.replace("/timeline");
    }
  }, [memories.length, router]);

  const start = () => {
    startFresh();
    router.push("/timeline");
  };

  const restore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const memories = await readBackup(file);
    if (memories) {
      replaceMemories(memories, true);
      addToast({ type: "success", title: `Welcome back! ${memories.length} memories restored.` });
      router.push("/timeline");
    }
  };

  if (!loaded) {
    return <main className="min-h-screen bg-[var(--background)]" />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-10">
      <div className="grain" aria-hidden="true" />
      <input ref={inputRef} type="file" accept=".zip,application/zip" className="sr-only" onChange={restore} />
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-soft">
          <Sparkles className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
        </div>
        <p className="metadata mb-4 text-[var(--accent)]">A local-first memory timeline</p>
        <h1 className="font-serif text-6xl leading-[1.02] text-[var(--text)] sm:text-7xl">Recall</h1>
        <p className="mt-5 text-xl leading-9 text-[var(--muted)]">
          Preserving life&apos;s most meaningful moments.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
          Create beautiful memories with photos, stories, and dates — all stored privately on your device with seamless backup and restore support.
        </p>
        <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="flex-1" onClick={start}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Start Fresh
          </Button>
          <Button className="flex-1" variant="secondary" onClick={() => inputRef.current?.click()} disabled={importing}>
            <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
            {importing ? "Restoring..." : "Restore from Backup"}
          </Button>
        </div>
        {importing ? (
          <div className="mx-auto mt-5 max-w-md">
            <ProgressBar value={55} />
          </div>
        ) : null}
        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--muted)] shadow-soft">
          <Lock className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          Everything stays on your device.
        </div>
      </motion.section>
    </main>
  );
}
