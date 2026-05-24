"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Memory, MemoryImage, MemoryTag } from "@/lib/types";
import { MEMORY_TAGS } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/Input";
import { TagPill } from "@/components/ui/TagPill";
import { Textarea } from "@/components/ui/Textarea";
import { useMemories } from "@/context/MemoriesContext";
import { useUI } from "@/context/UIContext";
import { countWords, createId, getTodayInputValue, normalizeImages } from "@/lib/utils";

export function AddEditMemoryPanel({
  open,
  memory,
  onClose,
}: {
  open: boolean;
  memory: Memory | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? <PanelContent key={memory?.id ?? "new-memory"} memory={memory} onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function PanelContent({ memory, onClose }: { memory: Memory | null; onClose: () => void }) {
  const { addMemory, updateMemory } = useMemories();
  const { addToast } = useUI();
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const memoryId = useMemo(() => memory?.id ?? createId(), [memory?.id]);
  const [title, setTitle] = useState(memory?.title ?? "");
  const [date, setDate] = useState(memory?.date ?? getTodayInputValue());
  const [time, setTime] = useState(memory?.time ?? "");
  const [tag, setTag] = useState<MemoryTag | null>(memory?.tag ?? null);
  const [description, setDescription] = useState(memory?.description ?? "");
  const [images, setImages] = useState<MemoryImage[]>(memory?.images ?? []);
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [showNudge, setShowNudge] = useState(false);

  const save = (ignoreNudge = false) => {
    const nextErrors = {
      title: title.trim() ? undefined : "Give this memory a title.",
      date: date ? undefined : "Choose the day this happened.",
    };
    setErrors(nextErrors);

    if (nextErrors.title || nextErrors.date) {
      return;
    }

    if (!ignoreNudge && description.trim() && countWords(description) < 20) {
      setShowNudge(true);
      return;
    }

    const now = new Date().toISOString();
    const nextMemory: Memory = {
      id: memoryId,
      title: title.trim(),
      date,
      time: time || null,
      tag,
      description: description.trim(),
      images: normalizeImages(images),
      createdAt: memory?.createdAt ?? now,
      updatedAt: now,
    };

    if (memory) {
      updateMemory(nextMemory);
      addToast({ type: "success", title: "Memory updated." });
    } else {
      addMemory(nextMemory);
      addToast({ type: "success", title: "Memory added." });
    }

    onClose();
    window.setTimeout(() => {
      document.querySelector(`[data-memory-id="${nextMemory.id}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={memory ? "Edit memory" : "Add memory"}
        initial={{ x: "100%", y: 0 }}
        animate={{ x: 0, y: 0 }}
        exit={{ x: "100%", y: 0 }}
        transition={{ duration: 0.26 }}
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-[var(--border)] bg-white shadow-elevated max-sm:absolute max-sm:bottom-0 max-sm:h-[92vh] max-sm:max-w-none max-sm:rounded-t-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-serif text-3xl text-[var(--text)]">{memory ? "Edit memory" : "Add memory"}</h2>
          <Button variant="icon" aria-label="Close memory panel" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
          <label className="block">
            <span className="label-text">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What happened?"
              className="font-serif text-xl"
            />
            {errors.title ? <span className="form-error">{errors.title}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label-text">Date</span>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              {errors.date ? <span className="form-error">{errors.date}</span> : null}
            </label>
            <label className="block">
              <span className="label-text">Time</span>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
          </div>

          <div>
            <span className="label-text">Tag</span>
            <div className="flex flex-wrap gap-2">
              {MEMORY_TAGS.map((option) => (
                <TagPill
                  key={option}
                  active={tag === option}
                  onClick={() => setTag((current) => (current === option ? null : option))}
                >
                  {option}
                </TagPill>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="label-text">Description</span>
            <Textarea
              ref={descriptionRef}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setShowNudge(false);
              }}
              placeholder="Describe this moment... Future you will want every detail."
            />
          </label>

          {showNudge ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                Add a little more - future you will thank you.
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => save(true)}>
                  Save Anyway
                </Button>
                <Button type="button" variant="secondary" onClick={() => descriptionRef.current?.focus()}>
                  Keep Writing
                </Button>
              </div>
            </div>
          ) : null}

          <div>
            <span className="label-text">Photos and videos</span>
            <ImageUpload
              memoryId={memoryId}
              images={images}
              onChange={setImages}
              onWarning={(message) => addToast({ type: "warning", title: message })}
            />
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-5">
          <Button className="w-full" onClick={() => save(false)}>
            Save Memory
          </Button>
          <button
            type="button"
            className="mt-3 w-full text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
