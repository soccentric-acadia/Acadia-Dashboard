// Acadia REST API client.
// All functions use native fetch() + server-side session cookies for auth.
// No GraphQL — Server exposes REST at /api/v1/*.

import {
    MOCK_BOARD,
    MOCK_MODULES,
    mockRuns,
    MOCK_PAGINATED_RESULTS,
    MOCK_LOGS,
} from "./mock";
import type {
    Board,
    Run,
    TestResult,
    LogEntry,
    TestConfig,
    OtaUpgrade,
    Notification,
    CreateConfigInput,
    CreateRunInput,
    PaginatedRuns,
    PaginatedResults,
    RunComparison,
    TrendData,
} from "./types";

// ---------------------------------------------------------------------------
// Base URL + shared helpers
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? "";

/** Builds a URL relative to the API base, appending optional query params. */
function apiUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${API_BASE}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== "" && v !== null) {
                url.searchParams.set(k, String(v));
            }
        }
    }
    return url.toString();
}

/**
 * Wrapper around fetch that:
 *   - Sends/receives JSON
 *   - Includes session cookie (credentials: "include")
 *   - Throws ApiError on non-2xx responses
 */
async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = apiUrl(path, params);
    const init: RequestInit = {
        method,
        credentials: "include",
        headers: body !== undefined ? { "Content-Type": "application/json" } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
    };
    const res = await fetch(url, init);
    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
            const err = await res.json() as { error?: string };
            if (err.error) errMsg = err.error;
        } catch { /* ignore */ }
        throw new ApiError(errMsg, res.status);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
}

export class ApiError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
        this.name = "ApiError";
    }
    get isUnauthorized() { return this.status === 401; }
    get isNotFound() { return this.status === 404; }
}

/**
 * Returns true when the error is a network-level failure (server unreachable),
 * i.e. a TypeError thrown by fetch() before any HTTP response is received.
 */
export function isOfflineError(err: unknown): err is TypeError {
    return err instanceof TypeError;
}

/**
 * Wraps an API call and returns `fallback` when the server is unreachable.
 * Auth errors (401) are still propagated so the login page can handle them.
 */
async function withOfflineFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        if (isOfflineError(err)) return fallback;
        throw err;
    }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function fetchHealth(): Promise<{ status: string }> {
    // Health intentionally does NOT fall back — callers use isError to show "Offline".
    return request("GET", "/api/v1/health");
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResponse {
    user_id: string;
    username: string;
}

export async function authLogin(username: string, password: string): Promise<LoginResponse> {
    return request("POST", "/api/v1/auth/login", { username, password });
}

export async function authLogout(): Promise<void> {
    return request("POST", "/api/v1/auth/logout");
}

export interface ApiToken {
    id: string;
    label: string;
    created_at: string;
    last_used_at: string | null;
}

export async function listApiTokens(): Promise<ApiToken[]> {
    const res = await request<{ tokens: ApiToken[] }>("GET", "/api/v1/auth/tokens");
    return res.tokens ?? [];
}

export async function createApiToken(label: string): Promise<{ id: string; label: string; token_str: string }> {
    return request("POST", "/api/v1/auth/tokens", { label });
}

export async function revokeApiToken(id: string): Promise<void> {
    return request("DELETE", `/api/v1/auth/tokens/${id}`);
}

// ---------------------------------------------------------------------------
// Board (target)
// ---------------------------------------------------------------------------

export async function fetchBoard(): Promise<Board | null> {
    try {
        return await request<Board>("GET", "/api/v1/target");
    } catch (e) {
        if (e instanceof ApiError && e.isNotFound) return null;
        if (isOfflineError(e)) return MOCK_BOARD;
        throw e;
    }
}

export async function registerBoard(board: Partial<Board>): Promise<Board> {
    return request("POST", "/api/v1/target", board);
}

export async function updateBoard(board: Partial<Board>): Promise<Board> {
    return request("PUT", "/api/v1/target", board);
}

export async function sendHeartbeat(board: Partial<Board>): Promise<void> {
    return request("POST", "/api/v1/target/heartbeat", board);
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

export interface RunsFilter {
    status?: string;
    mode?: string;
    limit?: number;
    offset?: number;
}

export async function fetchRuns(filter: RunsFilter = {}): Promise<PaginatedRuns> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ runs: Run[]; total: number }>("GET", "/api/v1/runs", undefined, filter as Record<string, string | number | boolean | undefined>);
            return { runs: res.runs ?? [], total: res.total ?? 0 };
        },
        mockRuns(filter),
    );
}

