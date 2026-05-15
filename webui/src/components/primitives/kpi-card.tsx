/**
 * <KpiCard> — dense KPI card used in the dashboard top row.
 * Shows: title, large animated value, optional delta, optional sparkline,
 * optional icon, and optional action button.
 */
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/primitives/count-up";
import { Sparkline } from "@/components/primitives/sparkline";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
    title: string;
    value: number | string;
    /** Numeric value used for CountUp animation — if omitted, value rendered as string */
    numericValue?: number;
    /** e.g. "+3.2%" or "-1%" */
    delta?: string;
    /** positive = good (green), negative = bad (red), neutral = muted */
    deltaDirection?: "positive" | "negative" | "neutral";
    sparklineData?: number[];
    sparklineColor?: string;
    icon?: React.ReactNode;
    /** Decimal places for CountUp */
    decimals?: number;
    suffix?: string;
    prefix?: string;
    /** Optional action rendered at bottom-right */
    action?: React.ReactNode;
    className?: string;
    /** Compact variant — smaller padding */
    compact?: boolean;
}

export function KpiCard({
    title,
    value,
    numericValue,
    delta,
    deltaDirection = "neutral",
    sparklineData,
    sparklineColor,
    icon,
    decimals = 0,
    suffix = "",
    prefix = "",
    action,
    className,
    compact = false,
}: KpiCardProps) {
    const DeltaIcon =
        deltaDirection === "positive" ? TrendingUp :
            deltaDirection === "negative" ? TrendingDown :
                Minus;

    const deltaColor =
        deltaDirection === "positive" ? "text-status-pass" :
            deltaDirection === "negative" ? "text-status-fail" :
                "text-muted-foreground";

    return (
        <Card
            className={cn(
                "instrument-tile transition-shadow hover:shadow-instrument-active group",
                compact ? "p-3" : "p-4",
                className,
            )}
        >
            <CardContent className={cn("p-0 flex flex-col gap-2", compact ? "gap-1.5" : "gap-2")}>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                        {title}
                    </span>
                    {icon && (
                        <span className="text-muted-foreground/60 shrink-0">
                            {icon}
                        </span>
                    )}
                </div>

                {/* Value row */}
                <div className="flex items-end justify-between gap-2">
                    <div className="flex items-baseline gap-1 min-w-0">
                        {numericValue !== undefined ? (
                            <CountUp
                                value={numericValue}
                                decimals={decimals}
                                prefix={prefix}
                                suffix={suffix}
                                className={cn(
                                    "font-bold font-technical",
                                    compact ? "text-xl" : "text-2xl",
                                )}
                            />
                        ) : (
                            <span
                                className={cn(
                                    "font-bold font-technical tabular-nums",
                                    compact ? "text-xl" : "text-2xl",
                                )}
                            >
                                {prefix}{String(value)}{suffix}
                            </span>
                        )}
                    </div>

                    {sparklineData && sparklineData.length > 1 && (
                        <Sparkline
                            data={sparklineData}
                            width={56}
                            height={20}
                            color={sparklineColor ?? "hsl(var(--primary))"}
                            fill
                            className="opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                    )}
                </div>

                {/* Footer row */}
                {(delta || action) && (
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        {delta && (
                            <span className={cn("flex items-center gap-1 text-xs font-medium", deltaColor)}>
                                <DeltaIcon className="h-3 w-3" aria-hidden="true" />
                                {delta}
                            </span>
                        )}
                        {action && (
                            <span className="ml-auto">
                                {action}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
