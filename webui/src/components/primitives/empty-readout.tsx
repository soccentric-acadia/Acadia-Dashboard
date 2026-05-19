/**
 * <EmptyReadout> — instrument-style empty state.
 *
 * Shows "—" in monospace. Never shows a CTA. Never gated by connectivity.
 * Used wherever a value is expected but none is available yet.
 *
 * Contrast with traditional "no data" empty states — this is an instrument
 * readout that simply shows its current (absent) value.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyReadoutProps {
    /** Optional label shown above the dash */
    label?: string;
    /** Optional unit shown after the dash */
    unit?: string;
    /** Size variant */
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    "aria-label"?: string;
}

const SIZE_CLASSES = {
    xs: { dash: "text-xs", label: "text-[9px]" },
    sm: { dash: "text-sm", label: "text-[10px]" },
    md: { dash: "text-base", label: "text-xs" },
    lg: { dash: "text-xl", label: "text-xs" },
};

export function EmptyReadout({
    label,
    unit,
    size = "sm",
    className,
    "aria-label": ariaLabel,
}: EmptyReadoutProps) {
    const { dash, label: labelClass } = SIZE_CLASSES[size];

    return (
        <span
            className={cn("inline-flex flex-col items-start", className)}
            aria-label={ariaLabel ?? (label ? `${label}: no data` : "no data")}
        >
            {label && (
                <span className={cn("uppercase tracking-wider text-muted-foreground/60", labelClass)}>
                    {label}
                </span>
            )}
            <span className={cn("font-technical text-muted-foreground/40", dash)} aria-hidden>
                —{unit && <span className="ml-0.5 opacity-60 text-[0.8em]">{unit}</span>}
            </span>
        </span>
    );
}
