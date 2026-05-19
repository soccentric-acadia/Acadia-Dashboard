/**
 * <ConnectionPill> — top-bar connection state indicator.
 *
 * States: live | reconnecting | offline | simulated
 *
 * Displays as a pill with an animated dot and label.
 * Right-click or click opens a menu to switch between Live ⇄ Simulated.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wifi, WifiOff, RefreshCw, FlaskConical } from "lucide-react";

export type ConnectionState = "live" | "reconnecting" | "offline" | "simulated";

const STATE_CONFIG: Record<
    ConnectionState,
    {
        label: string;
        icon: React.ElementType;
        dot: string;
        pill: string;
        pulse?: boolean;
    }
> = {
    live: {
        label: "Live",
        icon: Wifi,
        dot: "bg-status-running animate-pulse-ring motion-reduce:animate-none",
        pill: "bg-status-running-bg border-status-running/30 text-status-running-fg",
        pulse: true,
    },
    reconnecting: {
        label: "Reconnecting",
        icon: RefreshCw,
        dot: "bg-status-timeout",
        pill: "bg-status-timeout-bg border-status-timeout/30 text-status-timeout-fg",
    },
    offline: {
        label: "Offline",
        icon: WifiOff,
        dot: "bg-status-disconnected/50",
        pill: "bg-secondary border-border text-muted-foreground",
    },
    simulated: {
        label: "Simulated",
        icon: FlaskConical,
        dot: "bg-status-simulated animate-pulse-ring motion-reduce:animate-none",
        pill: "bg-status-simulated-bg border-status-simulated/30 text-status-simulated-fg",
        pulse: true,
    },
};

export interface ConnectionPillProps {
    state: ConnectionState;
    onSwitchToLive?: () => void;
    onSwitchToSimulated?: () => void;
    className?: string;
}

export function ConnectionPill({
    state,
    onSwitchToLive,
    onSwitchToSimulated,
    className,
}: ConnectionPillProps) {
    const cfg = STATE_CONFIG[state];
    const Icon = cfg.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        cfg.pill,
                        className,
                    )}
                    aria-label={`Connection state: ${cfg.label}. Click to change.`}
                >
                    {/* Animated dot */}
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} aria-hidden />
                    <span>{cfg.label}</span>
                    <Icon className="h-3 w-3 opacity-60" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                    Connection mode
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={onSwitchToLive}
                    disabled={state === "live"}
                    className="gap-2"
                >
                    <Wifi className="h-3.5 w-3.5 text-status-running" />
                    <span>Switch to Live</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={onSwitchToSimulated}
                    disabled={state === "simulated"}
                    className="gap-2"
                >
                    <FlaskConical className="h-3.5 w-3.5 text-status-simulated" />
                    <span>Switch to Simulated</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
