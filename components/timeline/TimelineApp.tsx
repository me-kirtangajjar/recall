"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Ellipsis, Import, Plus, Search, SortAsc, SortDesc, Trash2 } from "lucide-react";
import type { Memory, MemoryTag, SortOrder, ViewMode } from "@/lib/types";
import { useMemories } from "@/context/MemoriesContext";
import { useUI } from "@/context/UIContext";
import { useExport } from "@/components/export/useExport";
import { useImport } from "@/components/export/useImport";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SearchBar } from "@/components/ui/SearchBar";
import { AddEditMemoryPanel } from "@/components/memory/AddEditMemoryPanel";
import { MemoryDetailModal } from "@/components/memory/MemoryDetailModal";
import { EmptyState } from "@/components/timeline/EmptyState";
import { MemoryOfTheDay } from "@/components/timeline/MemoryOfTheDay";
import { TagFilterBar } from "@/components/timeline/TagFilterBar";
import { ThisDayBanner } from "@/components/timeline/ThisDayBanner";
import { TimelineView } from "@/components/timeline/TimelineView";
import { ViewToggle } from "@/components/timeline/ViewToggle";
import { YearView } from "@/components/timeline/YearView";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { filterMemories, getTagCounts } from "@/lib/searchUtils";
import { getMemoryOfTheDay, getThisDayMemory, todayKey } from "@/lib/dateUtils";
import { sortMemories } from "@/lib/dateUtils";

