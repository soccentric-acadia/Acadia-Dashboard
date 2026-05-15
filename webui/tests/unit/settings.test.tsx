/**
 * T062 — Settings page: route-level integration tests.
 * Uses vi.mock to verify the page wires the right query hooks and mutations.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { toast } from "sonner";

/** Reliably set a React controlled input's value in jsdom. */
function setInput(el: HTMLElement, value: string) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value",
    )!.set!;
    nativeSetter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
}

// ── Mutation stubs ─────────────────────────────────────────────────────────────
const mutateAsyncCreateAlert = vi.fn();
const mutateUpdateAlert = vi.fn();
const mutateAsyncDeleteAlert = vi.fn();
const mutateAsyncUpdateRetention = vi.fn();
const mutateAsyncUpdateBoard = vi.fn();
const mutateAsyncDeleteBoard = vi.fn();
const mutateAsyncChangePassword = vi.fn();

interface AlertRule { id: string; module_id: string; field_path: string; operator: string; threshold: number; severity: string; enabled: boolean; created_at: string; }
interface Retention { retention_days: number; max_run_results: number; }

let alertRulesData: AlertRule[] = [];
let retentionData: Retention | undefined = undefined;

vi.mock("@/lib/api/queries", () => ({
    useAlertRules: () => ({ data: alertRulesData }),
    useCreateAlertRule: () => ({ mutateAsync: mutateAsyncCreateAlert, isPending: false }),
    useUpdateAlertRule: () => ({ mutate: mutateUpdateAlert, isPending: false }),
    useDeleteAlertRule: () => ({
        mutate: (id: string, opts: { onSuccess: () => void; onError: (e: Error) => void }) => {
            mutateAsyncDeleteAlert(id);
            opts.onSuccess();
        },
        isPending: false,
    }),
    useRetentionSettings: () => ({ data: retentionData }),
    useUpdateRetentionSettings: () => ({ mutateAsync: mutateAsyncUpdateRetention, isPending: false }),
    useUpdateBoard: () => ({ mutateAsync: mutateAsyncUpdateBoard, isPending: false }),
    useDeleteBoard: () => ({ mutateAsync: mutateAsyncDeleteBoard, isPending: false }),
    useChangePassword: () => ({ mutateAsync: mutateAsyncChangePassword, isPending: false }),
}));

import SettingsPage from "@/app/(shell)/settings/page";

const ALERT_RULE: AlertRule = {
    id: "ar1", module_id: "cpu", field_path: "metrics.temp",
    operator: ">", threshold: 80, severity: "warning", enabled: true,
    created_at: new Date().toISOString(),
};

const RETENTION: Retention = { retention_days: 30, max_run_results: 0 };

// ── Alert Rules section ────────────────────────────────────────────────────────
describe("SettingsPage — Alert Rules", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        alertRulesData = [];
        retentionData = RETENTION;
        mutateAsyncCreateAlert.mockResolvedValue(ALERT_RULE);
        mutateAsyncDeleteAlert.mockResolvedValue({});
    });

    it("shows 'no alert rules' when list is empty", () => {
        render(<SettingsPage />);
        expect(screen.getByText(/no alert rules configured/i)).toBeTruthy();
    });

    it("renders alert rules from data", () => {
        alertRulesData = [ALERT_RULE];
        render(<SettingsPage />);
        expect(screen.getByText("cpu")).toBeTruthy();
        expect(screen.getByText("metrics.temp")).toBeTruthy();
    });

    it("shows error toast when creating with empty module_id", async () => {
        render(<SettingsPage />);
        fireEvent.click(screen.getByRole("button", { name: /add rule/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Module and field are required");
        });
        expect(mutateAsyncCreateAlert).not.toHaveBeenCalled();
    });

    it("calls createAlertRule.mutateAsync with correct payload", async () => {
        render(<SettingsPage />);
        act(() => {
            setInput(screen.getByPlaceholderText("module_id"), "cpu");
            setInput(screen.getByPlaceholderText(/field_path/i), "metrics.temp");
        });
        fireEvent.click(screen.getByRole("button", { name: /add rule/i }));
        await waitFor(() => {
            expect(mutateAsyncCreateAlert).toHaveBeenCalledWith(expect.objectContaining({
                module_id: "cpu",
                field_path: "metrics.temp",
            }));
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Alert rule created");
        });
    });

    it("shows error toast when createAlertRule fails", async () => {
        mutateAsyncCreateAlert.mockRejectedValue(new Error("Server error"));
        render(<SettingsPage />);
        act(() => {
            setInput(screen.getByPlaceholderText("module_id"), "cpu");
            setInput(screen.getByPlaceholderText(/field_path/i), "metrics.temp");
        });
        fireEvent.click(screen.getByRole("button", { name: /add rule/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Server error");
        });
    });

    it("calls deleteAlertRule with rule id when delete clicked", async () => {
        alertRulesData = [ALERT_RULE];
        render(<SettingsPage />);
        const deleteBtn = await screen.findByRole("button", { name: /delete alert rule/i });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mutateAsyncDeleteAlert).toHaveBeenCalledWith("ar1");
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Rule deleted");
        });
    });
});

// ── Retention section ──────────────────────────────────────────────────────────
describe("SettingsPage — Retention", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        alertRulesData = [];
        retentionData = RETENTION;
        mutateAsyncUpdateRetention.mockResolvedValue(RETENTION);
    });

    it("shows current retention values", async () => {
        render(<SettingsPage />);
        await waitFor(() => {
            const input = screen.getByLabelText(/retention days/i) as HTMLInputElement;
            expect(input.value).toBe("30");
        });
    });

    it("calls updateRetentionSettings.mutateAsync on save", async () => {
        render(<SettingsPage />);
        await waitFor(() => screen.getByLabelText(/retention days/i));
        fireEvent.click(screen.getByRole("button", { name: /save retention/i }));
        await waitFor(() => {
            expect(mutateAsyncUpdateRetention).toHaveBeenCalledWith(
                expect.objectContaining({ retention_days: 30, max_run_results: 0 }),
            );
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Retention settings saved");
        });
    });
});

// ── Security section ───────────────────────────────────────────────────────────
describe("SettingsPage — Security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        alertRulesData = [];
        retentionData = RETENTION;
        mutateAsyncChangePassword.mockResolvedValue({ ok: true });
    });

    it("shows error toast when both password fields are empty", async () => {
        render(<SettingsPage />);
        fireEvent.click(screen.getByRole("button", { name: /change password/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Both fields required");
        });
        expect(mutateAsyncChangePassword).not.toHaveBeenCalled();
    });

    it("calls changePassword.mutateAsync with old and new password", async () => {
        render(<SettingsPage />);
        fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "old-pass" } });
        fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "new-secure-pass" } });
        fireEvent.click(screen.getByRole("button", { name: /change password/i }));
        await waitFor(() => {
            expect(mutateAsyncChangePassword).toHaveBeenCalledWith({
                old_password: "old-pass",
                new_password: "new-secure-pass",
            });
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Password changed");
        });
    });
});

