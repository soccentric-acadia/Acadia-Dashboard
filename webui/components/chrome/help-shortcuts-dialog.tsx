"use client";

import { useEffect } from "react";

const SHORTCUTS = [
  { key: "Space", description: "Start/Stop current test" },
  { key: "1 2 3 4", description: "Switch One-shot/Monitoring/Event/Long-run" },
  { key: "Ctrl+K or Cmd+K", description: "Focus module search" },
  { key: "[ / ]", description: "Collapse / expand sidebar" },
  { key: "?", description: "Open this help" },
];

export function HelpShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">Keyboard shortcuts</h2>
        <p className="mb-4 text-sm text-muted-foreground">Quick actions from anywhere in the console.</p>
        <ul className="space-y-1.5">
          {SHORTCUTS.map((item) => (
            <li key={item.key} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-foreground">{item.description}</span>
              <kbd className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">{item.key}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
