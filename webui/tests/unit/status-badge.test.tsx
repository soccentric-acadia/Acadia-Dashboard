/**
 * Unit tests for src/components/ui/status-badge.tsx
 * Tests that StatusBadge and SeverityChip render correctly for all status/severity values.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, SeverityChip } from "@/components/ui/status-badge";
import type { Severity } from "@/lib/api/types";

// ── StatusBadge ───────────────────────────────────────────────────────────────

describe("StatusBadge", () => {
    const knownStatuses = ["PASS", "FAIL", "ERROR", "TIMEOUT", "SKIPPED", "ABORTED"] as const;

    for (const status of knownStatuses) {
        it(`renders "${status}" label for known status`, () => {
            render(<StatusBadge status={status} />);
            expect(screen.getByText(status)).toBeTruthy();
        });
    }

    it("renders UNKNOWN(…) label for unknown status", () => {
        render(<StatusBadge status="RUNNING" />);
        expect(screen.getByText(/UNKNOWN/i)).toBeTruthy();
    });

    it("has role=status and aria-label", () => {
        render(<StatusBadge status="PASS" />);
        const el = screen.getByRole("status");
        expect(el).toBeTruthy();
        expect(el.getAttribute("aria-label")).toContain("PASS");
    });

    it("includes severity in aria-label when showSeverity and non-INFO severity", () => {
        render(<StatusBadge status="FAIL" severity="CRITICAL" showSeverity />);
        const el = screen.getByRole("status");
        expect(el.getAttribute("aria-label")).toContain("CRITICAL");
    });

    it("does NOT include severity in aria-label for INFO (always suppressed)", () => {
        render(<StatusBadge status="PASS" severity="INFO" showSeverity />);
        const el = screen.getByRole("status");
        expect(el.getAttribute("aria-label")).not.toContain("INFO");
    });

    it("shows severity sub-label when showSeverity=true and severity is WARNING", () => {
        render(<StatusBadge status="FAIL" severity="WARNING" showSeverity />);
        expect(screen.getByText(/WARNING/)).toBeTruthy();
    });

    it("does not show severity sub-label when showSeverity=false (default)", () => {
        render(<StatusBadge status="FAIL" severity="CRITICAL" />);
        // The label CRITICAL should not appear as a separate text node
        // The main badge text should be "FAIL"
        const badge = screen.getByRole("status");
        expect(badge.textContent).toBe("FAIL");
    });
});

// ── SeverityChip ──────────────────────────────────────────────────────────────

describe("SeverityChip", () => {
    it("renders null for INFO severity", () => {
        const { container } = render(<SeverityChip severity="INFO" />);
        expect(container.firstChild).toBeNull();
    });

    const nonInfoSeverities: Severity[] = ["WARNING", "ERROR", "CRITICAL"];

    for (const severity of nonInfoSeverities) {
        it(`renders "${severity}" chip for ${severity} severity`, () => {
            render(<SeverityChip severity={severity} />);
            expect(screen.getByText(severity)).toBeTruthy();
        });
    }

    it("has aria-label attribute", () => {
        render(<SeverityChip severity="CRITICAL" />);
        const el = screen.getByText("CRITICAL");
        expect(el.closest("[aria-label]")?.getAttribute("aria-label")).toContain("CRITICAL");
    });
});
