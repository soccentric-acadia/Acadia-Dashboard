/**
 * TypedValue helpers — the ONLY place in the UI that unwraps the {type, value} structure.
 * All chart builders, threshold editors, sort comparators, and table cells must call
 * these functions rather than inspecting TypedValue inline.
 */

import type { TypedValue, TestResult } from "@/lib/api/types";

// ── Type guards ───────────────────────────────────────────────────────────────

export function isNumeric(v: TypedValue): v is { type: "int" | "double"; value: number } {
    return v.type === "int" || v.type === "double";
}

export function isBool(v: TypedValue): v is { type: "bool"; value: boolean } {
    return v.type === "bool";
}

export function isString(v: TypedValue): v is { type: "string"; value: string } {
    return v.type === "string";
}

// ── Extraction ────────────────────────────────────────────────────────────────

/** Returns the numeric value, or null if the TypedValue is not int/double. */
export function toNumber(v: TypedValue): number | null {
    if (isNumeric(v)) return v.value;
    return null;
}

/**
 * Returns a display string for a TypedValue.
 * - bool: "true" / "false"
 * - string: the string itself
 * - int: integer string, optional unit suffix
 * - double: toPrecision(precision), optional unit suffix
 *
 * Values > Number.MAX_SAFE_INTEGER get a "~" prefix to indicate loss.
 */
export function toDisplayString(
    v: TypedValue,
    opts?: { precision?: number; unit?: string },
): string {
    if (v.type === "bool") return v.value ? "true" : "false";
    if (v.type === "string") return v.value;
    if (v.type === "int") {
        const approx = v.value > Number.MAX_SAFE_INTEGER ? "~" : "";
        const str = `${approx}${v.value.toString()}`;
        return opts?.unit ? `${str} ${opts.unit}` : str;
    }
    if (v.type === "double") {
        const prec = opts?.precision ?? 6;
        // Use toPrecision for significant-figure display; strip trailing zeros
        const str = parseFloat(v.value.toPrecision(prec)).toString();
        return opts?.unit ? `${str} ${opts.unit}` : str;
    }
    // Forwards-compat: unknown type variant
    return String((v as { value: unknown }).value ?? "");
}

/**
 * Compare two TypedValues.
 * Returns -1 / 0 / 1 for numeric pairs, null for incompatible or non-numeric types.
 * Used by TanStack Table sort comparators.
 */
export function compare(a: TypedValue, b: TypedValue): -1 | 0 | 1 | null {
    if (a.type !== b.type) return null;
    if (!isNumeric(a) || !isNumeric(b)) return null;
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
}

// ── Series extraction ─────────────────────────────────────────────────────────

/**
 * Extract a time-ordered numeric series from an array of TestResults.
 * Non-numeric TypedValues and missing keys are silently filtered out.
 * Used by chart builders — never call toNumber() inline in chart components.
 */
export function extractNumericSeries(
    results: TestResult[],
    source: "metrics" | "monitoring" | "event",
    key: string,
): { timestamp: string; sequence: number; value: number }[] {
    const out: { timestamp: string; sequence: number; value: number }[] = [];
    for (const r of results) {
        const map = r[source];
        if (!map || !(key in map)) continue;
        const v = map[key];
        const n = toNumber(v);
        if (n === null) continue;
        out.push({ timestamp: r.timestamp, sequence: r.sequence, value: n });
    }
    // Order by sequence (authoritative) then timestamp as tiebreaker
    out.sort((a, b) => a.sequence - b.sequence || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return out;
}

/**
 * Return all keys from the given map source that have at least one numeric value
 * across the provided results. Used to populate metric selectors in charts.
 */
export function numericKeys(
    results: TestResult[],
    source: "metrics" | "monitoring" | "event",
): string[] {
    const keys = new Set<string>();
    for (const r of results) {
        const map = r[source];
        if (!map) continue;
        for (const [k, v] of Object.entries(map)) {
            if (isNumeric(v)) keys.add(k);
        }
    }
    return Array.from(keys).sort();
}
