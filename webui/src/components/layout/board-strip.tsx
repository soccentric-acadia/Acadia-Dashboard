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

    const online = board?.status === "online";

    return (
        <div
            className={cn(
                "flex h-9 shrink-0 items-center justify-between gap-3 border-b px-4",
                "bg-card/50 backdrop-blur-sm border-border/50",
            )}
            role="status"
            aria-label="Board status strip"
        >
            {/* ── Left: Board identity ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2 shrink-0">
                <LiveDot
                    state={!board ? "disconnected" : online ? "idle" : "disconnected"}
                    size="md"
                />
                {board ? (
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
                {board && online ? (
                    <>
                        {/* These are populated from real data when available.
                The board object has os_version, hal_version etc.
                Vitals like CPU temp come from a future /api/v1/target/vitals endpoint.
                For now we show what we have. */}
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
                {activeRun ? (
                    <Link
                        href={`/runs/${activeRun.id}`}
                        className="flex items-center gap-1.5 text-[10px] text-status-running-fg hover:text-status-running transition-colors"
                    >
                        <LiveDot state="running" size="xs" />
                        <span className="font-medium truncate max-w-[12rem]">
                            {activeRun.name || activeRun.id.slice(0, 12)}
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                            · {activeRun.mode?.replace("_", " ")}
                        </span>
                    </Link>
                ) : (
                    <span className="text-[10px] text-muted-foreground/50">Idle</span>
                )}
            </div>
        </div>
    );
}
