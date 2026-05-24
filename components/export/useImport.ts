"use client";

import { useState } from "react";
import type { Memory } from "@/lib/types";
import { parseTimelineZip } from "@/lib/zipUtils";
import { useUI } from "@/context/UIContext";

export function useImport() {
  const { addToast } = useUI();
  const [importing, setImporting] = useState(false);
  const [pendingMemories, setPendingMemories] = useState<Memory[] | null>(null);

  const readBackup = async (file: File) => {
    setImporting(true);
    try {
      const memories = await parseTimelineZip(file);
      setPendingMemories(memories);
      return memories;
    } catch (error) {
      addToast({
        type: "error",
        title: "Backup could not be restored",
        description:
          error instanceof Error
            ? error.message
            : "This doesn't look like a valid Recall backup file.",
      });
      return null;
    } finally {
      setImporting(false);
    }
  };

  const clearPending = () => setPendingMemories(null);

  return { importing, pendingMemories, readBackup, clearPending };
}
