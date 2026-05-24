"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { Memory } from "@/lib/types";
import {
  clearTimelineStorage,
  readTimelineStorage,
  writeTimelineStorage,
} from "@/lib/storageUtils";
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
  const didHydrate = useRef(false);

  useEffect(() => {
    const result = readTimelineStorage();
    dispatch({
      type: "LOAD",
      memories: result.data?.memories ?? [],
      hadStoredDataOnLoad: result.existed && (result.data?.memories.length ?? 0) > 0,
    });
    didHydrate.current = true;
  }, []);

  useEffect(() => {
    if (!didHydrate.current || !state.loaded) {
      return;
    }

    const result = writeTimelineStorage(state.memories);
    if (!result.ok && result.quotaExceeded) {
      addToast({
        type: "warning",
        title: "Storage is getting tight",
        description:
          "You're running low on local storage. Export a ZIP backup and consider clearing old memories.",
      });
    }
  }, [addToast, state.loaded, state.memories]);

  useEffect(() => {
    if (!state.highlightedId) {
      return;
    }

    const timeout = window.setTimeout(() => dispatch({ type: "CLEAR_HIGHLIGHT" }), 2600);
    return () => window.clearTimeout(timeout);
  }, [state.highlightedId]);

  const startFresh = useCallback(() => dispatch({ type: "START_FRESH" }), []);
  const addMemory = useCallback((memory: Memory) => dispatch({ type: "ADD", memory }), []);
  const updateMemory = useCallback((memory: Memory) => dispatch({ type: "UPDATE", memory }), []);
  const deleteMemory = useCallback((id: string) => dispatch({ type: "DELETE", id }), []);
  const replaceMemories = useCallback(
    (memories: Memory[], hadStoredDataOnLoad?: boolean) =>
      dispatch({ type: "REPLACE", memories, hadStoredDataOnLoad }),
    [],
  );
  const mergeMemories = useCallback((memories: Memory[]) => dispatch({ type: "MERGE", memories }), []);
  const resetTimeline = useCallback(() => {
    clearTimelineStorage();
    dispatch({ type: "RESET" });
  }, []);

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
