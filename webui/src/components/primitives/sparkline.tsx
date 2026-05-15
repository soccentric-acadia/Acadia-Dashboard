/**
 * <Sparkline> — tiny SVG inline trend chart.
 * Used in sidebar module rows, dashboard tiles, and KPI cards.
 * Pure SVG, no Recharts — keeps the bundle tiny for this use case.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SparklineProps {
    data: number[];
    /** Width in px — defaults to 56 */
    width?: number;
    /** Height in px — defaults to 20 */
    height?: number;
    /** Stroke color as a Tailwind-compatible CSS value or CSS variable */
    color?: string;
    /** Whether to fill below the line */
    fill?: boolean;
    className?: string;
    "aria-label"?: string;
}

export function Sparkline({
    data,
    width = 56,
    height = 20,
    color = "hsl(var(--primary))",
    fill = false,
    className,
    "aria-label": ariaLabel,
}: SparklineProps) {
    if (!data || data.length < 2) {
        return (
            <svg
                width={width}
                height={height}
                className={cn("shrink-0", className)}
                aria-hidden={!ariaLabel}
                aria-label={ariaLabel}
            >
                <line
                    x1={0}
                    y1={height / 2}
                    x2={width}
                    y2={height / 2}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                />
            </svg>
        );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
        const y = height - pad - ((v - min) / range) * (height - pad * 2);
        return [x, y] as [number, number];
    });

    const linePath = points
        .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
        .join(" ");

    const fillPath = fill
        ? `${linePath} L${(points[points.length - 1][0]).toFixed(1)},${height - pad} L${pad},${height - pad} Z`
        : null;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={cn("shrink-0 overflow-visible", className)}
            aria-hidden={!ariaLabel}
            aria-label={ariaLabel}
        >
            {fillPath && (
                <path
                    d={fillPath}
                    fill={color}
                    fillOpacity={0.12}
                />
            )}
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Last value dot */}
            <circle
                cx={points[points.length - 1][0]}
                cy={points[points.length - 1][1]}
                r={2}
                fill={color}
            />
        </svg>
    );
}
