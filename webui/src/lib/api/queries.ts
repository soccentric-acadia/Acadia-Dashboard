// TanStack Query hooks for all Acadia server state.
// Hooks use the REST client functions from ./client.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
    fetchHealth,
    fetchBoard,
    updateBoard,
    deleteBoard,
    fetchRuns,
    fetchRun,
    createRun,
    cancelRun,
    pauseRun,
    resumeRun,
    fetchRunResults,
    fetchRunLogs,
    fetchGlobalLogs,
    searchLogs,
    fetchLogBookmarks,
    createLogBookmark,
    deleteLogBookmark,
    fetchSavedViews,
    createSavedView,
    fetchConfigs,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    archiveConfig,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    archiveTemplate,
    instantiateTemplate,
    fetchModules,
    fetchOtaList,
    fetchOtaUpgrade,
    triggerUpgrade,
    rollbackUpgrade,
    fetchNotifications,
    fetchNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    fetchAlertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    deleteRun,
    setBaseline,
    rerunRun,
    exportRun,
    fetchRetentionSettings,
    updateRetentionSettings,
    changePassword,
    fetchSchedules,
    createSchedule,
    deleteSchedule,
    enableSchedule,
    disableSchedule,
    fetchModuleResults,
    fetchModuleTrend,
    fetchRunCompare,
    type RunsFilter,
    type LogFilter,
} from "./client";
import { getSSEClient } from "./ws";
import type {
    Run,
    RunStatus,
    
    CreateRunInput,
    CreateConfigInput,
} from "./types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const keys = {
    health: ["health"] as const,
    board: ["board"] as const,
    runs: (f?: RunsFilter) => ["runs", f ?? {}] as const,
    run: (id: string) => ["run", id] as const,
    runResults: (id: string, params?: Record<string, unknown>) => ["run", id, "results", params ?? {}] as const,
    runLogs: (id: string, f?: LogFilter) => ["run", id, "logs", f ?? {}] as const,
    logs: (f?: Record<string, unknown>) => ["logs", f ?? {}] as const,
    logSearch: (q: string, p?: Record<string, unknown>) => ["logs", "search", q, p ?? {}] as const,
    logBookmarks: ["logs", "bookmarks"] as const,
    logViews: ["logs", "views"] as const,
    moduleResults: (id: string, params?: Record<string, unknown>) => ["module", id, "results", params ?? {}] as const,
    moduleTrend: (id: string, testId: string, metricKey: string, source?: string) => ["module", id, "trend", testId, metricKey, source ?? "metrics"] as const,
    runCompare: (a: string, b: string) => ["run-compare", a, b] as const,
    configs: ["configs"] as const,
    config: (id: string) => ["config", id] as const,
    templates: ["templates"] as const,
    modules: ["modules"] as const,
    ota: ["ota"] as const,
    otaItem: (id: string) => ["ota", id] as const,
    notifications: ["notifications"] as const,
    notificationCount: ["notifications", "count"] as const,
    schedules: ["schedules"] as const,
    alertRules: ["alerts"] as const,
    retention: ["settings", "retention"] as const,
};

// ── Health ────────────────────────────────────────────────────────────────────

