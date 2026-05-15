/**
 * <LiveDot> — single canonical live-state indicator dot.
 * Used in sidebar rows, dashboard tiles, top bar, board strip.
 * Color and animation are driven by the dot's `state` prop.
 * `prefers-reduced-motion` disables the pulse animation.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LiveDotState =
    | "idle"
    | "running"
    | "pass"
    | "fail"
    | "error"
    | "timeout"
    | "skipped"
    | "aborted"
    | "never"
    | "disconnected";

const STATE_STYLES: Record<LiveDotState, { dot: string; pulse?: boolean; ring?: string }> = {
    idle: { dot: "bg-muted-foreground/50" },
    running: { dot: "bg-status-running", pulse: true, ring: "border-status-running/40" },
    pass: { dot: "bg-status-pass" },
    fail: { dot: "bg-status-fail", ring: "border-status-fail/40" },
    error: { dot: "bg-status-error", ring: "border-status-error/40" },
    timeout: { dot: "bg-status-timeout" },
    skipped: { dot: "bg-status-skipped/60" },
    aborted: { dot: "bg-status-aborted" },
    never: { dot: "border-2 border-muted-foreground/30 bg-transparent" },
    disconnected: { dot: "bg-muted-foreground/20 border border-muted-foreground/30" },
};

const SIZE_CLASSES = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3.5 w-3.5",
};

export interface LiveDotProps {
    state: LiveDotState;
    size?: keyof typeof SIZE_CLASSES;
    className?: string;
    "aria-label"?: string;
}

export function LiveDot({ state, size = "sm", className, "aria-label": ariaLabel }: LiveDotProps) {
    const { dot, pulse, ring } = STATE_STYLES[state] ?? STATE_STYLES.idle;
    const sizeClass = SIZE_CLASSES[size];

    return (
        <span
            role="img"
            aria-label={ariaLabel ?? `Status: ${state}`}
            className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
        >
            {/* Outer pulse ring — only for running state, disabled by prefers-reduced-motion via CSS */}
            {pulse && ring && (
                <span
                    className={cn(
                        "absolute rounded-full border animate-pulse-ring motion-reduce:animate-none",
                        sizeClass,
                        "scale-150 opacity-0",
                        ring,
                    )}
                    aria-hidden="true"
                />
            )}
            <span
                className={cn("rounded-full shrink-0", sizeClass, dot)}
                aria-hidden="true"
            />
        </span>
    );
}
