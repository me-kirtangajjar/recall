"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { ToastViewport, type ToastMessage } from "@/components/ui/Toast";
import { createId } from "@/lib/utils";

interface UIState {
  toasts: ToastMessage[];
}

type UIAction =
  | { type: "ADD_TOAST"; toast: ToastMessage }
  | { type: "REMOVE_TOAST"; id: string };

interface UIContextValue {
  addToast: (message: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

function reducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    default:
      return state;
  }
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  const removeToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE_TOAST", id });
  }, []);

  const addToast = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = createId();
    dispatch({ type: "ADD_TOAST", toast: { ...message, id } });
    window.setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <ToastViewport toasts={state.toasts} onDismiss={removeToast} />
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }

  return context;
}