export function useHealth() {
    return useQuery({
        queryKey: keys.health,
        queryFn: fetchHealth,
        staleTime: 15_000,
        retry: false,
    });
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function useBoard() {
    return useQuery({
        queryKey: keys.board,
        queryFn: fetchBoard,
        staleTime: 10_000,
    });
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export function useRuns(filter: RunsFilter = {}) {
    return useQuery({
        queryKey: keys.runs(filter),
        queryFn: () => fetchRuns(filter),
        staleTime: 5_000,
    });
}

export function useRun(id: string) {
    return useQuery({
        queryKey: keys.run(id),
        queryFn: () => fetchRun(id),
        enabled: Boolean(id),
        staleTime: 3_000,
    });
}

/** Polls the server while a run is actively executing. */
export function useActiveRun(id: string) {
    return useQuery({
        queryKey: keys.run(id),
        queryFn: () => fetchRun(id),
        enabled: Boolean(id),
        refetchInterval: (query) => {
            const status = (query.state.data as Run | undefined)?.status;
            const active: RunStatus[] = ["queued", "running", "paused"];
            return active.includes(status as RunStatus) ? 2_000 : false;
        },
    });
}

export function useRunResults(runId: string, params?: { limit?: number; offset?: number; module_id?: string; test_id?: string }) {
    return useQuery({
        queryKey: keys.runResults(runId, params),
        queryFn: () => fetchRunResults(runId, params),
        enabled: Boolean(runId),
    });
}

export function useRunLogs(runId: string | null | undefined, filter: LogFilter = {}) {
    return useQuery({
        queryKey: keys.runLogs(runId ?? "", filter),
        queryFn: () => fetchRunLogs(runId!, filter),
        enabled: Boolean(runId),
    });
}

export function useGlobalLogs(filter: LogFilter & { run_id?: string } = {}) {
    return useQuery({
        queryKey: keys.logs(filter),
        queryFn: () => fetchGlobalLogs(filter),
        staleTime: 5_000,
    });
}

export function useSearchLogs(q: string, params: { limit?: number; offset?: number; run_id?: string; source?: string; level?: string } = {}) {
    return useQuery({
        queryKey: keys.logSearch(q, params),
        queryFn: () => searchLogs(q, params),
        enabled: q.trim().length > 1,
        staleTime: 2_000,
    });
}

export function useLogBookmarks() {
    return useQuery({
        queryKey: keys.logBookmarks,
        queryFn: fetchLogBookmarks,
        staleTime: 10_000,
    });
}

export function useCreateLogBookmark() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ log_id, note }: { log_id: string; note?: string }) => createLogBookmark(log_id, note ?? ""),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.logBookmarks });
        },
    });
}

export function useDeleteLogBookmark() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteLogBookmark(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.logBookmarks });
        },
    });
}

export function useSavedViews() {
    return useQuery({
        queryKey: keys.logViews,
        queryFn: fetchSavedViews,
        staleTime: 10_000,
    });
}

export function useCreateSavedView() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ name, filters_json }: { name: string; filters_json: string }) => createSavedView(name, filters_json),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.logViews });
        },
    });
}

/**
 * useRunSSE — wires live SSE events into the TanStack Query cache.
 * On `result` events: appends new result to the runResults cache.
 * On `state` events: updates the run status in the run cache.
 * Only active when the run is in a live state.
 */
export function useRunSSE(runId: string, active: boolean) {
    const qc = useQueryClient();
    const runIdRef = useRef(runId);
    runIdRef.current = runId;

    useEffect(() => {
        if (!active || !runId) return;
        const sse = getSSEClient();
        sse.subscribe(runId);

        const handler = (event: import("./types").RunSSEEvent) => {
            if (event.run_id !== runIdRef.current) return;

            if (event.type === "result") {
                // Append result to all cached runResults pages for this run
                qc.setQueriesData<import("./types").PaginatedResults>(
                    { queryKey: ["run", runId, "results"] },
                    (old) => {
                        if (!old) return old;
                        // Avoid duplicates by sequence number
                        const exists = old.results.some((r) => r.sequence === event.result.sequence && r.test_id === event.result.test_id);
                        if (exists) return old;
                        return {
                            ...old,
                            results: [...old.results, event.result],
                            total: old.total + 1,
                        };
                    },
                );
            }

            if (event.type === "state") {
                // Update run status in cache
                qc.setQueryData<import("./types").Run>(
                    keys.run(runId),
                    (old) => old ? { ...old, status: event.status } : old,
                );
                // If terminal, stop polling and invalidate to get final state
                const terminal: RunStatus[] = ["completed", "failed", "cancelled"];
                if (terminal.includes(event.status as RunStatus)) {
                    qc.invalidateQueries({ queryKey: keys.run(runId) });
                    qc.invalidateQueries({ queryKey: ["run", runId, "results"] });
                }
            }
        };

        sse.on(handler);
        return () => {
            sse.off(handler);
            sse.unsubscribe(runId);
        };
    }, [runId, active, qc]);
}

