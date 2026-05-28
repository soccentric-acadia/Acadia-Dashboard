"use client";

import clsx from "clsx";

export function StartStopButton({
  isRunning,
  elapsedLabel,
  disabled,
  onClick,
}: {
  isRunning: boolean;
  elapsedLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
        isRunning
          ? "bg-rose-600 text-white hover:bg-rose-500"
          : "bg-emerald-600 text-white hover:bg-emerald-500",
      )}
    >
      <span>{isRunning ? "Stop" : "Start"}</span>
      {isRunning && (
        <>
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>Running · {elapsedLabel}</span>
        </>
      )}
    </button>
  );
}
