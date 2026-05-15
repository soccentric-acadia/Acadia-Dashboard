/**
 * T062 — Templates page: route-level integration tests.
 * Uses vi.mock to verify the page wires the right query hooks and mutations.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { TestMode } from "@/lib/api/types";

// ── Stub QueryClient — these pages use hooks, not QC directly ───────────────────────
const mutateAsync = vi.fn();
const mutateAsyncDelete = vi.fn();
const mutateAsyncArchive = vi.fn();
const mutateAsyncInstantiate = vi.fn();
const mutateAsyncCreateConfig = vi.fn();

let templatesData: Array<{
    id: string; name: string; description?: string; mode: TestMode;
    is_archived: boolean; created_at: string; created_by: string;
}> = [];

vi.mock("@/lib/api/queries", () => ({
    useTemplates: () => ({ data: templatesData, isLoading: false }),
    useCreateTemplate: () => ({ mutateAsync, isPending: false }),
    useDeleteTemplate: () => ({ mutateAsync: mutateAsyncDelete, isPending: false }),
    useArchiveTemplate: () => ({ mutateAsync: mutateAsyncArchive, isPending: false }),
    useInstantiateTemplate: () => ({ mutateAsync: mutateAsyncInstantiate, isPending: false }),
    useCreateConfig: () => ({ mutateAsync: mutateAsyncCreateConfig, isPending: false }),
}));

import TemplatesPage from "@/app/(shell)/templates/page";

const TEMPLATE = {
    id: "t1",
    name: "Burn-in baseline",
    description: "Standard burn-in",
    mode: "single_shot" as TestMode,
    is_archived: false,
    created_at: new Date().toISOString(),
    created_by: "tester",
};

describe("TemplatesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        templatesData = [];
        mutateAsync.mockResolvedValue(TEMPLATE);
        mutateAsyncDelete.mockResolvedValue({});
        mutateAsyncArchive.mockResolvedValue({ ...TEMPLATE, is_archived: true });
        mutateAsyncInstantiate.mockResolvedValue({ config_json: JSON.stringify({ mode: "single_shot", common_config: {}, modules: [] }) });
        mutateAsyncCreateConfig.mockResolvedValue({ id: "cfg1", name: "Draft", mode: "single_shot" });
    });

    it("shows empty state when no templates exist", () => {
        render(<TemplatesPage />);
        expect(screen.getByText(/no templates saved yet/i)).toBeTruthy();
    });

    it("renders templates when list is populated", () => {
        templatesData = [TEMPLATE];
        render(<TemplatesPage />);
        expect(screen.getByText("Burn-in baseline")).toBeTruthy();
        expect(screen.getByText("Active")).toBeTruthy();
    });

    it("shows 'Archived' badge for archived templates", () => {
        templatesData = [{ ...TEMPLATE, is_archived: true }];
        render(<TemplatesPage />);
        expect(screen.getByText("Archived")).toBeTruthy();
    });

    it("shows error toast when creating with empty name", async () => {
        render(<TemplatesPage />);
        fireEvent.click(screen.getByRole("button", { name: /new template/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Template name is required");
        });
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it("calls createTemplate.mutateAsync with correct payload", async () => {
        render(<TemplatesPage />);
        const nameInput = screen.getByLabelText("Name");
        fireEvent.change(nameInput, { target: { value: "Burn-in baseline" } });
        fireEvent.click(screen.getByRole("button", { name: /new template/i }));
        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
                name: "Burn-in baseline",
                mode: "single_shot",
            }));
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Template created");
        });
    });

    it("shows error toast when createTemplate fails", async () => {
        mutateAsync.mockRejectedValue(new Error("Server error"));
        render(<TemplatesPage />);
        const nameInput = screen.getByLabelText("Name");
        fireEvent.change(nameInput, { target: { value: "Test" } });
        fireEvent.click(screen.getByRole("button", { name: /new template/i }));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Server error");
        });
    });

    it("calls deleteTemplate.mutateAsync with template id", async () => {
        templatesData = [TEMPLATE];
        render(<TemplatesPage />);
        const deleteBtn = screen.getByRole("button", { name: /delete template/i });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(mutateAsyncDelete).toHaveBeenCalledWith("t1");
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Template deleted");
        });
    });

    it("calls archiveTemplate.mutateAsync with template id", async () => {
        templatesData = [TEMPLATE];
        render(<TemplatesPage />);
        const archiveBtn = screen.getByRole("button", { name: /archive template/i });
        fireEvent.click(archiveBtn);
        await waitFor(() => {
            expect(mutateAsyncArchive).toHaveBeenCalledWith("t1");
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Template archived");
        });
    });

    it("calls instantiateTemplate and createConfig when instantiating", async () => {
        templatesData = [TEMPLATE];
        render(<TemplatesPage />);
        const instantiateBtn = screen.getByRole("button", { name: /instantiate template/i });
        fireEvent.click(instantiateBtn);
        await waitFor(() => {
            expect(mutateAsyncInstantiate).toHaveBeenCalledWith("t1");
        });
        await waitFor(() => {
            expect(mutateAsyncCreateConfig).toHaveBeenCalled();
        });
    });
});

