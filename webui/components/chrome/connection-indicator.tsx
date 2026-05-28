"use client";

import clsx from "clsx";

export function ConnectionIndicator({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          online ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-500",
        )}
      />
      {online ? "Online" : "Offline"}
    </div>
  );
}
