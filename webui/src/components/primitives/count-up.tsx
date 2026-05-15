/**
 * <CountUp> — animates a numeric value from 0 to target using motion/react.
 * Respects prefers-reduced-motion (snaps to final value instantly).
 */
"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CountUpProps {
    value: number;
    /** Decimal places to show. Default 0. */
    decimals?: number;
    /** Duration in ms. Default 600. */
    duration?: number;
    /** Optional prefix (e.g. "$") */
    prefix?: string;
    /** Optional suffix (e.g. "%") */
    suffix?: string;
    className?: string;
}

export function CountUp({
    value,
    decimals = 0,
    duration = 600,
    prefix = "",
    suffix = "",
    className,
}: CountUpProps) {
    const [displayed, setDisplayed] = useState(0);
    const prevValueRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // Respect prefers-reduced-motion
        if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplayed(value);
            prevValueRef.current = value;
            return;
        }

        const start = prevValueRef.current;
        const end = value;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(start + (end - start) * eased);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                prevValueRef.current = end;
            }
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [value, duration]);

    const formatted =
        decimals > 0
            ? displayed.toFixed(decimals)
            : Math.round(displayed).toLocaleString();

    return (
        <span className={cn("tabular-nums font-technical", className)}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
