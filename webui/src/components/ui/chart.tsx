"use client"

import * as React from "react"
import {
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"

import { cn } from "@/lib/utils"

// Re-export recharts primitives for use in pages
export {
    CartesianGrid,
    Line,
    LineChart,
    Area,
    AreaChart,
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"

// ── Chart container ───────────────────────────────────────────────────────────

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    config?: Record<string, { label?: string; color?: string }>
    children: React.ReactNode
}

export function ChartContainer({
    className,
    config,
    children,
    ...props
}: ChartContainerProps) {
    return (
        <div
            className={cn("w-full", className)}
            style={
                config
                    ? (Object.fromEntries(
                        Object.entries(config).flatMap(([key, val]) =>
                            val.color ? [[`--color-${key}`, val.color]] : []
                        )
                    ) as React.CSSProperties)
                    : undefined
            }
            {...props}
        >
            <ResponsiveContainer width="100%" height="100%">
                {children as React.ReactElement}
            </ResponsiveContainer>
        </div>
    )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface ChartTooltipContentProps {
    active?: boolean
    payload?: Array<{ name: string; value: unknown; color?: string }>
    label?: string
    formatter?: (value: unknown, name: string) => React.ReactNode
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    labelFormatter?: (label: string) => React.ReactNode
}

export function ChartTooltipContent({
    active,
    payload,
    label,
    formatter,
    hideLabel,
    labelFormatter,
}: ChartTooltipContentProps) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
            {!hideLabel && (
                <p className="mb-1 font-medium text-foreground">
                    {labelFormatter ? labelFormatter(label ?? "") : label}
                </p>
            )}
            <div className="space-y-0.5">
                {payload.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {item.color && (
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ background: item.color }}
                            />
                        )}
                        <span className="text-muted-foreground">{item.name}:</span>
                        <span className="font-medium tabular-nums">
                            {formatter
                                ? formatter(item.value, item.name)
                                : String(item.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
    return (
        <Tooltip
            content={<ChartTooltipContent />}
            cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--border))" }}
            {...props}
        />
    )
}

// ── Legend ────────────────────────────────────────────────────────────────────

export function ChartLegend(props: React.ComponentProps<typeof Legend>) {
    return <Legend {...props} />
}

export function ChartLegendContent({
    payload,
}: {
    payload?: Array<{ value: string; color?: string }>
}) {
    if (!payload?.length) return null
    return (
        <div className="flex items-center gap-4 text-xs">
            {payload.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    {item.color && (
                        <span
                            className="h-2 w-2 rounded-sm"
                            style={{ background: item.color }}
                        />
                    )}
                    <span className="text-muted-foreground">{item.value}</span>
                </div>
            ))}
        </div>
    )
}