export async function fetchRun(id: string): Promise<Run> {
    return request("GET", `/api/v1/runs/${id}`);
}

export async function createRun(input: CreateRunInput): Promise<Run> {
    return request("POST", "/api/v1/runs", input);
}

export async function cancelRun(id: string): Promise<void> {
    await request("POST", `/api/v1/runs/${id}/cancel`);
}

export async function pauseRun(id: string): Promise<void> {
    await request("POST", `/api/v1/runs/${id}/pause`);
}

export async function resumeRun(id: string): Promise<void> {
    await request("POST", `/api/v1/runs/${id}/resume`);
}

// ---------------------------------------------------------------------------
// Runs — results
// ---------------------------------------------------------------------------

export async function fetchRunResults(runId: string, params?: { limit?: number; offset?: number; module_id?: string; test_id?: string }): Promise<PaginatedResults> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ results: TestResult[]; total: number }>("GET", `/api/v1/runs/${runId}/results`, undefined, params as Record<string, string | number | undefined>);
            return { results: res.results ?? [], total: res.total ?? 0 };
        },
        MOCK_PAGINATED_RESULTS,
    );
}

// ---------------------------------------------------------------------------
// Runs — logs
// ---------------------------------------------------------------------------

export interface LogFilter {
    level?: string;
    source?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}

export async function fetchRunLogs(runId: string, filter: LogFilter = {}): Promise<LogEntry[]> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ logs: LogEntry[]; total: number }>("GET", `/api/v1/runs/${runId}/logs`, undefined, filter as Record<string, string | number | undefined>);
            return res.logs ?? [];
        },
        MOCK_LOGS.filter((l) => l.run_id === runId),
    );
}

// ---------------------------------------------------------------------------
// Test Configs
// ---------------------------------------------------------------------------

export async function fetchConfigs(): Promise<TestConfig[]> {
    const res = await request<{ configs: TestConfig[] }>("GET", "/api/v1/configs");
    return res.configs ?? [];
}

export async function fetchConfig(id: string): Promise<TestConfig> {
    return request("GET", `/api/v1/configs/${id}`);
}

export async function createConfig(input: CreateConfigInput): Promise<TestConfig> {
    return request("POST", "/api/v1/configs", input);
}

export async function updateConfig(id: string, input: Partial<CreateConfigInput>): Promise<TestConfig> {
    return request("PUT", `/api/v1/configs/${id}`, input);
}

export async function deleteConfig(id: string): Promise<void> {
    return request("DELETE", `/api/v1/configs/${id}`);
}

export async function archiveConfig(id: string): Promise<void> {
    return request("POST", `/api/v1/configs/${id}/archive`);
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export interface ModuleInfo {
    id: string;
    proto_package: string;
    config_type: string;
    result_type: string;
    version: string;
    status: string;
    source_path: string;
    category?: string;
}

export async function fetchModules(): Promise<ModuleInfo[]> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ modules: ModuleInfo[] }>("GET", "/api/v1/modules");
            return res.modules ?? [];
        },
        MOCK_MODULES,
    );
}

export async function fetchModule(id: string): Promise<ModuleInfo> {
    return request("GET", `/api/v1/modules/${id}`);
}

