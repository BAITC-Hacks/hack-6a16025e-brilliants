import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import LectureAI from "./App";
import "./styles.css";

// Last-resort safety net: an unexpected render error shows a message instead of a white screen.
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="max-w-md rounded-2xl border border-destructive/20 bg-destructive-soft p-6 text-center text-destructive shadow-subtle">
          <p className="font-semibold">Ошибка генерации, попробуйте еще раз</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Перезагрузить страницу
          </button>
        </div>
      </main>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LectureAI />
    </ErrorBoundary>
  </StrictMode>
);
