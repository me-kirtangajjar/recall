"use client";

import type { ReactNode } from "react";
import { UIProvider } from "@/context/UIContext";
import { MemoriesProvider } from "@/context/MemoriesContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <MemoriesProvider>{children}</MemoriesProvider>
    </UIProvider>
  );
}