// ---------------------------------------------------------------------------
// OTA
// ---------------------------------------------------------------------------

export async function fetchOtaList(): Promise<OtaUpgrade[]> {
    const res = await request<{ upgrades: OtaUpgrade[] }>("GET", "/api/v1/ota");
    return res.upgrades ?? [];
}

export async function fetchOtaUpgrade(id: string): Promise<OtaUpgrade> {
    return request("GET", `/api/v1/ota/${id}`);
}

export async function uploadArtifact(file: File): Promise<OtaUpgrade> {
    const url = apiUrl("/api/v1/ota/upload");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(url, { method: "POST", credentials: "include", body: form });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new ApiError(err.error ?? `HTTP ${res.status}`, res.status);
    }
    return res.json() as Promise<OtaUpgrade>;
}

export async function triggerUpgrade(id: string): Promise<void> {
    return request("POST", `/api/v1/ota/${id}/trigger`);
}

export async function rollbackUpgrade(id: string): Promise<void> {
    return request("POST", `/api/v1/ota/${id}/rollback`);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<Notification[]> {
    const res = await request<{ notifications: Notification[] }>("GET", "/api/v1/notifications");
    return res.notifications ?? [];
}

export async function fetchNotificationCount(): Promise<number> {
    const res = await request<{ count: number }>("GET", "/api/v1/notifications/count");
    return res.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
    return request("POST", `/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
    return request("POST", "/api/v1/notifications/read-all");
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

export interface Schedule {
    id: string;
    template_id: string;
    cron_expression: string;
    run_at: string;
    enabled: boolean;
    last_run_at: string;
    next_run_at: string;
    created_at: string;
    created_by: string;
}

export interface CreateScheduleInput {
    template_id: string;
    cron_expression: string;
    run_at?: string;
    enabled?: boolean;
}

export async function fetchSchedules(): Promise<Schedule[]> {
    const res = await request<{ schedules: Schedule[] }>("GET", "/api/v1/schedules");
    return res.schedules ?? [];
}

export async function fetchSchedule(id: string): Promise<Schedule> {
    return request("GET", `/api/v1/schedules/${id}`);
}

export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    return request("POST", "/api/v1/schedules", input);
}

export async function updateSchedule(id: string, input: Partial<CreateScheduleInput>): Promise<Schedule> {
    return request("PUT", `/api/v1/schedules/${id}`, input);
}

export async function deleteSchedule(id: string): Promise<void> {
    return request("DELETE", `/api/v1/schedules/${id}`);
}

export async function enableSchedule(id: string): Promise<Schedule> {
    await request("POST", `/api/v1/schedules/${id}/enable`);
    return fetchSchedule(id);
}

export async function disableSchedule(id: string): Promise<Schedule> {
    await request("POST", `/api/v1/schedules/${id}/disable`);
    return fetchSchedule(id);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface Template {
    id: string;
    name: string;
    description: string;
    mode: import("./types").TestMode;
    common_config?: Record<string, unknown>;
    modules?: import("./types").ModuleConfig[];
    is_archived: boolean;
    created_at: string;
    created_by: string;
}

export interface CreateTemplateInput {
    name: string;
    description?: string;
    mode: import("./types").TestMode;
    common_config?: Record<string, unknown>;
    modules?: import("./types").ModuleConfig[];
}

export async function fetchTemplates(): Promise<Template[]> {
    const res = await request<{ templates: Template[] }>("GET", "/api/v1/templates");
    return res.templates ?? [];
}

export async function fetchTemplate(id: string): Promise<Template> {
    return request("GET", `/api/v1/templates/${id}`);
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
    return request("POST", "/api/v1/templates", input);
}

export async function updateTemplate(id: string, input: Partial<CreateTemplateInput>): Promise<Template> {
    return request("PUT", `/api/v1/templates/${id}`, input);
}

export async function deleteTemplate(id: string): Promise<void> {
    return request("DELETE", `/api/v1/templates/${id}`);
}

export async function archiveTemplate(id: string): Promise<Template> {
    await request("POST", `/api/v1/templates/${id}/archive`);
    return fetchTemplate(id);
}

export async function instantiateTemplate(id: string): Promise<{ config_json: string }> {
    return request("POST", `/api/v1/templates/${id}/instantiate`, {});
}

// ---------------------------------------------------------------------------
// Global logs + bookmarks + saved views
// ---------------------------------------------------------------------------

export async function fetchGlobalLogs(filter: import("./client").LogFilter & { run_id?: string } = {}): Promise<import("./types").LogEntry[]> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ logs: import("./types").LogEntry[] }>("GET", "/api/v1/logs", undefined, filter as Record<string, string>);
            return res.logs ?? [];
        },
        filter.run_id ? MOCK_LOGS.filter((l) => l.run_id === filter.run_id) : MOCK_LOGS,
    );
}

export async function searchLogs(q: string, params: { limit?: number; offset?: number; run_id?: string; source?: string; level?: string } = {}): Promise<import("./types").LogEntry[]> {
    return withOfflineFallback(
        async () => {
            const res = await request<{ logs: import("./types").LogEntry[] }>("GET", "/api/v1/logs/search", undefined, { q, ...params } as Record<string, string | number>);
            return res.logs ?? [];
        },
        MOCK_LOGS.filter((l) => l.message.toLowerCase().includes(q.toLowerCase())),
    );
}

export interface LogBookmark {
    id: string;
    log_id: string;
    note: string;
    created_at: string;
}

export async function fetchLogBookmarks(): Promise<LogBookmark[]> {
    const res = await request<{ bookmarks: LogBookmark[] }>("GET", "/api/v1/logs/bookmarks");
    return res.bookmarks ?? [];
}

export async function createLogBookmark(log_id: string, note = ""): Promise<LogBookmark> {
    return request("POST", "/api/v1/logs/bookmarks", { log_id, note });
}

export async function deleteLogBookmark(id: string): Promise<void> {
    return request("DELETE", `/api/v1/logs/bookmarks/${id}`);
}

export interface SavedView {
    id: string;
    name: string;
    filters_json: string;
    created_at: string;
}

export async function fetchSavedViews(): Promise<SavedView[]> {
    const res = await request<{ views: SavedView[] }>("GET", "/api/v1/logs/views");
    return res.views ?? [];
}

export async function createSavedView(name: string, filters_json: string): Promise<SavedView> {
    return request("POST", "/api/v1/logs/views", { name, filters_json });
}

// ---------------------------------------------------------------------------
// Alert rules
// ---------------------------------------------------------------------------

export interface AlertRule {
    id: string;
    module_id: string;
    field_path: string;
    operator: ">" | "<" | ">=" | "<=" | "==";
    threshold: number;
    severity: "info" | "warning" | "critical";
    enabled: boolean;
    created_at: string;
}

export interface CreateAlertInput {
    module_id: string;
    field_path: string;
    operator: string;
    threshold: number;
    severity: string;
    enabled?: boolean;
}

export async function fetchAlertRules(): Promise<AlertRule[]> {
    const res = await request<{ rules: AlertRule[] }>("GET", "/api/v1/alerts");
    return res.rules ?? [];
}

export async function fetchAlertRule(id: string): Promise<AlertRule> {
    return request("GET", `/api/v1/alerts/${id}`);
}

export async function createAlertRule(input: CreateAlertInput): Promise<AlertRule> {
    return request("POST", "/api/v1/alerts", input);
}

export async function updateAlertRule(id: string, input: Partial<CreateAlertInput>): Promise<AlertRule> {
    return request("PUT", `/api/v1/alerts/${id}`, input);
}

export async function deleteAlertRule(id: string): Promise<void> {
    return request("DELETE", `/api/v1/alerts/${id}`);
}

// ---------------------------------------------------------------------------
// Run extras: delete, baseline, rerun, export, report
// ---------------------------------------------------------------------------

export async function deleteRun(id: string): Promise<void> {
    return request("DELETE", `/api/v1/runs/${id}`);
}

export async function setBaseline(id: string): Promise<void> {
    return request("POST", `/api/v1/runs/${id}/baseline`);
}

export async function rerunRun(id: string): Promise<import("./types").Run> {
    return request("POST", `/api/v1/runs/${id}/rerun`);
}

export async function exportRun(id: string, format: "csv" | "json" = "json"): Promise<Blob> {
    const url = apiUrl(`/api/v1/runs/${id}/export`, { format });
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
    return res.blob();
}

export async function fetchRunReport(id: string): Promise<string> {
    const url = apiUrl(`/api/v1/runs/${id}/report`);
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
    return res.text();
}

// ---------------------------------------------------------------------------
// Run comparison
// ---------------------------------------------------------------------------

/**
 * Server-side run comparison: returns categorised diffs for every (module_id, test_id) pair.
 * Categorisation (improved/regressed/drifted/etc.) comes from the server.
 * The UI renders; it does NOT duplicate categorisation logic.
 */
export async function fetchRunCompare(runAId: string, runBId: string): Promise<RunComparison> {
    return request("GET", `/api/v1/runs/${encodeURIComponent(runAId)}/compare/${encodeURIComponent(runBId)}`);
}

// ---------------------------------------------------------------------------
// Module-scoped results and trend
// ---------------------------------------------------------------------------

/** Paginated results across all runs for a given module. */
export async function fetchModuleResults(
    moduleId: string,
    params?: { limit?: number; offset?: number; test_id?: string; run_id?: string },
): Promise<PaginatedResults> {
    const res = await request<{ results: TestResult[]; total: number }>(
        "GET",
        `/api/v1/modules/${encodeURIComponent(moduleId)}/results`,
        undefined,
        params as Record<string, string | number | undefined>,
    );
    return { results: res.results ?? [], total: res.total ?? 0 };
}

/**
 * Numeric time-series for a specific (module, test, metric) triplet across runs.
 * Server returns only numeric values — non-numeric metrics are not included.
 */
export async function fetchModuleTrend(
    moduleId: string,
    testId: string,
    metricKey: string,
    source: "metrics" | "monitoring" | "event" = "metrics",
    from?: string,
    to?: string,
): Promise<TrendData> {
    return request("GET", `/api/v1/modules/${encodeURIComponent(moduleId)}/trend`, undefined, {
        test_id: testId,
        field: metricKey,
        source,
        from,
        to,
    } as Record<string, string | undefined>);
}

/** POST a threshold spec to the server. Evaluates against future results. */
export async function createThreshold(input: CreateAlertInput): Promise<AlertRule> {
    return createAlertRule(input);
}

/** DELETE a threshold. */
export async function deleteThreshold(id: string): Promise<void> {
    return deleteAlertRule(id);
}

// ---------------------------------------------------------------------------
// Settings / retention
// ---------------------------------------------------------------------------

export interface RetentionSettings {
    retention_days: number;
    max_run_results: number;
}

export async function fetchRetentionSettings(): Promise<RetentionSettings> {
    return request("GET", "/api/v1/settings/retention");
}

export async function updateRetentionSettings(s: Partial<RetentionSettings>): Promise<RetentionSettings> {
    return request("PUT", "/api/v1/settings/retention", s);
}

// ---------------------------------------------------------------------------
// Auth extras: change password, delete board
// ---------------------------------------------------------------------------

export async function changePassword(old_password: string, new_password: string): Promise<void> {
    return request("PATCH", "/api/v1/auth/password", { old_password, new_password });
}

export async function deleteBoard(): Promise<void> {
    return request("DELETE", "/api/v1/target");
}
