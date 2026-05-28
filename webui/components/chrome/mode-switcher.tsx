"use client";

import clsx from "clsx";
import type { ExecutionMode } from "@/lib/types/api";

const MODES: Array<{ key: ExecutionMode; label: string }> = [
  { key: "single_shot", label: "One-shot" },
  { key: "monitoring", label: "Monitoring" },
  { key: "event", label: "Event" },
  { key: "long_run", label: "Long-run" },
];

export function ModeSwitcher({
  mode,
  disabled,
  onChange,
}: {
  mode: ExecutionMode;
  disabled: boolean;
  onChange: (mode: ExecutionMode) => void;
}) {
  return (
    <div className="relative inline-flex rounded-full border border-white/40 bg-white/50 p-1 backdrop-blur-lg dark:border-white/10 dark:bg-zinc-900/40">
      <div
        className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-zinc-700"
        style={{
          width: `calc(${100 / MODES.length}% - 4px)`,
          left: `calc(${(MODES.findIndex((item) => item.key === mode) * 100) / MODES.length}% + 2px)`,
        }}
      />
      {MODES.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(item.key)}
          className={clsx(
            "relative z-10 rounded-full px-3 py-1.5 text-sm font-medium transition-transform active:scale-95",
            item.key === mode ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
