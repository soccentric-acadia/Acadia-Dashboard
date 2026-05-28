"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";
import type { ExecutionMode } from "@/lib/types/api";
import { ConnectionIndicator } from "@/components/chrome/connection-indicator";
import { ModeSwitcher } from "@/components/chrome/mode-switcher";
import { StartStopButton } from "@/components/chrome/start-stop-button";

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function TopBar({
  mode,
  setMode,
  isRunning,
  runningSince,
  onStartStop,
}: {
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  isRunning: boolean;
  runningSince: number | null;
  onStartStop: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!runningSince) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningSince]);

  const elapsedLabel = runningSince ? formatElapsed((now - runningSince) / 1000) : "00:00";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/35 bg-white/55 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/45">
      <div className="flex items-center gap-4">
        <div className="font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">Acadia IV&V</div>
        <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-600" />
        <ModeSwitcher mode={mode} onChange={setMode} disabled={isRunning} />
      </div>

      <div className="flex items-center gap-4">
        <StartStopButton isRunning={isRunning} elapsedLabel={elapsedLabel} onClick={onStartStop} />
        <ConnectionIndicator online={!isError && data?.status === "ok"} />
      </div>
    </header>
  );
}