// ── Module hooks ──────────────────────────────────────────────────────────────

export function useModuleResults(
    moduleId: string,
    params?: { limit?: number; offset?: number; test_id?: string; run_id?: string },
) {
    return useQuery({
        queryKey: keys.moduleResults(moduleId, params),
        queryFn: () => fetchModuleResults(moduleId, params),
        enabled: Boolean(moduleId),
        staleTime: 10_000,
    });
}

export function useModuleTrend(
    moduleId: string,
    testId: string,
    metricKey: string,
    source: "metrics" | "monitoring" | "event" = "metrics",
    from?: string,
    to?: string,
) {
    return useQuery({
        queryKey: keys.moduleTrend(moduleId, testId, metricKey, source),
        queryFn: () => fetchModuleTrend(moduleId, testId, metricKey, source, from, to),
        enabled: Boolean(moduleId) && Boolean(testId) && Boolean(metricKey),
        staleTime: 30_000,
    });
}

// ── Run comparison ────────────────────────────────────────────────────────────

export function useRunCompare(runAId: string, runBId: string) {
    return useQuery({
        queryKey: keys.runCompare(runAId, runBId),
        queryFn: () => fetchRunCompare(runAId, runBId),
        enabled: Boolean(runAId) && Boolean(runBId),
        staleTime: 60_000,
    });
}

// ── Run mutations ─────────────────────────────────────────────────────────────

export function useCreateRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateRunInput) => createRun(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.runs() });
        },
    });
}

export function useCancelRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => cancelRun(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: keys.run(id) });
            qc.invalidateQueries({ queryKey: keys.runs() });
        },
    });
}

export function usePauseRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => pauseRun(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: keys.run(id) });
        },
    });
}

export function useResumeRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => resumeRun(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: keys.run(id) });
        },
    });
}

// ── Test Configs ──────────────────────────────────────────────────────────────

export function useConfigs() {
    return useQuery({
        queryKey: keys.configs,
        queryFn: fetchConfigs,
        staleTime: 30_000,
    });
}

export function useConfig(id: string) {
    return useQuery({
        queryKey: keys.config(id),
        queryFn: () => fetchConfig(id),
        enabled: Boolean(id),
        staleTime: 30_000,
    });
}

export function useCreateConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateConfigInput) => createConfig(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.configs });
        },
    });
}

export function useUpdateConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<CreateConfigInput> }) => updateConfig(id, input),
        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: keys.config(id) });
            qc.invalidateQueries({ queryKey: keys.configs });
        },
    });
}

export function useDeleteConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteConfig(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.configs });
        },
    });
}

export function useArchiveConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => archiveConfig(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.configs });
        },
    });
}

// ── Templates ───────────────────────────────────────────────────────────────

export function useTemplates() {
    return useQuery({
        queryKey: keys.templates,
        queryFn: fetchTemplates,
        staleTime: 30_000,
    });
}

export function useCreateTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.templates });
        },
    });
}

export function useDeleteTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTemplate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.templates });
        },
    });
}

export function useArchiveTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => archiveTemplate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.templates });
        },
    });
}

export function useInstantiateTemplate() {
    return useMutation({
        mutationFn: (id: string) => instantiateTemplate(id),
    });
}

// ── Alert rules ───────────────────────────────────────────────────────────────

export function useAlertRules() {
    return useQuery({
        queryKey: keys.alertRules,
        queryFn: fetchAlertRules,
        staleTime: 30_000,
    });
}

export function useCreateAlertRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createAlertRule,
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.alertRules }); },
    });
}

export function useUpdateAlertRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateAlertRule>[1] }) =>
            updateAlertRule(id, input),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.alertRules }); },
    });
}

export function useDeleteAlertRule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteAlertRule(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.alertRules }); },
    });
}

// ── Run extras ────────────────────────────────────────────────────────────────

