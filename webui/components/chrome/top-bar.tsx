"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";
import type { ExecutionMode } from "@/lib/types/api";
import { ConnectionIndicator } from "@/components/chrome/connection-indicator";
import { ModeSwitcher } from "@/components/chrome/mode-switcher";
import { StartStopButton } from "@/components/chrome/start-stop-button";
import { Separator } from "@/components/ui/separator";

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">Acadia IV&amp;V</span>
        <Separator orientation="vertical" className="h-5" />
        <ModeSwitcher mode={mode} onChange={setMode} disabled={isRunning} />
      </div>

      <div className="flex items-center gap-3">
        <StartStopButton isRunning={isRunning} elapsedLabel={elapsedLabel} onClick={onStartStop} />
        <Separator orientation="vertical" className="h-5" />
        <ConnectionIndicator online={!isError && data?.status === "ok"} />
      </div>
    </header>
  );
}
