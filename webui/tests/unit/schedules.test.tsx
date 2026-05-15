/**
 * T062 — Schedules page: route-level integration tests.
 * Uses vi.mock to verify the page wires the right query hooks and mutations.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { TestMode } from "@/lib/api/types";

// ── Mutation stubs ──────────────────────────────────────────────────────────────
const mutateAsyncCreate = vi.fn();
const mutateAsyncDelete = vi.fn();
const mutateAsyncEnable = vi.fn();
const mutateAsyncDisable = vi.fn();

interface ScheduleRow {
    id: string; template_id: string; cron_expression: string;
    run_at: string; enabled: boolean; last_run_at: string;
    next_run_at: string; created_at: string; created_by: string;
}
interface TemplateRow {
    id: string; name: string; mode: TestMode;
    is_archived: boolean; created_at: string; created_by: string;
}

let schedulesData: ScheduleRow[] = [];
let templatesData: TemplateRow[] = [];

vi.mock("@/lib/api/queries", () => ({
    useSchedules: () => ({ data: schedulesData, isLoading: false }),
    useTemplates: () => ({ data: templatesData, isLoading: false }),
    useCreateSchedule: () => ({ mutateAsync: mutateAsyncCreate, isPending: false }),
    useDeleteSchedule: () => ({ mutateAsync: mutateAsyncDelete, isPending: false }),
    useEnableSchedule: () => ({ mutateAsync: mutateAsyncEnable, isPending: false }),
    useDisableSchedule: () => ({ mutateAsync: mutateAsyncDisable, isPending: false }),
}));

import SchedulesPage from "@/app/(shell)/schedules/page";

const TEMPLATE: TemplateRow = {
    id: "tpl1", name: "Weekly CPU", mode: "single_shot",
    is_archived: false, created_at: new Date().toISOString(), created_by: "tester",
};
const SCHEDULE: ScheduleRow = {
    id: "s1", template_id: "tpl1", cron_expression: "0 8 * * 1",
    run_at: "", enabled: true, last_run_at: "",
    next_run_at: "2026-05-19T08:00:00Z",
    created_at: new Date().toISOString(), created_by: "tester",
};

describe("SchedulesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        schedulesData = [];
        templatesData = [];
        mutateAsyncCreate.mockResolvedValue(SCHEDULE);
        mutateAsyncDelete.mockResolvedValue({});
        mutateAsyncEnable.mockResolvedValue({ ...SCHEDULE, enabled: true });
        mutateAsyncDisable.mockResolvedValue({ ...SCHEDULE, enabled: false });
    });

    it("shows empty state when no schedules exist", () => {
        render(<SchedulesPage />);
        expect(screen.getByText(/no schedules configured/i)).toBeTruthy();
    });

    it("renders schedule rows when data is available", () => {
        schedulesData = [SCHEDULE];
        templatesData = [TEMPLATE];
        render(<SchedulesPage />);
        expect(screen.getByText("0 8 * * 1")).toBeTruthy();
    });

    it("resolves template name from template list", () => {
        schedulesData = [SCHEDULE];
        templatesData = [TEMPLATE];
        render(<SchedulesPage />);
        expect(screen.getByText("Weekly CPU")).toBeTruthy();
    });

    it("shows 'Enabled' badge for enabled schedule", () => {
        schedulesData = [SCHEDULE];
        render(<SchedulesPage />);
        expect(screen.getByText("Enabled")).toBeTruthy();
    });

    it("shows 'Disabled' badge for disabled schedule", () => {
        schedulesData = [{ ...SCHEDULE, enabled: false }];
        render(<SchedulesPage />);
        expect(screen.getByText("Disabled")).toBeTruthy();
    });

    it("shows error toast when creating without selecting a template", async () => {
        render(<SchedulesPage />);
        fireEvent.click(screen.getByRole("button", { name: /new schedule/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Choose a template first");
        });
        expect(mutateAsyncCreate).not.toHaveBeenCalled();
    });

    it("calls deleteSchedule.mutateAsync with schedule id", async () => {
        schedulesData = [SCHEDULE];
        render(<SchedulesPage />);
        const deleteBtn = screen.getByRole("button", { name: /delete schedule/i });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mutateAsyncDelete).toHaveBeenCalledWith("s1");
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Schedule deleted");
        });
    });

    it("calls disableSchedule.mutateAsync when toggling enabled switch off", async () => {
        schedulesData = [SCHEDULE]; // enabled: true
        render(<SchedulesPage />);
        const toggle = screen.getByRole("switch", { name: /enable schedule/i });
        // The switch is checked (enabled); click to disable
        fireEvent.click(toggle);
        await waitFor(() => {
            expect(mutateAsyncDisable).toHaveBeenCalledWith("s1");
        });
    });

    it("calls enableSchedule.mutateAsync when toggling disabled switch on", async () => {
        schedulesData = [{ ...SCHEDULE, enabled: false }];
        render(<SchedulesPage />);
        const toggle = screen.getByRole("switch", { name: /enable schedule/i });
        fireEvent.click(toggle);
        await waitFor(() => {
            expect(mutateAsyncEnable).toHaveBeenCalledWith("s1");
        });
    });

    it("shows error toast when deleteSchedule fails", async () => {
        schedulesData = [SCHEDULE];
        mutateAsyncDelete.mockRejectedValue(new Error("Server error"));
        render(<SchedulesPage />);
        fireEvent.click(screen.getByRole("button", { name: /delete schedule/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Server error");
        });
    });
});

