/**
 * Status and Severity helpers.
 * All status-aware logic (colors, predicates, ordering) lives here.
 * Components never compare Status as raw strings — always use these helpers.
 */

import type { Status, Severity } from "@/lib/api/types";

// ── Ordering ──────────────────────────────────────────────────────────────────

/** Canonical display order for status filter chips and legend. */
export const STATUS_ORDER: Status[] = [
    "PASS",
    "FAIL",
    "ERROR",
    "TIMEOUT",
    "SKIPPED",
    "ABORTED",
];

export const SEVERITY_ORDER: Severity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];

// ── Predicates ────────────────────────────────────────────────────────────────

/** True for statuses that represent a test outcome worth alerting on. */
export function isFailureStatus(s: Status): boolean {
    return s === "FAIL" || s === "ERROR" || s === "TIMEOUT";
}

/** True when the run was cancelled by the user before the test completed. */
export function isUserCancelled(s: Status): boolean {
    return s === "ABORTED";
}

/** True when the test was intentionally skipped (no measurement taken). */
export function isNoOp(s: Status): boolean {
    return s === "SKIPPED";
}

/**
 * All statuses in this enum are terminal (no in-flight state).
 * Kept for forwards-compatibility: if the server ever emits an in-flight
 * status (e.g. "RUNNING") this predicate can be updated.
 */
export function isTerminal(_s: Status): boolean {
    return true;
}

// ── Color tokens ──────────────────────────────────────────────────────────────

export interface StatusColors {
    fg: string;
    bg: string;
    ring: string;
    /** Tailwind badge variant for <Badge variant={…}> */
    badgeVariant: "success" | "destructive" | "warning" | "skipped" | "aborted" | "timeout" | "unknown";
}

/**
 * Returns Tailwind class groups for a given Status / Severity combination.
 * Color tokens come from the shadcn theme; hex literals are not used.
 *
 * Severity modulation:
 *   CRITICAL — adds a heavier ring
 *   WARNING  — lighter tint (no change to fg/bg; ring downgraded)
 *   INFO     — no modification (default)
 *   ERROR    — severity ERROR on a PASS/SKIPPED result is unusual but rendered without change
 */
export function statusColor(s: Status, severity?: Severity): StatusColors {
    const base: Record<Status, StatusColors> = {
        PASS: {
            fg: "text-green-800 dark:text-green-200",
            bg: "bg-green-100 dark:bg-green-900",
            ring: "ring-1 ring-green-400 dark:ring-green-700",
            badgeVariant: "success",
        },
        FAIL: {
            fg: "text-red-800 dark:text-red-200",
            bg: "bg-red-100 dark:bg-red-900",
            ring: "ring-1 ring-red-400 dark:ring-red-700",
            badgeVariant: "destructive",
        },
        ERROR: {
            fg: "text-red-900 dark:text-red-100",
            bg: "bg-red-200 dark:bg-red-950",
            ring: "ring-1 ring-red-600 dark:ring-red-800",
            badgeVariant: "destructive",
        },
        TIMEOUT: {
            fg: "text-amber-800 dark:text-amber-200",
            bg: "bg-amber-100 dark:bg-amber-900",
            ring: "ring-1 ring-amber-400 dark:ring-amber-700",
            badgeVariant: "timeout",
        },
        SKIPPED: {
            fg: "text-muted-foreground",
            bg: "bg-muted",
            ring: "ring-1 ring-border",
            badgeVariant: "skipped",
        },
        ABORTED: {
            fg: "text-purple-800 dark:text-purple-200",
            bg: "bg-purple-100 dark:bg-purple-900",
            ring: "ring-1 ring-purple-400 dark:ring-purple-700",
            badgeVariant: "aborted",
        },
    };

    const colors = base[s];
    if (!colors) {
        return {
            fg: "text-gray-700 dark:text-gray-300",
            bg: "bg-gray-100 dark:bg-gray-800",
            ring: "ring-1 ring-gray-300 dark:ring-gray-600",
            badgeVariant: "unknown",
        };
    }

    // Severity modulation — heavier ring for CRITICAL
    if (severity === "CRITICAL") {
        return {
            ...colors,
            ring: colors.ring.replace("ring-1", "ring-2"),
        };
    }

    return colors;
}

// ── Severity ──────────────────────────────────────────────────────────────────

/** Numeric rank: INFO=0, WARNING=1, ERROR=2, CRITICAL=3. */
export function severityRank(s: Severity): number {
    const ranks: Record<Severity, number> = {
        INFO: 0,
        WARNING: 1,
        ERROR: 2,
        CRITICAL: 3,
    };
    return ranks[s] ?? 0;
}

/** Returns a Tailwind class to tint text based on severity (for secondary display). */
export function severityTextClass(s: Severity): string {
    switch (s) {
        case "CRITICAL": return "text-red-600 dark:text-red-400 font-semibold";
        case "ERROR": return "text-red-500 dark:text-red-400";
        case "WARNING": return "text-amber-600 dark:text-amber-400";
        case "INFO": return "text-muted-foreground";
    }
}

/**
 * Whether this severity warrants a visible severity badge.
 * INFO is the default and suppressed to reduce visual noise.
 */
export function shouldShowSeverity(s: Severity): boolean {
    return s !== "INFO";
}