export function TimelineApp() {
  const {
    memories,
    loaded,
    hadStoredDataOnLoad,
    highlightedId,
    replaceMemories,
    mergeMemories,
    resetTimeline,
  } = useMemories();
  const { addToast } = useUI();
  const { exporting, progress, exportTimeline } = useExport();
  const { importing, pendingMemories, readBackup, clearPending } = useImport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<MemoryTag | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [dismissedThisDay, setDismissedThisDay] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(`recall_this_day_${todayKey()}`) === "1",
  );
  const [dismissedMotd, setDismissedMotd] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(`recall_motd_${todayKey()}`) === "1",
  );

  const openAddPanel = useCallback(() => {
    setEditingMemory(null);
    setPanelOpen(true);
  }, []);

  useEffect(() => {
    document.title = "Recall — A Local-First Memory Timeline";
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(searchInput), 150);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (!isTyping && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openAddPanel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAddPanel]);

  const visibleMemories = useMemo(
    () => sortMemories(filterMemories(memories, { query, tag: activeTag }), sortOrder),
    [activeTag, memories, query, sortOrder],
  );
  const counts = useMemo(() => getTagCounts(memories, query), [memories, query]);
  const searchActive = searchOpen && query.trim().length > 0;
  const thisDayMemory = useMemo(() => getThisDayMemory(memories), [memories]);
  const motd = useMemo(() => getMemoryOfTheDay(memories), [memories]);

  const openEditPanel = (memory: Memory) => {
    setEditingMemory(memory);
    setPanelOpen(true);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const restored = await readBackup(file);
    if (!restored) {
      return;
    }

    if (memories.length > 0) {
      setMergeDialogOpen(true);
    } else {
      replaceMemories(restored, true);
      addToast({ type: "success", title: `Welcome back! ${restored.length} memories restored.` });
      clearPending();
    }
  };

  const dismissThisDay = () => {
    sessionStorage.setItem(`recall_this_day_${todayKey()}`, "1");
    setDismissedThisDay(true);
  };

  const dismissMotd = () => {
    sessionStorage.setItem(`recall_motd_${todayKey()}`, "1");
    setDismissedMotd(true);
  };

  if (!loaded) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="sr-only" onChange={handleImport} />
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <div>
              <p className="font-serif text-3xl leading-none text-[var(--text)]">Recall</p>
              <p className="metadata mt-1 text-[var(--muted)]">Private on this device</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="icon"
                aria-label="Toggle search"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  if (searchOpen) {
                    setSearchInput("");
                    setQuery("");
                  }
                }}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="icon" aria-label="Add memory" onClick={openAddPanel}>
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="icon" aria-label="Export backup" onClick={() => setExportModalOpen(true)}>
                <Download className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="relative">
                <Button variant="icon" aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)}>
                  <Ellipsis className="h-4 w-4" aria-hidden="true" />
                </Button>
                <AnimatePresence>
                  {menuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-white p-1 shadow-elevated"
                    >
                      <MenuButton
                        icon={<Import className="h-4 w-4" aria-hidden="true" />}
                        label={importing ? "Restoring..." : "Import Backup"}
                        onClick={() => {
                          setMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                      />
                      <MenuButton
                        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                        label="New Timeline"
                        onClick={() => {
                          setMenuOpen(false);
                          setResetConfirmOpen(true);
                        }}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {searchOpen ? (
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onClear={() => {
                  setSearchInput("");
                  setQuery("");
                }}
                total={memories.length}
                shown={visibleMemories.length}
              />
            ) : null}
          </AnimatePresence>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-5">
            {!searchActive && activeTag === "All" && thisDayMemory && !dismissedThisDay ? (
              <ThisDayBanner
                memory={thisDayMemory}
                onDismiss={dismissThisDay}
                onOpen={() => setSelectedMemory(thisDayMemory)}
              />
            ) : null}
            {!searchActive && activeTag === "All" && hadStoredDataOnLoad && motd && !dismissedMotd ? (
              <MemoryOfTheDay memory={motd} onDismiss={dismissMotd} onOpen={setSelectedMemory} />
            ) : null}
          </div>

          <div className="mt-6">
            <TagFilterBar active={activeTag} counts={counts} onChange={setActiveTag} />
          </div>

          {memories.length > 0 ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                {query ? `Showing ${visibleMemories.length} of ${memories.length} memories` : `${memories.length} memories`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  aria-label={sortOrder === "newest" ? "Sort oldest first" : "Sort newest first"}
                  className="min-h-10 rounded-full px-3"
                  onClick={() => setSortOrder((order) => (order === "newest" ? "oldest" : "newest"))}
                >
                  {sortOrder === "newest" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                  <span className="hidden sm:inline">{sortOrder === "newest" ? "Newest" : "Oldest"}</span>
                </Button>
                <ViewToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            {memories.length === 0 ? (
              <EmptyState onAdd={openAddPanel} />
            ) : visibleMemories.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center shadow-soft">
                <h2 className="font-serif text-3xl text-[var(--text)]">No memories match your search.</h2>
                <p className="mt-2 text-[var(--muted)]">Try a different word or tag.</p>
              </div>
            ) : viewMode === "timeline" ? (
              <TimelineView memories={visibleMemories} query={query} highlightedId={highlightedId} onOpen={setSelectedMemory} />
            ) : (
              <YearView memories={visibleMemories} query={query} highlightedId={highlightedId} onOpen={setSelectedMemory} />
            )}
          </div>
        </main>

        <AddEditMemoryPanel open={panelOpen} memory={editingMemory} onClose={() => setPanelOpen(false)} />
        <MemoryDetailModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} onEdit={openEditPanel} />

        <Modal open={exportModalOpen} title="Save Backup" onClose={() => setExportModalOpen(false)}>
          <div className="space-y-5 p-5">
            <p className="leading-7 text-[var(--muted)]">
              Save a backup of your timeline to your computer. You can restore it anytime on any device.
            </p>
            {exporting ? <ProgressBar value={progress} /> : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setExportModalOpen(false)} disabled={exporting}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await exportTimeline(memories);
                  setExportModalOpen(false);
                }}
                disabled={exporting}
              >
                {exporting ? "Preparing Backup..." : "Save Backup"}
              </Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={resetConfirmOpen}
          title="Start a new timeline?"
          message="This clears the memories stored in this browser. Export a backup first if you want to keep them."
          confirmLabel="New Timeline"
          destructive
          onConfirm={() => {
            resetTimeline();
            setResetConfirmOpen(false);
            addToast({ type: "success", title: "A fresh timeline is ready." });
          }}
          onClose={() => setResetConfirmOpen(false)}
        />

        <Modal open={mergeDialogOpen} title="Restore Backup" onClose={() => setMergeDialogOpen(false)}>
          <div className="space-y-5 p-5">
            <p className="leading-7 text-[var(--muted)]">
              Replace your current timeline with this backup, or merge them? Merging keeps one copy of memories with the same id.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  if (pendingMemories) {
                    mergeMemories(pendingMemories);
                    addToast({ type: "success", title: `Welcome back! ${pendingMemories.length} memories restored.` });
                  }
                  clearPending();
                  setMergeDialogOpen(false);
                }}
              >
                Merge
              </Button>
              <Button
                onClick={() => {
                  if (pendingMemories) {
                    replaceMemories(pendingMemories, true);
                    addToast({ type: "success", title: `Welcome back! ${pendingMemories.length} memories restored.` });
                  }
                  clearPending();
                  setMergeDialogOpen(false);
                }}
              >
                Replace
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text)] hover:bg-stone-50"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
