"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-soft">
          <h2 className="font-serif text-3xl text-[var(--text)]">Something slipped out of place.</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Your memories are still private on this device. Refresh the page and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
