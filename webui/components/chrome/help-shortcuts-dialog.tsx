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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/20 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold">Keyboard shortcuts</h2>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((item) => (
            <li key={item.key} className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
              <span>{item.description}</span>
              <span className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700">{item.key}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
