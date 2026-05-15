import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

/**
 * Format a duration expressed in nanoseconds for human display.
 * Handles the int64 precision caveat: values > Number.MAX_SAFE_INTEGER are
 * marked with a "~" prefix to indicate potential display loss.
 */
export function formatDurationNs(ns: number): string {
    if (!Number.isFinite(ns) || ns < 0) return "—";
    const approx = ns > Number.MAX_SAFE_INTEGER ? "~" : "";
    if (ns < 1_000) return `${approx}${ns}ns`;
    if (ns < 1_000_000) return `${approx}${(ns / 1_000).toFixed(1)}µs`;
    if (ns < 1_000_000_000) return `${approx}${(ns / 1_000_000).toFixed(1)}ms`;
    const s = ns / 1_000_000_000;
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${approx}${h}h ${m % 60}m ${(s % 60).toFixed(0)}s`;
    if (m > 0) return `${approx}${m}m ${(s % 60).toFixed(1)}s`;
    return `${approx}${s.toFixed(3)}s`;
}

export function getModuleLabel(moduleId: string | undefined | null): string {
    if (!moduleId) return "";
    return moduleId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}