/**
 * Unit tests for src/components/results/result-table.tsx
 * Tests filtering, sorting, row expansion, and column rendering.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultTable } from "@/components/results/result-table";
import type { TestResult } from "@/lib/api/types";

// ── Test fixture ──────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
    return {
        id: `r-${Math.random().toString(36).slice(2, 8)}`,
        run_id: "run-001",
        module_id: "cpu_test",
        module_version: "1.0.0",
        test_id: "cpu_freq",
        name: "CPU Frequency",
        sequence: 1,
        timestamp: "2024-01-15T10:00:00Z",
        duration_ns: 500_000_000,
        mode: "single_shot",
        status: "PASS",
        severity: "INFO",
        error_message: "",
        reason: {},
        metrics: {},
        monitoring: {},
        event: {},
        subtests: [],
        payload_type_url: "",
        payload_b64: "",
        ...overrides,
    };
}

const baseResults: TestResult[] = [
    makeResult({ id: "r1", sequence: 1, status: "PASS", name: "Alpha Test", test_id: "alpha" }),
    makeResult({ id: "r2", sequence: 2, status: "FAIL", name: "Beta Test", test_id: "beta" }),
    makeResult({ id: "r3", sequence: 3, status: "TIMEOUT", severity: "WARNING", name: "Gamma Test", test_id: "gamma" }),
    makeResult({ id: "r4", sequence: 4, status: "SKIPPED", name: "Delta Test", test_id: "delta" }),
];

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("ResultTable", () => {
    it("renders a row for each result", () => {
        render(<ResultTable results={baseResults} />);
        expect(screen.getByText("Alpha Test")).toBeTruthy();
        expect(screen.getByText("Beta Test")).toBeTruthy();
        expect(screen.getByText("Gamma Test")).toBeTruthy();
        expect(screen.getByText("Delta Test")).toBeTruthy();
    });

    it("renders status badges for each result", () => {
        render(<ResultTable results={baseResults} />);
        const statusEls = screen.getAllByRole("status");
        // At least one badge per result
        expect(statusEls.length).toBeGreaterThanOrEqual(4);
    });

    it("renders sequence numbers", () => {
        render(<ResultTable results={baseResults} />);
        expect(screen.getByText("1")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy();
    });

    it("renders the search input", () => {
        render(<ResultTable results={baseResults} />);
        expect(screen.getByPlaceholderText(/search/i)).toBeTruthy();
    });

    it("renders status filter chips for each known status present in results", () => {
        render(<ResultTable results={baseResults} />);
        // Status chip buttons should appear
        expect(screen.getByText("PASS")).toBeTruthy();
        expect(screen.getByText("FAIL")).toBeTruthy();
        expect(screen.getByText("TIMEOUT")).toBeTruthy();
        expect(screen.getByText("SKIPPED")).toBeTruthy();
    });

    it("renders empty state message when results array is empty", () => {
        render(<ResultTable results={[]} />);
        expect(screen.getByText(/no results/i)).toBeTruthy();
    });

    // ── Free-text search filter ─────────────────────────────────────────────

    it("filters rows by free-text search matching name", () => {
        render(<ResultTable results={baseResults} />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: "Beta" } });
        expect(screen.getByText("Beta Test")).toBeTruthy();
        expect(screen.queryByText("Alpha Test")).toBeNull();
    });

    it("filters rows by free-text search matching test_id", () => {
        render(<ResultTable results={baseResults} />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: "delta" } });
        expect(screen.getByText("Delta Test")).toBeTruthy();
        expect(screen.queryByText("Alpha Test")).toBeNull();
    });

    it("shows all rows when search is cleared", () => {
        render(<ResultTable results={baseResults} />);
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: "Beta" } });
        fireEvent.change(searchInput, { target: { value: "" } });
        expect(screen.getByText("Alpha Test")).toBeTruthy();
        expect(screen.getByText("Beta Test")).toBeTruthy();
    });

    // ── Status chip filter ─────────────────────────────────────────────────

    it("filters rows by status chip click (toggle on)", () => {
        render(<ResultTable results={baseResults} />);
        const passChip = screen.getByRole("button", { name: "PASS" });
        fireEvent.click(passChip);
        expect(screen.getByText("Alpha Test")).toBeTruthy();
        expect(screen.queryByText("Beta Test")).toBeNull();
    });

    it("shows all rows again when status chip is clicked again (toggle off)", () => {
        render(<ResultTable results={baseResults} />);
        const passChip = screen.getByRole("button", { name: "PASS" });
        fireEvent.click(passChip); // on
        fireEvent.click(passChip); // off
        expect(screen.getByText("Beta Test")).toBeTruthy();
    });

    // ── Metric columns ──────────────────────────────────────────────────────

    it("renders auto-detected metric column header", () => {
        const resultsWithMetrics = [
            makeResult({
                id: "r1",
                sequence: 1,
                metrics: { cpu_mhz: { type: "int", value: 1800 } },
            }),
        ];
        render(<ResultTable results={resultsWithMetrics} />);
        expect(screen.getByText("cpu_mhz")).toBeTruthy();
    });

    it("renders metric value in cell", () => {
        const resultsWithMetrics = [
            makeResult({
                id: "r1",
                sequence: 1,
                metrics: { cpu_mhz: { type: "int", value: 1800 } },
            }),
        ];
        render(<ResultTable results={resultsWithMetrics} />);
        expect(screen.getByText("1800")).toBeTruthy();
    });

    // ── Row expansion ───────────────────────────────────────────────────────

    it("expands a row to show GenericResultRenderer on click", () => {
        render(<ResultTable results={[makeResult({ id: "r1", sequence: 1, name: "Alpha Test" })]} />);
        // Click the expand toggle (chevron button)
        const expandBtn = screen.getByRole("button", { name: /expand/i });
        fireEvent.click(expandBtn);
        // The generic renderer should show the sequence badge
        expect(screen.getByText("#1")).toBeTruthy();
    });

    it("collapses the row when expand toggle is clicked again", () => {
        render(<ResultTable results={[makeResult({ id: "r1", sequence: 1, name: "Alpha Test" })]} />);
        const expandBtn = screen.getByRole("button", { name: /expand/i });
        fireEvent.click(expandBtn); // expand
        fireEvent.click(expandBtn); // collapse
        // The sequence badge in the expanded renderer should be gone
        expect(screen.queryByText("#1")).toBeNull();
    });
});
