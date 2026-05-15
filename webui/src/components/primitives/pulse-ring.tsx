/**
 * <PulseRing> — re-usable live indicator ring that wraps any child.
 * Draws a pulsing ring around its child when `active` is true.
 * Respects prefers-reduced-motion.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PulseRingProps {
    active?: boolean;
    /** Tailwind ring color class — e.g. "ring-status-running" */
    color?: string;
    className?: string;
    children: React.ReactNode;
}

export function PulseRing({ active = false, color = "ring-status-running/50", className, children }: PulseRingProps) {
    return (
        <span
            className={cn(
                "relative inline-flex",
                active && [
                    "ring-1 rounded-full",
                    color,
                    "animate-pulse-ring motion-reduce:animate-none",
                ],
                className,
            )}
        >
            {children}
        </span>
    );
}
