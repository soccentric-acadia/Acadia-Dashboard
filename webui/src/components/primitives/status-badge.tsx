/**
 * <StatusBadge> — canonical status + severity pill used everywhere a status is shown.
 *
 * Usage:
 *   <StatusBadge status="PASS" />
 *   <StatusBadge status="FAIL" severity="CRITICAL" />
 *   <StatusBadge status="RUNNING" size="sm" />
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusString, SeverityString } from "@/proto/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type { StatusString, SeverityString };

// ── Style maps ────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<StatusString, string> = {
    PASS: "bg-status-pass-bg text-status-pass-fg border-status-pass/30",
    FAIL: "bg-status-fail-bg text-status-fail-fg border-status-fail/30",
    ERROR: "bg-status-error-bg text-status-error-fg border-status-error/30",
    TIMEOUT: "bg-status-timeout-bg text-status-timeout-fg border-status-timeout/30",
    SKIPPED: "bg-status-skipped-bg text-status-skipped-fg border-status-skipped/30",
    ABORTED: "bg-status-aborted-bg text-status-aborted-fg border-status-aborted/30",
    RUNNING: "bg-status-running-bg text-status-running-fg border-status-running/30",
    NEVER: "bg-transparent text-muted-foreground border-muted-foreground/30",
    PARTIAL: "bg-muted text-muted-foreground border-border/40",
    UNSPECIFIED: "bg-muted text-muted-foreground border-border/40",
};

const SEVERITY_RING: Record<SeverityString, string> = {
    INFO: "",
    WARNING: "ring-1 ring-status-timeout/40",
    ERROR: "ring-1 ring-status-error/40",
    CRITICAL: "ring-2 ring-status-error/60",
    UNSPECIFIED: "",
};

const STATUS_DOT: Record<StatusString, string> = {
    PASS: "bg-status-pass",
    FAIL: "bg-status-fail",
    ERROR: "bg-status-error",
    TIMEOUT: "bg-status-timeout",
    SKIPPED: "bg-status-skipped",
    ABORTED: "bg-status-aborted",
    RUNNING: "bg-status-running animate-pulse-ring motion-reduce:animate-none",
    NEVER: "border border-muted-foreground/40 bg-transparent",
    PARTIAL: "bg-muted-foreground/40",
    UNSPECIFIED: "bg-muted-foreground/20",
};

const SIZE_CLASSES = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
};

const DOT_SIZE = {
    xs: "h-1.5 w-1.5",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
    status: StatusString;
    severity?: SeverityString;
    size?: keyof typeof SIZE_CLASSES;
    showDot?: boolean;
    showLabel?: boolean;
    label?: string;
    className?: string;
}

export function StatusBadge({
    status,
    severity,
    size = "md",
    showDot = true,
    showLabel = true,
    label,
    className,
}: StatusBadgeProps) {
    const displayLabel = label ?? status;
    const severityRing = severity ? SEVERITY_RING[severity] : "";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border font-medium font-technical uppercase tracking-wider transition-colors",
                SIZE_CLASSES[size],
                STATUS_CLASSES[status],
                severityRing,
                className,
            )}
            aria-label={`Status: ${displayLabel}${severity && severity !== "INFO" ? `, ${severity}` : ""}`}
        >
            {showDot && (
                <span
                    className={cn("rounded-full shrink-0", DOT_SIZE[size], STATUS_DOT[status])}
                    aria-hidden
                />
            )}
            {showLabel && <span>{displayLabel}</span>}
        </span>
    );
}
