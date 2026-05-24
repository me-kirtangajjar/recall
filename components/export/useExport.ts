"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import type { Memory } from "@/lib/types";
import { buildTimelineZip } from "@/lib/zipUtils";
import { useUI } from "@/context/UIContext";

export function useExport() {
  const { addToast } = useUI();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportTimeline = async (memories: Memory[]) => {
    setExporting(true);
    setProgress(5);
    try {
      const result = await buildTimelineZip(memories, setProgress);
      saveAs(result.blob, result.filename);
      addToast({ type: "success", title: "Backup saved successfully!" });
    } catch {
      addToast({
        type: "error",
        title: "Backup could not be saved",
        description: "Try again in a moment, or remove a very large media file and retry.",
      });
    } finally {
      setProgress(0);
      setExporting(false);
    }
  };

  return { exporting, progress, exportTimeline };
}
