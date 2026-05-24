"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Memory } from "@/lib/types";
import {
  clearRecallDb,
  deleteMemoryFromDb,
  hydrateLegacyMedia,
  mergeMemoriesIntoDb,
  readMemoriesFromDb,
  replaceMemoriesInDb,
  saveMemoryToDb,
} from "@/lib/dbUtils";
import { clearTimelineStorage, readTimelineStorage } from "@/lib/storageUtils";
import { normalizeImages } from "@/lib/utils";
import { useUI } from "@/context/UIContext";

interface MemoriesState {
  memories: Memory[];
  loaded: boolean;
  hadStoredDataOnLoad: boolean;
  highlightedId: string | null;
}

type MemoriesAction =
  | { type: "LOAD"; memories: Memory[]; hadStoredDataOnLoad: boolean }
  | { type: "START_FRESH" }
  | { type: "ADD"; memory: Memory }
  | { type: "UPDATE"; memory: Memory }
  | { type: "DELETE"; id: string }
  | { type: "REPLACE"; memories: Memory[]; hadStoredDataOnLoad?: boolean }
  | { type: "MERGE"; memories: Memory[] }
  | { type: "CLEAR_HIGHLIGHT" }
  | { type: "RESET" };

interface MemoriesContextValue extends MemoriesState {
  startFresh: () => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (memory: Memory) => void;
  deleteMemory: (id: string) => void;
  replaceMemories: (memories: Memory[], hadStoredDataOnLoad?: boolean) => void;
  mergeMemories: (memories: Memory[]) => void;
  resetTimeline: () => void;
}

const MemoriesContext = createContext<MemoriesContextValue | null>(null);

function reducer(state: MemoriesState, action: MemoriesAction): MemoriesState {
  switch (action.type) {
    case "LOAD":
      return {
        memories: normalizeCollection(action.memories),
        loaded: true,
        hadStoredDataOnLoad: action.hadStoredDataOnLoad,
        highlightedId: null,
      };
    case "START_FRESH":
      return {
        memories: [],
        loaded: true,
        hadStoredDataOnLoad: false,
        highlightedId: null,
      };
    case "ADD":
      return {
        ...state,
        memories: normalizeCollection([action.memory, ...state.memories]),
        highlightedId: action.memory.id,
      };
    case "UPDATE":
      return {
        ...state,
        memories: normalizeCollection(
          state.memories.map((memory) => (memory.id === action.memory.id ? action.memory : memory)),
        ),
        highlightedId: action.memory.id,
      };
    case "DELETE":
      return {
        ...state,
        memories: state.memories.filter((memory) => memory.id !== action.id),
        highlightedId: null,
      };
    case "REPLACE":
      return {
        memories: normalizeCollection(action.memories),
        loaded: true,
        hadStoredDataOnLoad: action.hadStoredDataOnLoad ?? true,
        highlightedId: null,
      };
    case "MERGE": {
      const existing = new Map(state.memories.map((memory) => [memory.id, memory]));
      for (const memory of action.memories) {
        existing.set(memory.id, memory);
      }

      return {
        ...state,
        memories: normalizeCollection([...existing.values()]),
        highlightedId: null,
      };
    }
    case "CLEAR_HIGHLIGHT":
      return { ...state, highlightedId: null };
    case "RESET":
      return {
        memories: [],
        loaded: true,
        hadStoredDataOnLoad: false,
        highlightedId: null,
      };
    default:
      return state;
  }
}

