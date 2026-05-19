/**
 * Unit tests for src/lib/value/typed.ts helpers.
 * No React needed — pure TS functions.
 */
import { describe, it, expect } from "vitest";
import {
    isNumeric,
    isBool,
    isString,
    toNumber,
    toDisplayString,
    compare,
    extractNumericSeries,
    numericKeys,
} from "@/lib/value/typed";
import type { TypedValue, TestResult } from "@/lib/api/types";

// ── Type guard tests ──────────────────────────────────────────────────────────

describe("isNumeric", () => {
    it("returns true for int type", () => {
        expect(isNumeric({ type: "int", value: 42 })).toBe(true);
    });
    it("returns true for double type", () => {
        expect(isNumeric({ type: "double", value: 3.14 })).toBe(true);
    });
    it("returns false for bool type", () => {
        expect(isNumeric({ type: "bool", value: true })).toBe(false);
    });
    it("returns false for string type", () => {
        expect(isNumeric({ type: "string", value: "hello" })).toBe(false);
    });
});

describe("isBool", () => {
    it("returns true for bool type", () => {
        expect(isBool({ type: "bool", value: false })).toBe(true);
    });
    it("returns false for int type", () => {
        expect(isBool({ type: "int", value: 0 })).toBe(false);
    });
});

describe("isString", () => {
    it("returns true for string type", () => {
        expect(isString({ type: "string", value: "x" })).toBe(true);
    });
    it("returns false for double type", () => {
        expect(isString({ type: "double", value: 1.0 })).toBe(false);
    });
});

// ── toNumber ──────────────────────────────────────────────────────────────────

describe("toNumber", () => {
    it("returns the value for int", () => {
        expect(toNumber({ type: "int", value: 99 })).toBe(99);
    });
    it("returns the value for double", () => {
        expect(toNumber({ type: "double", value: 1.5 })).toBeCloseTo(1.5);
    });
    it("returns null for bool", () => {
        expect(toNumber({ type: "bool", value: true })).toBeNull();
    });
    it("returns null for string", () => {
        expect(toNumber({ type: "string", value: "42" })).toBeNull();
    });
});

// ── toDisplayString ───────────────────────────────────────────────────────────

describe("toDisplayString", () => {
    it("renders bool true", () => {
        expect(toDisplayString({ type: "bool", value: true })).toBe("true");
    });
    it("renders bool false", () => {
        expect(toDisplayString({ type: "bool", value: false })).toBe("false");
    });
    it("renders string value as-is", () => {
        expect(toDisplayString({ type: "string", value: "hello world" })).toBe("hello world");
    });
    it("renders int without unit", () => {
        expect(toDisplayString({ type: "int", value: 1024 })).toBe("1024");
    });
    it("renders int with unit suffix", () => {
        expect(toDisplayString({ type: "int", value: 1024 }, { unit: "KB" })).toBe("1024 KB");
    });
    it("renders double with default precision", () => {
        const result = toDisplayString({ type: "double", value: 3.14159265 });
        // Should be significant digits, not excess decimal places
        expect(result.length).toBeGreaterThan(0);
        expect(parseFloat(result)).toBeCloseTo(3.14159, 4);
    });
    it("renders double with unit suffix", () => {
        const result = toDisplayString({ type: "double", value: 2.5 }, { unit: "GHz" });
        expect(result).toContain("GHz");
    });
    it("prefixes ~ for int values exceeding MAX_SAFE_INTEGER", () => {
        const big = Number.MAX_SAFE_INTEGER + 1;
        const result = toDisplayString({ type: "int", value: big });
        expect(result.startsWith("~")).toBe(true);
    });
});

// ── compare ───────────────────────────────────────────────────────────────────

describe("compare", () => {
    it("returns -1 when a < b (int)", () => {
        expect(compare({ type: "int", value: 1 }, { type: "int", value: 2 })).toBe(-1);
    });
    it("returns 1 when a > b (double)", () => {
        expect(compare({ type: "double", value: 9.9 }, { type: "double", value: 1.1 })).toBe(1);
    });
    it("returns 0 when a === b", () => {
        expect(compare({ type: "int", value: 5 }, { type: "int", value: 5 })).toBe(0);
    });
    it("returns null for mismatched types", () => {
        expect(compare({ type: "int", value: 1 }, { type: "double", value: 1 })).toBeNull();
    });
    it("returns null for non-numeric types", () => {
        expect(compare({ type: "bool", value: true }, { type: "bool", value: false })).toBeNull();
    });
});

// ── extractNumericSeries ──────────────────────────────────────────────────────

function makeResult(overrides: Partial<TestResult> & { metrics?: Record<string, TypedValue> }): TestResult {
    return {
        id: "r1", run_id: "run1", module_id: "cpu", module_version: "1",
        test_id: "t1", name: "test", sequence: 1, timestamp: "2024-01-01T00:00:00Z",
        duration_ns: 1000, mode: "single_shot", status: "PASS", severity: "INFO",
        error_message: "", reason: {}, metrics: {}, monitoring: {}, event: [],
        subtests: [], payload_type_url: "", payload_b64: "",
        ...overrides,
        metrics: overrides.metrics ?? {},
    } as unknown as TestResult;
}

describe("extractNumericSeries", () => {
    it("extracts numeric values in sequence order", () => {
        const results = [
            makeResult({ sequence: 2, timestamp: "2024-01-01T00:00:02Z", metrics: { freq: { type: "int", value: 200 } } }),
            makeResult({ sequence: 1, timestamp: "2024-01-01T00:00:01Z", metrics: { freq: { type: "int", value: 100 } } }),
        ];
        const series = extractNumericSeries(results, "metrics", "freq");
        expect(series).toHaveLength(2);
        expect(series[0].sequence).toBe(1);
        expect(series[0].value).toBe(100);
        expect(series[1].sequence).toBe(2);
        expect(series[1].value).toBe(200);
    });

    it("skips non-numeric values", () => {
        const results = [
            makeResult({ sequence: 1, metrics: { state: { type: "string", value: "ok" } } }),
        ];
        const series = extractNumericSeries(results, "metrics", "state");
        expect(series).toHaveLength(0);
    });

    it("skips results missing the key", () => {
        const results = [
            makeResult({ sequence: 1, metrics: {} }),
        ];
        const series = extractNumericSeries(results, "metrics", "nonexistent");
        expect(series).toHaveLength(0);
    });
});

// ── numericKeys ───────────────────────────────────────────────────────────────

describe("numericKeys", () => {
    it("returns sorted list of numeric metric keys", () => {
        const results = [
            makeResult({ metrics: { z_val: { type: "double", value: 1.0 }, a_count: { type: "int", value: 5 } } }),
            makeResult({ metrics: { a_count: { type: "int", value: 6 }, b_val: { type: "int", value: 0 } } }),
        ];
        const keys = numericKeys(results, "metrics");
        expect(keys).toEqual(["a_count", "b_val", "z_val"]);
    });

    it("excludes non-numeric keys", () => {
        const results = [
            makeResult({ metrics: { name: { type: "string", value: "cpu" }, freq: { type: "int", value: 100 } } }),
        ];
        const keys = numericKeys(results, "metrics");
        expect(keys).toEqual(["freq"]);
    });

    it("returns empty array for empty results", () => {
        expect(numericKeys([], "metrics")).toEqual([]);
    });
});
