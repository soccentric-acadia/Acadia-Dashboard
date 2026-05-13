// TanStack Query hooks for all Acadia server state.
// Hooks use the REST client functions from ./client.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchHealth,
    fetchBoard,
    fetchRuns,
    fetchRun,
    createRun,
    cancelRun,
    pauseRun,
    resumeRun,
    fetchRunResults,
    fetchRunLogs,
    fetchConfigs,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    archiveConfig,
    fetchModules,
    fetchOtaList,
    fetchOtaUpgrade,
    triggerUpgrade,
    rollbackUpgrade,
    fetchNotifications,
    fetchNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    type RunsFilter,
    type LogFilter,
    type ModuleInfo,
} from "./client";
import type {
    Board,
    Run,
    RunStatus,
    TestConfig,
    CreateRunInput,
    CreateConfigInput,
} from "./types";

// ── Query keys ────────────────────────────────────────────────────────────────

export const keys = {
    health: ["health"] as const,
    board: ["board"] as const,
    runs: (f?: RunsFilter) => ["runs", f ?? {}] as const,
    run: (id: string) => ["run", id] as const,
    runResults: (id: string) => ["run", id, "results"] as const,
    runLogs: (id: string, f?: LogFilter) => ["run", id, "logs", f ?? {}] as const,
    configs: ["configs"] as const,
    config: (id: string) => ["config", id] as const,
    modules: ["modules"] as const,
    ota: ["ota"] as const,
    otaItem: (id: string) => ["ota", id] as const,
    notifications: ["notifications"] as const,
    notificationCount: ["notifications", "count"] as const,
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

export function useRunResults(runId: string, params?: { limit?: number; offset?: number }) {
    return useQuery({
        queryKey: keys.runResults(runId),
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

// ── API Tokens ────────────────────────────────────────────────────────────────

import { listApiTokens, revokeApiToken, type ApiToken } from "./client";

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
