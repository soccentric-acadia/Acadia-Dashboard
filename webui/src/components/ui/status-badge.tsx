/**
 * <StatusBadge> — the single canonical component for rendering TestResult statuses.
 *
 * Every page uses this component. No hand-rolled status pills anywhere else.
 * Unknown statuses from the server render visibly as "UNKNOWN" with a tooltip
 * rather than crashing or silently coercing.
 */
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { statusColor, shouldShowSeverity } from "@/lib/status";
import type { Status, Severity } from "@/lib/api/types";

const KNOWN_STATUSES = new Set<string>([
    "PASS", "FAIL", "ERROR", "TIMEOUT", "SKIPPED", "ABORTED",
]);

export interface StatusBadgeProps {
    status: string;
    severity?: Severity;
    className?: string;
    /** When true, show severity as a sub-label if non-INFO. Default false. */
    showSeverity?: boolean;
}

export function StatusBadge({
    status,
    severity,
    className,
    showSeverity = false,
}: StatusBadgeProps) {
    const isKnown = KNOWN_STATUSES.has(status);
    const safeStatus = isKnown ? (status as Status) : ("UNKNOWN" as Status);

    const { badgeVariant } = isKnown
        ? statusColor(safeStatus, severity)
        : statusColor("ABORTED"); // fallback colors for unknown; variant overridden below

    const variant = isKnown ? badgeVariant : "unknown";

    const badge = (
        <Badge
            variant={variant as React.ComponentProps<typeof Badge>["variant"]}
            className={className}
            role="status"
            aria-label={`Status: ${status}${severity && shouldShowSeverity(severity) ? `, Severity: ${severity}` : ""}`}
        >
            {isKnown ? status : `UNKNOWN (${status})`}
            {showSeverity && severity && shouldShowSeverity(severity) && (
                <span className="ml-1 opacity-80 font-normal">· {severity}</span>
            )}
        </Badge>
    );

    if (!isKnown) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{badge}</TooltipTrigger>
                    <TooltipContent>
                        Server returned a status this UI version doesn&apos;t recognise: &quot;{status}&quot;
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return badge;
}

/** Small severity chip — shown beside the status badge when severity is non-INFO. */
export function SeverityChip({ severity, className }: { severity: Severity; className?: string }) {
    if (!shouldShowSeverity(severity)) return null;
    const variantMap: Record<Severity, React.ComponentProps<typeof Badge>["variant"]> = {
        INFO: "secondary",
        WARNING: "warning",
        ERROR: "destructive",
        CRITICAL: "destructive",
    };
    return (
        <Badge
            variant={variantMap[severity] ?? "secondary"}
            className={className}
            aria-label={`Severity: ${severity}`}
        >
            {severity}
        </Badge>
    );
}
