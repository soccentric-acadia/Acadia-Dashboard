"use client";

import { useBoard } from "@/lib/board/context";
import { useHealth } from "@/lib/api/queries";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Circle, Cpu, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import Link from "next/link";
import { useRuns } from "@/lib/api/queries";
import { useState, useEffect } from "react";

function BoardStatus({ online }: { online: boolean }) {
    return (
        <span className={cn("flex items-center gap-1.5 text-xs", online ? "text-green-500" : "text-red-500")}>
            <Circle className={cn("h-2 w-2 fill-current", online ? "animate-pulse" : "")} />
            {online ? "Online" : "Offline"}
        </span>
    );
}

function ActivityBadge({ clientId }: { clientId: string }) {
    const { data } = useRuns({ clientId, state: "running", limit: 1 });
    const active = data?.edges?.[0]?.node;
    if (!active) return null;
    return (
        <span className="flex items-center gap-1.5 text-xs text-blue-500">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            Running: <Link href={`/runs/${active.runId}`} className="hover:underline font-medium truncate max-w-[12rem]">{active.moduleId}</Link>
        </span>
    );
}

export function BoardHeader() {
    const { board } = useBoard();
    const { data: health } = useHealth();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const serverReachable = Boolean(health);
    const boardOnline = board?.isConnected ?? false;

    const cycleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };
    // Use Monitor as placeholder before mount to avoid hydration mismatch
    const ThemeIcon = !mounted ? Monitor : (theme === "dark" ? Moon : theme === "light" ? Sun : Monitor);

    if (!board) {
        return (
            <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    <span>No board configured</span>
                    <Link href="/settings" className="text-primary text-xs hover:underline ml-2">
                        → Add board
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
                        <ThemeIcon className="h-4 w-4" />
                    </Button>
                    <UserMenu />
                </div>
            </header>
        );
    }

    return (
        <header
            className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0 cursor-pointer hover:bg-accent/30 transition-colors"
            onClick={() => { window.location.href = "/settings"; }}
            role="banner"
            title="Click to open Settings"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-sm truncate">{board.hostname ?? board.clientId}</span>
                    <BoardStatus online={boardOnline} />
                </div>

                <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                    {board.halVersion && <span>HAL {board.halVersion}</span>}
                    {board.clientVersion && <span>Client {board.clientVersion}</span>}
                    {!serverReachable && (
                        <span className="text-yellow-500">Server unreachable</span>
                    )}
                </div>

                {board.clientId && <ActivityBadge clientId={board.clientId} />}
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
                    <ThemeIcon className="h-4 w-4" />
                </Button>
                <UserMenu />
            </div>
        </header>
    );
}
