/**
 * <BoardStrip> — 36px instrument cluster bar under the top bar.
 * Always visible on every shell page. Shows:
 *   Left:   large status dot + board ID (monospace)
 *   Center: vitals row (CPU temp, load, RAM, uptime, network)
 *   Right:  "now testing" mini-readout (visible only during active run)
 *
 * Polls board vitals at a steady interval (or consumes SSE when available).
 * Falls back gracefully when board is offline.
 */
"use client";

import * as React from "react";
import { useBoard } from "@/lib/board/context";
import { useRuns } from "@/lib/api/queries";
import { LiveDot } from "@/components/primitives/live-dot";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useConnectionStore } from "@/state/connection";
import { useSimStore, generateBoardVitals } from "@/data/sim/engine";
import { getProfile } from "@/data/sim/profiles";
import { usePreferencesStore } from "@/state/preferences";

function VitalBadge({
    label,
    value,
    unit,
    className,
}: {
    label: string;
    value: string | number | null | undefined;
    unit?: string;
    className?: string;
}) {
    if (value === null || value === undefined) return null;
    return (
        <span
            className={cn(
                "flex items-center gap-1 text-[10px] font-technical text-muted-foreground",
                className,
            )}
            title={label}
        >
            <span className="text-foreground/60 uppercase tracking-wider text-[9px]">{label}</span>
            <span className="text-foreground/85 font-medium">
                {value}{unit}
            </span>
        </span>
    );
}

function UptimeTicker({ since }: { since: string }) {
    const [elapsed, setElapsed] = React.useState("");

    React.useEffect(() => {
        const update = () => {
            const ms = Date.now() - new Date(since).getTime();
            const s = Math.floor(ms / 1000);
            const m = Math.floor(s / 60);
            const h = Math.floor(m / 60);
            const d = Math.floor(h / 24);
            if (d > 0) setElapsed(`${d}d ${h % 24}h`);
            else if (h > 0) setElapsed(`${h}h ${m % 60}m`);
            else if (m > 0) setElapsed(`${m}m ${s % 60}s`);
            else setElapsed(`${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [since]);

    return <span className="font-technical text-foreground/85 font-medium">{elapsed}</span>;
}

export function BoardStrip() {
    const { board } = useBoard();
    const { data: activeRunsData } = useRuns({ status: "running", limit: 1 });
    const activeRun = activeRunsData?.runs?.[0] ?? null;
    const connectionState = useConnectionStore((s) => s.state);
    const simProfile = usePreferencesStore((s) => s.simProfile);
    const simActiveRunId = useSimStore((s) => s.activeRunId);
    const simRuns = useSimStore((s) => s.runs);
    const simActiveRun = simRuns.find((r) => r.id === simActiveRunId) ?? null;

    const isSimMode = connectionState === "simulated";
    const online = board?.status === "online";

    // Simulated vitals — regenerated periodically
    const [simVitals, setSimVitals] = React.useState(() =>
        generateBoardVitals(getProfile(simProfile))
    );
    React.useEffect(() => {
        if (!isSimMode) return;
        const update = () => setSimVitals(generateBoardVitals(getProfile(simProfile)));
        const id = setInterval(update, 5_000);
        return () => clearInterval(id);
    }, [isSimMode, simProfile]);

    const displayActiveRun = isSimMode ? simActiveRun : activeRun;

    return (
        <div
            className={cn(
                "flex h-9 shrink-0 items-center justify-between gap-3 border-b px-4",
                isSimMode
                    ? "bg-[hsl(var(--status-simulated)/0.06)] backdrop-blur-sm border-[hsl(var(--status-simulated)/0.25)]"
                    : "bg-card/50 backdrop-blur-sm border-border/50",
            )}
            role="status"
            aria-label="Board status strip"
        >
            {/* ── Left: Board identity ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
                <LiveDot
                    state={isSimMode ? "simulated" : !board ? "disconnected" : online ? "idle" : "disconnected"}
                    size="md"
                />
                {isSimMode ? (
                    <span className="font-mono text-[11px] font-medium text-[hsl(var(--status-simulated))]">
                        SIM · {simProfile}
                    </span>
                ) : board ? (
                    <Link
                        href="/settings?tab=board"
                        className="font-mono text-[11px] font-medium text-foreground/80 hover:text-foreground transition-colors"
                        title="Open board settings"
                    >
                        {board.id}
                    </Link>
                ) : (
                    <span className="font-mono text-[11px] text-muted-foreground">Disconnected</span>
                )}
            </div>

            {/* ── Center: Vitals row ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
                {isSimMode ? (
                    <>
                        <VitalBadge label="CPU" value={`${simVitals.cpuTempCelsius}°C`} />
                        <Separator orientation="vertical" className="h-3.5" />
                        <VitalBadge label="LOAD" value={`${simVitals.cpuLoadPct}%`} />
                        <Separator orientation="vertical" className="h-3.5" />
                        <VitalBadge label="RAM" value={`${(simVitals.ramUsedMb / 1024).toFixed(1)} GB`} />
                        <Separator orientation="vertical" className="h-3.5" />
                        <VitalBadge label="NET" value={simVitals.networkState === "up" ? "UP" : "DOWN"} />
                    </>
                ) : board && online ? (
                    <>
                        {board.os_version && (
                            <VitalBadge label="OS" value={board.os_version} />
                        )}
                        {board.hal_version && (
                            <>
                                <Separator orientation="vertical" className="h-3.5" />
                                <VitalBadge label="HAL" value={board.hal_version} />
                            </>
                        )}
                        {board.client_version && (
                            <>
                                <Separator orientation="vertical" className="h-3.5" />
                                <VitalBadge label="CLI" value={board.client_version} />
                            </>
                        )}
                        {board.last_seen && (
                            <>
                                <Separator orientation="vertical" className="h-3.5" />
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <span className="uppercase tracking-wider text-[9px]">UP</span>
                                    <UptimeTicker since={board.first_seen} />
                                </span>
                            </>
                        )}
                    </>
                ) : !board ? (
                    <span className="text-[10px] text-muted-foreground italic">No board connected</span>
                ) : (
                    <span className="text-[10px] text-muted-foreground italic">Board offline</span>
                )}
            </div>

            {/* ── Right: Active run mini-readout ─────────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
                {displayActiveRun ? (
                    <Link
                        href={`/runs/${displayActiveRun.id}`}
                        className="flex items-center gap-1.5 text-[10px] text-status-running-fg hover:text-status-running transition-colors"
                    >
                        <LiveDot state="running" size="xs" />
                        <span className="font-medium truncate max-w-[12rem]">
                            {displayActiveRun.name || displayActiveRun.id.slice(0, 12)}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                            · {displayActiveRun.mode?.replace("_", " ")}
                        </span>
                    </Link>
                ) : (
                    <span className="text-[10px] text-muted-foreground/50">Idle</span>
                )}
            </div>
        </div>
    );
}