export function MemoriesProvider({ children }: { children: ReactNode }) {
  const { addToast } = useUI();
  const [state, dispatch] = useReducer(reducer, {
    memories: [],
    loaded: false,
    hadStoredDataOnLoad: false,
    highlightedId: null,
  });

  const reportStorageError = useCallback(
    (error: unknown) => {
      addToast({
        type: "warning",
        title: "Recall could not finish saving",
        description:
          error instanceof DOMException && error.name === "QuotaExceededError"
            ? "This browser is running low on storage. Export a ZIP backup and remove large media if needed."
            : "Export a ZIP backup before continuing, then refresh and try again.",
      });
    },
    [addToast],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const dbMemories = await readMemoriesFromDb();
        if (dbMemories.length > 0) {
          if (!cancelled) {
            dispatch({ type: "LOAD", memories: dbMemories, hadStoredDataOnLoad: true });
          }
          return;
        }

        const legacy = readTimelineStorage();
        const legacyMemories =
          legacy.data?.memories.map((memory) => ({
            ...memory,
            images: memory.images.map(hydrateLegacyMedia),
          })) ?? [];

        if (legacyMemories.length > 0) {
          await replaceMemoriesInDb(legacyMemories);
          clearTimelineStorage();
        }

        if (!cancelled) {
          dispatch({
            type: "LOAD",
            memories: legacyMemories,
            hadStoredDataOnLoad: legacy.existed && legacyMemories.length > 0,
          });
        }
      } catch (error) {
        reportStorageError(error);
        if (!cancelled) {
          dispatch({ type: "LOAD", memories: [], hadStoredDataOnLoad: false });
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [reportStorageError]);

  useEffect(() => {
    if (!state.highlightedId) {
      return;
    }

    const timeout = window.setTimeout(() => dispatch({ type: "CLEAR_HIGHLIGHT" }), 2600);
    return () => window.clearTimeout(timeout);
  }, [state.highlightedId]);

  const startFresh = useCallback(() => {
    clearTimelineStorage();
    void clearRecallDb().catch(reportStorageError);
    dispatch({ type: "START_FRESH" });
  }, [reportStorageError]);

  const addMemory = useCallback(
    (memory: Memory) => {
      dispatch({ type: "ADD", memory });
      void saveMemoryToDb(memory).catch(reportStorageError);
    },
    [reportStorageError],
  );

  const updateMemory = useCallback(
    (memory: Memory) => {
      dispatch({ type: "UPDATE", memory });
      void saveMemoryToDb(memory).catch(reportStorageError);
    },
    [reportStorageError],
  );

  const deleteMemory = useCallback(
    (id: string) => {
      const selected = state.memories.find((memory) => memory.id === id);
      dispatch({ type: "DELETE", id });
      if (selected) {
        void deleteMemoryFromDb(selected).catch(reportStorageError);
      }
    },
    [reportStorageError, state.memories],
  );

  const replaceMemories = useCallback(
    (memories: Memory[], hadStoredDataOnLoad?: boolean) => {
      clearTimelineStorage();
      dispatch({ type: "REPLACE", memories, hadStoredDataOnLoad });
      void replaceMemoriesInDb(memories).catch(reportStorageError);
    },
    [reportStorageError],
  );

  const mergeMemories = useCallback(
    (memories: Memory[]) => {
      clearTimelineStorage();
      dispatch({ type: "MERGE", memories });
      void mergeMemoriesIntoDb(memories).catch(reportStorageError);
    },
    [reportStorageError],
  );

  const resetTimeline = useCallback(() => {
    clearTimelineStorage();
    void clearRecallDb().catch(reportStorageError);
    dispatch({ type: "RESET" });
  }, [reportStorageError]);

  const value = useMemo(
    () => ({
      ...state,
      startFresh,
      addMemory,
      updateMemory,
      deleteMemory,
      replaceMemories,
      mergeMemories,
      resetTimeline,
    }),
    [
      addMemory,
      deleteMemory,
      mergeMemories,
      replaceMemories,
      resetTimeline,
      startFresh,
      state,
      updateMemory,
    ],
  );

  return <MemoriesContext.Provider value={value}>{children}</MemoriesContext.Provider>;
}

export function useMemories() {
  const context = useContext(MemoriesContext);
  if (!context) {
    throw new Error("useMemories must be used inside MemoriesProvider");
  }

  return context;
}

function normalizeCollection(memories: Memory[]): Memory[] {
  return memories.map((memory) => ({ ...memory, images: normalizeImages(memory.images) }));
}
