/**
 * Unit tests for src/lib/status/index.ts helpers.
 * No React needed — pure TS functions.
 */
import { describe, it, expect } from "vitest";
import {
    STATUS_ORDER,
    SEVERITY_ORDER,
    isFailureStatus,
    isUserCancelled,
    isNoOp,
    isTerminal,
    statusColor,
    severityRank,
    severityTextClass,
    shouldShowSeverity,
} from "@/lib/status";
import type { Status, Severity } from "@/lib/api/types";

// ── STATUS_ORDER / SEVERITY_ORDER ────────────────────────────────────────────

describe("STATUS_ORDER", () => {
    it("contains all 6 canonical statuses", () => {
        const expected: Status[] = ["PASS", "FAIL", "ERROR", "TIMEOUT", "SKIPPED", "ABORTED"];
        expect(STATUS_ORDER).toEqual(expected);
    });
});

describe("SEVERITY_ORDER", () => {
    it("contains all 4 severities in ascending order", () => {
        const expected: Severity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];
        expect(SEVERITY_ORDER).toEqual(expected);
    });
});

// ── Predicates ────────────────────────────────────────────────────────────────

describe("isFailureStatus", () => {
    it("returns true for FAIL", () => expect(isFailureStatus("FAIL")).toBe(true));
    it("returns true for ERROR", () => expect(isFailureStatus("ERROR")).toBe(true));
    it("returns true for TIMEOUT", () => expect(isFailureStatus("TIMEOUT")).toBe(true));
    it("returns false for PASS", () => expect(isFailureStatus("PASS")).toBe(false));
    it("returns false for SKIPPED", () => expect(isFailureStatus("SKIPPED")).toBe(false));
    it("returns false for ABORTED", () => expect(isFailureStatus("ABORTED")).toBe(false));
});

describe("isUserCancelled", () => {
    it("returns true for ABORTED", () => expect(isUserCancelled("ABORTED")).toBe(true));
    it("returns false for FAIL", () => expect(isUserCancelled("FAIL")).toBe(false));
});

describe("isNoOp", () => {
    it("returns true for SKIPPED", () => expect(isNoOp("SKIPPED")).toBe(true));
    it("returns false for PASS", () => expect(isNoOp("PASS")).toBe(false));
});

describe("isTerminal", () => {
    it("returns true for all known statuses (no in-flight status currently)", () => {
        for (const s of STATUS_ORDER) {
            expect(isTerminal(s)).toBe(true);
        }
    });
});

// ── statusColor ───────────────────────────────────────────────────────────────

describe("statusColor", () => {
    it("returns success badge variant for PASS", () => {
        expect(statusColor("PASS").badgeVariant).toBe("success");
    });
    it("returns destructive badge variant for FAIL", () => {
        expect(statusColor("FAIL").badgeVariant).toBe("destructive");
    });
    it("returns destructive badge variant for ERROR", () => {
        expect(statusColor("ERROR").badgeVariant).toBe("destructive");
    });
    it("returns timeout badge variant for TIMEOUT", () => {
        expect(statusColor("TIMEOUT").badgeVariant).toBe("timeout");
    });
    it("returns skipped badge variant for SKIPPED", () => {
        expect(statusColor("SKIPPED").badgeVariant).toBe("skipped");
    });
    it("returns aborted badge variant for ABORTED", () => {
        expect(statusColor("ABORTED").badgeVariant).toBe("aborted");
    });
    it("returns unknown badge variant for unknown status", () => {
        expect(statusColor("UNKNOWN" as Status).badgeVariant).toBe("unknown");
    });
    it("upgrades ring to ring-2 for CRITICAL severity on FAIL", () => {
        const colors = statusColor("FAIL", "CRITICAL");
        expect(colors.ring).toContain("ring-2");
    });
    it("does not upgrade ring for INFO severity", () => {
        const colors = statusColor("PASS", "INFO");
        expect(colors.ring).toContain("ring-1");
        expect(colors.ring).not.toContain("ring-2");
    });
});

// ── severityRank ──────────────────────────────────────────────────────────────

describe("severityRank", () => {
    it("INFO < WARNING < ERROR < CRITICAL", () => {
        expect(severityRank("INFO")).toBeLessThan(severityRank("WARNING"));
        expect(severityRank("WARNING")).toBeLessThan(severityRank("ERROR"));
        expect(severityRank("ERROR")).toBeLessThan(severityRank("CRITICAL"));
    });
    it("INFO has rank 0", () => {
        expect(severityRank("INFO")).toBe(0);
    });
    it("CRITICAL has rank 3", () => {
        expect(severityRank("CRITICAL")).toBe(3);
    });
});

// ── severityTextClass ─────────────────────────────────────────────────────────

describe("severityTextClass", () => {
    it("returns a non-empty string for each severity", () => {
        for (const s of SEVERITY_ORDER) {
            expect(severityTextClass(s).length).toBeGreaterThan(0);
        }
    });
    it("CRITICAL has bold/font-semibold styling", () => {
        expect(severityTextClass("CRITICAL")).toContain("font-semibold");
    });
    it("INFO uses muted text class", () => {
        expect(severityTextClass("INFO")).toContain("muted");
    });
});

// ── shouldShowSeverity ────────────────────────────────────────────────────────

describe("shouldShowSeverity", () => {
    it("returns false for INFO (suppress noise)", () => {
        expect(shouldShowSeverity("INFO")).toBe(false);
    });
    it("returns true for WARNING", () => expect(shouldShowSeverity("WARNING")).toBe(true));
    it("returns true for ERROR", () => expect(shouldShowSeverity("ERROR")).toBe(true));
    it("returns true for CRITICAL", () => expect(shouldShowSeverity("CRITICAL")).toBe(true));
});
