/**
 * src/data/index.ts
 *
 * Unified data layer — the single import point for all page hooks.
 *
 * Hooks transparently route to live API (via TanStack Query) or
 * the simulation engine (Zustand store) based on connection state.
 *
 * Pages must never import from lib/api/ or data/sim/ directly.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useSimStore } from "./sim/engine";
import { useResolver } from "./resolver";
import { protoResultsToRestResults } from "./sim/adapter";
import { statusToString } from "@/proto/types";
import type { CompareRow, CompareCategory, Status } from "@/lib/api/types";
import type { RunsFilter } from "./live/client";
import {
    fetchRuns,
    fetchRun,
    fetchRunResults,
    fetchGlobalLogs,
    fetchTemplates,
    fetchSchedules,
    fetchModuleResults,
    fetchRunCompare,
    fetchNotifications,
    fetchNotificationCount,
    fetchOtaList,
} from "./live/client";

// Re-export connection state hooks for convenience
export { useConnectionState, useIsSimulated, useIsLive, useConnectionStore } from "@/state/connection";
export { useSimStore } from "./sim/engine";
export type { SimRun, SimTemplate, SimSchedule } from "./sim/engine";

// ── Connection health ─────────────────────────────────────────────────────────

export function useConnectionManager() {
    const { connectionState } = useResolver();
    return { connectionState };
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export function useRuns(filter: RunsFilter = {}) {
    const { isSimMode } = useResolver();
    const simRuns = useSimStore((s) => s.runs);
    const liveQuery = useQuery({
        queryKey: ["runs", filter],
        queryFn: () => fetchRuns(filter),
        enabled: !isSimMode,
        staleTime: 5_000,
    });

    if (isSimMode) {
        let filtered = simRuns;
        if (filter.status) filtered = filtered.filter((r) => r.status === filter.status);
        if (filter.limit) filtered = filtered.slice(0, filter.limit);
        return {
            data: { runs: filtered, total: filtered.length },
            isLoading: false,
            error: null,
        };
    }
    return liveQuery;
}

export function useRun(id: string) {
    const { isSimMode } = useResolver();
    const simRun = useSimStore((s) => s.runs.find((r) => r.id === id));
    const liveQuery = useQuery({
        queryKey: ["run", id],
        queryFn: () => fetchRun(id),
        enabled: !isSimMode && Boolean(id),
        staleTime: 3_000,
    });

    if (isSimMode) {
        return { data: simRun, isLoading: false, error: null };
    }
    return liveQuery;
}

export function useRunResults(runId: string, params?: Record<string, unknown>) {
    const { isSimMode } = useResolver();
    const simResultsRaw = useSimStore((s) => {
        const runResults = s.results[runId];
        if (!runResults) return [];
        return Object.values(runResults).flat();
    });
    const liveQuery = useQuery({
        queryKey: ["run", runId, "results", params ?? {}],
        queryFn: () => fetchRunResults(runId, params),
        enabled: !isSimMode && Boolean(runId),
        staleTime: 3_000,
    });

    if (isSimMode) {
        const results = protoResultsToRestResults(simResultsRaw, runId);
        return { data: { results, total: results.length }, isLoading: false, error: null };
    }
    return liveQuery;
}

// ── Module results ────────────────────────────────────────────────────────────

export function useModuleResults(moduleId: string, params?: Record<string, unknown>) {
    const { isSimMode } = useResolver();
    const simResultsRaw = useSimStore((s) => {
        const allResults: import("@/proto/types").TestResult[] = [];
        for (const runResults of Object.values(s.results)) {
            if (runResults[moduleId]) allResults.push(...runResults[moduleId]);
        }
        return allResults;
    });
    const liveQuery = useQuery({
        queryKey: ["module", moduleId, "results", params ?? {}],
        queryFn: () => fetchModuleResults(moduleId, params),
        enabled: !isSimMode && Boolean(moduleId),
        staleTime: 5_000,
    });

    if (isSimMode) {
        const results = protoResultsToRestResults(simResultsRaw);
        return { data: { results, total: results.length }, isLoading: false, error: null };
    }
    return liveQuery;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function useTemplates() {
    const { isSimMode } = useResolver();
    const simTemplates = useSimStore((s) => s.templates);
    const liveQuery = useQuery({
        queryKey: ["templates"],
        queryFn: fetchTemplates,
        enabled: !isSimMode,
        staleTime: 30_000,
    });

    if (isSimMode) {
        // Normalize SimTemplate → REST Template shape
        const normalized = simTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description ?? "",
            mode: t.mode,
            common_config: undefined,
            modules: undefined,
            is_archived: false,
            created_at: t.createdAt,
            created_by: "sim",
        }));
        return { data: normalized, isLoading: false, error: null };
    }
    return liveQuery;
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export function useSchedules() {
    const { isSimMode } = useResolver();
    const simSchedules = useSimStore((s) => s.schedules);
    const liveQuery = useQuery({
        queryKey: ["schedules"],
        queryFn: fetchSchedules,
        enabled: !isSimMode,
        staleTime: 30_000,
    });

    if (isSimMode) {
        // Normalize SimSchedule → REST Schedule shape
        const normalized = simSchedules.map((s) => ({
            id: s.id,
            template_id: s.templateId,
            cron_expression: s.cron ?? "",
            run_at: s.oneTimeAt ?? "",
            enabled: s.enabled,
            last_run_at: s.lastRunAt ?? "",
            next_run_at: s.nextRunAt ?? "",
            created_at: "",
            created_by: "sim",
        }));
        return { data: normalized, isLoading: false, error: null };
    }
    return liveQuery;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export function useLogs(params?: Record<string, unknown>) {
    const { isSimMode } = useResolver();
    const liveQuery = useQuery({
        queryKey: ["logs", params ?? {}],
        queryFn: () => fetchGlobalLogs(params),
        enabled: !isSimMode,
        staleTime: 5_000,
    });

    if (isSimMode) {
        // Return synthetic logs
        return {
            data: generateSimLogs(),
            isLoading: false,
            error: null,
        };
    }
    return liveQuery;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications() {
    const { isSimMode } = useResolver();
    const liveQuery = useQuery({
        queryKey: ["notifications"],
        queryFn: fetchNotifications,
        enabled: !isSimMode,
        staleTime: 30_000,
    });

    if (isSimMode) return { data: [], isLoading: false, error: null };
    return liveQuery;
}

export function useNotificationCount() {
    const { isSimMode } = useResolver();
    const liveQuery = useQuery({
        queryKey: ["notifications", "count"],
        queryFn: fetchNotificationCount,
        enabled: !isSimMode,
        staleTime: 15_000,
    });

    if (isSimMode) return { data: 0, isLoading: false, error: null };
    return liveQuery;
}

// ── OTA ───────────────────────────────────────────────────────────────────────

export function useOtaList() {
    const { isSimMode } = useResolver();
    const liveQuery = useQuery({
        queryKey: ["ota"],
        queryFn: fetchOtaList,
        enabled: !isSimMode,
        staleTime: 60_000,
    });

    if (isSimMode) return { data: [], isLoading: false, error: null };
    return liveQuery;
}

// ── Run compare ───────────────────────────────────────────────────────────────

export function useRunCompare(runAId: string, runBId: string) {
    const { isSimMode } = useResolver();
    const simStore = useSimStore.getState();
    const liveQuery = useQuery({
        queryKey: ["run-compare", runAId, runBId],
        queryFn: () => fetchRunCompare(runAId, runBId),
        enabled: !isSimMode && Boolean(runAId) && Boolean(runBId),
        staleTime: 10_000,
    });

    if (isSimMode) {
        const aResults = simStore.results[runAId] ?? {};
        const bResults = simStore.results[runBId] ?? {};
        // Build normalized RunComparison rows from sim data
        const allModuleIds = Array.from(new Set([...Object.keys(aResults), ...Object.keys(bResults)]));
        const rows: CompareRow[] = [];
        for (const moduleId of allModuleIds) {
            const aList = (aResults[moduleId] ?? []);
            const bList = (bResults[moduleId] ?? []);
            const allTestIds = Array.from(new Set([...aList.map((r) => r.testId), ...bList.map((r) => r.testId)]));
            for (const testId of allTestIds) {
                const a = aList.find((r) => r.testId === testId);
                const b = bList.find((r) => r.testId === testId);
                const statusA = a ? (statusToString(a.output?.status ?? 0) as Status) : null;
                const statusB = b ? (statusToString(b.output?.status ?? 0) as Status) : null;
                const cat: CompareCategory = !a ? "appeared" : !b ? "disappeared" : statusA === statusB ? "unchanged" : "regressed";
                rows.push({ module_id: moduleId, test_id: testId, name: testId, status_a: statusA, status_b: statusB, severity_a: null, severity_b: null, category: cat, metrics_drift: {} });
            }
        }
        return { data: { run_a_id: runAId, run_b_id: runBId, rows }, isLoading: false, error: null };
    }
    return liveQuery;
}

// ── Sim-specific actions ───────────────────────────────────────────────────────

export function useSimActions() {
    const store = useSimStore();
    return {
        createRun: store.createRun,
        startRun: store.startRun,
        pauseRun: store.pauseRun,
        resumeRun: store.resumeRun,
        stopRun: store.stopRun,
        deleteRun: store.deleteRun,
        injectFault: store.injectFault,
        clearFault: store.clearFault,
        fireEvent: store.fireEvent,
        setProfile: store.setProfile,
        createTemplate: store.createTemplate,
        deleteTemplate: store.deleteTemplate,
        createSchedule: store.createSchedule,
        toggleSchedule: store.toggleSchedule,
        deleteSchedule: store.deleteSchedule,
    };
}

// ── Synthetic log generator ───────────────────────────────────────────────────

function generateSimLogs() {
    const sources = ["kernel", "syslog", "app"] as const;
    const severities = ["INFO", "WARNING", "ERROR"] as const;
    const messages = [
        "System boot complete",
        "HAL service started",
        "Module registry loaded: 51 modules",
        "gRPC server listening on :50051",
        "Test run started",
        "CPU temperature nominal: 45.2°C",
        "Network interface eth0 up",
        "Simulation engine running",
        "Result stream active",
        "Watchdog timer reset",
    ];

    return Array.from({ length: 50 }, (_, i) => ({
        id: `sim-log-${i}`,
        timestamp: new Date(Date.now() - i * 30_000).toISOString(),
        source: sources[i % 3],
        severity: severities[Math.floor(Math.random() * 2)] as (typeof severities)[number],
        message: messages[i % messages.length],
    }));
}

// ── Re-exports from lib/api/queries (mutations + live-only hooks) ─────────────
// These are re-exported here so pages only ever import from @/data.
// Mutation hooks always route to the live API; sim mutations go via useSimActions().
export {
    useCreateRun,
    useCancelRun,
    usePauseRun,
    useResumeRun,
    useDeleteRun,
    useSetBaseline,
    useRerunRun,
    useExportRun,
    useActiveRun,
    useRunSSE,
    useRunLogs,
    useGlobalLogs,
    useSearchLogs,
    useLogBookmarks,
    useCreateLogBookmark,
    useDeleteLogBookmark,
    useSavedViews,
    useCreateSavedView,
    useConfigs,
    useConfig,
    useCreateConfig,
    useUpdateConfig,
    useDeleteConfig,
    useArchiveConfig,
    useCreateTemplate,
    useDeleteTemplate,
    useArchiveTemplate,
    useInstantiateTemplate,
    useCreateSchedule,
    useDeleteSchedule,
    useEnableSchedule,
    useDisableSchedule,
    useTriggerUpgrade,
    useRollbackUpgrade,
    useOtaUpgrade,
    useAlertRules,
    useCreateAlertRule,
    useUpdateAlertRule,
    useDeleteAlertRule,
    useRetentionSettings,
    useUpdateRetentionSettings,
    useUpdateBoard,
    useDeleteBoard,
    useChangePassword,
    useBoard as useBoardQuery,
    useModuleTrend,
} from "@/lib/api/queries";
export type { RunsFilter } from "./live/client";