export function useDeleteRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteRun(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.runs() }); },
    });
}

export function useSetBaseline() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => setBaseline(id),
        onSuccess: (_data: unknown, id: string) => { qc.invalidateQueries({ queryKey: keys.run(id) }); },
    });
}

export function useRerunRun() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => rerunRun(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.runs() }); },
    });
}

export function useExportRun() {
    return useMutation({
        mutationFn: ({ id, format }: { id: string; format?: "csv" | "json" }) => exportRun(id, format),
    });
}

// ── Retention settings ────────────────────────────────────────────────────────

export function useRetentionSettings() {
    return useQuery({
        queryKey: keys.retention,
        queryFn: fetchRetentionSettings,
        staleTime: 60_000,
    });
}

export function useUpdateRetentionSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (s: Parameters<typeof updateRetentionSettings>[0]) => updateRetentionSettings(s),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.retention }); },
    });
}

// ── Board mutations ───────────────────────────────────────────────────────────

export function useUpdateBoard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (board: Parameters<typeof updateBoard>[0]) => updateBoard(board),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.board }); },
    });
}

export function useDeleteBoard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => deleteBoard(),
        onSuccess: () => { qc.invalidateQueries({ queryKey: keys.board }); },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string }) =>
            changePassword(old_password, new_password),
    });
}

// ── Modules ───────────────────────────────────────────────────────────────────

export function useModules() {
    return useQuery({
        queryKey: keys.modules,
        queryFn: fetchModules,
        staleTime: 60_000,
    });
}

// ── OTA ───────────────────────────────────────────────────────────────────────

export function useOtaList() {
    return useQuery({
        queryKey: keys.ota,
        queryFn: fetchOtaList,
        staleTime: 10_000,
    });
}

export function useOtaUpgrade(id: string) {
    return useQuery({
        queryKey: keys.otaItem(id),
        queryFn: () => fetchOtaUpgrade(id),
        enabled: Boolean(id),
    });
}

export function useTriggerUpgrade() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => triggerUpgrade(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.ota });
        },
    });
}

export function useRollbackUpgrade() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => rollbackUpgrade(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.ota });
        },
    });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications() {
    return useQuery({
        queryKey: keys.notifications,
        queryFn: fetchNotifications,
        staleTime: 15_000,
        refetchInterval: 30_000,
    });
}

export function useNotificationCount() {
    return useQuery({
        queryKey: keys.notificationCount,
        queryFn: fetchNotificationCount,
        staleTime: 15_000,
        refetchInterval: 30_000,
    });
}

export function useMarkNotificationRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => markNotificationRead(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.notifications });
            qc.invalidateQueries({ queryKey: keys.notificationCount });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => markAllNotificationsRead(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.notifications });
            qc.invalidateQueries({ queryKey: keys.notificationCount });
        },
    });
}

// ── Schedules ───────────────────────────────────────────────────────────────

export function useSchedules() {
    return useQuery({
        queryKey: keys.schedules,
        queryFn: fetchSchedules,
        staleTime: 10_000,
    });
}

export function useCreateSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createSchedule,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.schedules });
        },
    });
}

export function useDeleteSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSchedule(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.schedules });
        },
    });
}

export function useEnableSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => enableSchedule(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.schedules });
        },
    });
}

export function useDisableSchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => disableSchedule(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.schedules });
        },
    });
}

// ── API Tokens ────────────────────────────────────────────────────────────────

import { listApiTokens, revokeApiToken } from "./client";

export function useListApiTokens() {
    return useQuery({
        queryKey: ["auth", "tokens"] as const,
        queryFn: listApiTokens,
        staleTime: 30_000,
    });
}

export function useRevokeApiToken() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => revokeApiToken(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["auth", "tokens"] });
        },
    });
}

export function useCreateApiToken() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (label: string) => (async () => {
            const { createApiToken } = await import("./client");
            return createApiToken(label);
        })(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["auth", "tokens"] });
        },
    });
}
