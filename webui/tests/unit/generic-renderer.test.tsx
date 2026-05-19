/**
 * Unit tests for src/components/results/renderers/generic.tsx
 * Tests that GenericResultRenderer renders all sections correctly.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GenericResultRenderer } from "@/components/results/renderers/generic";
import type { TestResult } from "@/lib/api/types";

// ── Test fixture factory ───────────────────────────────────────────────────────

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
    return {
        id: "r-001",
        run_id: "run-001",
        module_id: "cpu_test",
        module_version: "1.0.0",
        test_id: "cpu_freq_test",
        name: "CPU Frequency Test",
        sequence: 1,
        timestamp: "2024-01-15T10:00:00Z",
        duration_ns: 1_500_000_000, // 1.5 s
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

// ── Basic rendering ───────────────────────────────────────────────────────────

describe("GenericResultRenderer", () => {
    it("renders status badge", () => {
        render(<GenericResultRenderer result={makeResult({ status: "PASS" })} />);
        expect(screen.getByRole("status")).toBeTruthy();
        expect(screen.getByText("PASS")).toBeTruthy();
    });

    it("renders module label derived from module_id", () => {
        render(<GenericResultRenderer result={makeResult({ module_id: "cpu_test" })} />);
        // getModuleLabel converts underscores to spaces and capitalises
        expect(screen.getByText("Cpu Test")).toBeTruthy();
    });

    it("renders sequence badge", () => {
        render(<GenericResultRenderer result={makeResult({ sequence: 7 })} />);
        expect(screen.getByText("#7")).toBeTruthy();
    });

    it("renders formatted duration", () => {
        render(<GenericResultRenderer result={makeResult({ duration_ns: 1_500_000_000 })} />);
        // 1.5 s → should show "1.500s" or similar
        expect(screen.getByText(/1\.5/)).toBeTruthy();
    });

    it("renders test_id when different from name", () => {
        render(<GenericResultRenderer result={makeResult({ test_id: "t_001", name: "CPU Test" })} />);
        expect(screen.getByText("t_001")).toBeTruthy();
    });

    // ── Error banner ────────────────────────────────────────────────────────

    it("does NOT render error banner when error_message is empty", () => {
        render(<GenericResultRenderer result={makeResult({ error_message: "" })} />);
        expect(screen.queryByText(/error_message/i)).toBeNull();
    });

    it("renders error banner for ERROR status with message", () => {
        render(
            <GenericResultRenderer
                result={makeResult({ status: "ERROR", error_message: "HAL timeout after 10s" })}
            />,
        );
        expect(screen.getByText(/HAL timeout after 10s/i)).toBeTruthy();
    });

    // ── Reason section ──────────────────────────────────────────────────────

    it("renders reason key-value entries", () => {
        render(
            <GenericResultRenderer
                result={makeResult({ reason: { exit_code: "1", signal: "SIGTERM" } })}
            />,
        );
        expect(screen.getByText("exit_code")).toBeTruthy();
        expect(screen.getByText("signal")).toBeTruthy();
    });

    it("does not render reason section when reason is empty", () => {
        render(<GenericResultRenderer result={makeResult({ reason: {} })} />);
        expect(screen.queryByText(/Reason/)).toBeNull();
    });

    // ── Metrics section ─────────────────────────────────────────────────────

    it("renders metrics key names", () => {
        render(
            <GenericResultRenderer
                result={makeResult({
                    metrics: {
                        frequency_mhz: { type: "double", value: 1800.5 },
                        temp_c: { type: "int", value: 72 },
                    },
                })}
            />,
        );
        expect(screen.getByText("frequency_mhz")).toBeTruthy();
        expect(screen.getByText("temp_c")).toBeTruthy();
    });

    it("does not render metrics section when metrics is empty", () => {
        render(<GenericResultRenderer result={makeResult({ metrics: {} })} />);
        // No "Metrics" collapsible header
        expect(screen.queryByText(/Metrics/)).toBeNull();
    });

    // ── Subtests ────────────────────────────────────────────────────────────

    it("renders subtests section when subtests present", () => {
        const subtest = makeResult({ id: "sub-1", sequence: 1, name: "Subtest Alpha" });
        render(<GenericResultRenderer result={makeResult({ subtests: [subtest] })} />);
        expect(screen.getByText(/Subtests/)).toBeTruthy();
    });

    it("renders nested subtest content when expanded", () => {
        const subtest = makeResult({ id: "sub-1", name: "Subtest Alpha", test_id: "sub_alpha" });
        render(<GenericResultRenderer result={makeResult({ subtests: [subtest] })} />);
        // Subtests section is open by default
        expect(screen.getByText("Subtest Alpha")).toBeTruthy();
    });

    // ── onChartKey callback ─────────────────────────────────────────────────

    it("calls onChartKey when chart button is clicked on a numeric metric", () => {
        const onChartKey = vi.fn();
        render(
            <GenericResultRenderer
                result={makeResult({ metrics: { load_avg: { type: "double", value: 0.75 } } })}
                onChartKey={onChartKey}
            />,
        );
        // Find and click the chart button for load_avg
        const chartBtn = screen.getByRole("button", { name: /chart load_avg/i });
        fireEvent.click(chartBtn);
        expect(onChartKey).toHaveBeenCalledWith("metrics", "load_avg");
    });

    // ── Depth / indentation ────────────────────────────────────────────────

    it("applies indentation at depth > 0", () => {
        const { container } = render(
            <GenericResultRenderer result={makeResult()} depth={1} />,
        );
        // The root div at depth=1 should have border-l styling
        expect(container.innerHTML).toContain("border-l");
    });
});
