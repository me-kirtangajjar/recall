"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Memory } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { TagPill } from "@/components/ui/TagPill";
import { useMemories } from "@/context/MemoriesContext";
import { useUI } from "@/context/UIContext";
import { formatDateTime } from "@/lib/dateUtils";

export function MemoryDetailModal({
  memory,
  onClose,
  onEdit,
}: {
  memory: Memory | null;
  onClose: () => void;
  onEdit: (memory: Memory) => void;
}) {
  const { deleteMemory } = useMemories();
  const { addToast } = useUI();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!memory) {
    return null;
  }

  const deleteSelected = () => {
    deleteMemory(memory.id);
    setConfirmingDelete(false);
    onClose();
    addToast({ type: "success", title: "Memory deleted." });
  };

  return (
    <>
      <Modal open={Boolean(memory)} title="Memory" wide onClose={onClose}>
        <div>
          <ImageCarousel images={memory.images} />
          <div className="space-y-5 p-5 sm:p-8">
            {memory.tag ? (
              <TagPill active className="pointer-events-none">
                {memory.tag}
              </TagPill>
            ) : null}
            <p className="metadata">{formatDateTime(memory.date, memory.time)}</p>
            <h2 className="font-serif text-4xl leading-tight text-[var(--text)]">{memory.title}</h2>
            {memory.description ? (
              <p className="whitespace-pre-wrap text-base leading-8 text-[var(--text)]">{memory.description}</p>
            ) : (
              <p className="italic leading-7 text-[var(--muted)]">Some memories are quiet. This one has no notes yet.</p>
            )}
            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  onClose();
                  onEdit(memory);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this memory?"
        message="This removes the memory from this browser. Export a backup first if you may want it later."
        confirmLabel="Delete Memory"
        destructive
        onConfirm={deleteSelected}
        onClose={() => setConfirmingDelete(false)}
      />
    </>
  );
}
