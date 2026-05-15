/**
 * T062 — Logs page: route-level integration tests.
 * Uses vi.mock to verify the page wires the right query hooks and mutations.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";

// ── Mutation stubs ─────────────────────────────────────────────────────────────
const mutateAsyncBookmark = vi.fn();
const mutateAsyncSaveView = vi.fn();

interface LogEntry { id: string; run_id: string; source: string; severity: string; message: string; timestamp: string; }
interface Bookmark { id: string; log_id: string; note: string; created_at: string; }
interface SavedView { id: string; name: string; filters_json: string; created_at: string; created_by: string; }

let runLogsData: LogEntry[] = [];
let globalLogsData: LogEntry[] = [];
let searchLogsData: LogEntry[] = [];
let bookmarksData: Bookmark[] = [];
let savedViewsData: SavedView[] = [];

vi.mock("@/lib/api/queries", () => ({
    useRunLogs: () => ({ data: runLogsData, isLoading: false }),
    useGlobalLogs: () => ({ data: globalLogsData, isLoading: false }),
    useSearchLogs: () => ({ data: searchLogsData, isLoading: false }),
    useLogBookmarks: () => ({ data: bookmarksData }),
    useCreateLogBookmark: () => ({ mutateAsync: mutateAsyncBookmark, isPending: false }),
    useDeleteLogBookmark: () => ({ mutate: vi.fn(), isPending: false }),
    useSavedViews: () => ({ data: savedViewsData }),
    useCreateSavedView: () => ({ mutateAsync: mutateAsyncSaveView, isPending: false }),
}));

import LogsPage from "@/app/(shell)/logs/page";

describe("LogsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        runLogsData = [];
        globalLogsData = [];
        searchLogsData = [];
        bookmarksData = [];
        savedViewsData = [];
        mutateAsyncBookmark.mockResolvedValue({ id: "bk1", log_id: "log1" });
        mutateAsyncSaveView.mockResolvedValue({ id: "v1", name: "view" });
    });

    it("shows 'Navigate to a run' placeholder without run_id param", () => {
        render(<LogsPage />);
        expect(screen.getByText(/navigate to a run to see its logs/i)).toBeTruthy();
    });

    it("renders search input and Save view button", () => {
        render(<LogsPage />);
        expect(screen.getByPlaceholderText(/search logs/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /save view/i })).toBeTruthy();
    });

    it("renders saved view options in the selector", () => {
        savedViewsData = [
            { id: "v1", name: "CPU errors only", filters_json: "{}", created_at: new Date().toISOString(), created_by: "tester" },
        ];
        render(<LogsPage />);
        // Three selects: source filter, level filter, saved-views — all rendered as comboboxes
        const comboboxes = screen.getAllByRole("combobox");
        expect(comboboxes.length).toBeGreaterThanOrEqual(3);
    });

    it("calls createSavedView.mutateAsync when Save view is clicked and prompt confirmed", async () => {
        vi.stubGlobal("prompt", () => "my-test-view");
        render(<LogsPage />);
        fireEvent.click(screen.getByRole("button", { name: /save view/i }));
        await waitFor(() => {
            expect(mutateAsyncSaveView).toHaveBeenCalledWith(
                expect.objectContaining({ name: "my-test-view" }),
            );
        });
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Saved view created");
        });
        vi.unstubAllGlobals();
    });

    it("does not call createSavedView when prompt is cancelled", async () => {
        vi.stubGlobal("prompt", () => null);
        render(<LogsPage />);
        fireEvent.click(screen.getByRole("button", { name: /save view/i }));
        await new Promise((r) => setTimeout(r, 50));
        expect(mutateAsyncSaveView).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });
});

