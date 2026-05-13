// Acadia REST API client.
// All functions use native fetch() + server-side session cookies for auth.
// No GraphQL — Server exposes REST at /api/v1/*.

import type {
    Board,
    Run,
    Result,
    LogEntry,
    TestConfig,
    OtaUpgrade,
    Notification,
    CreateConfigInput,
    CreateRunInput,
    PaginatedRuns,
    PaginatedResults,
} from "./types";

// ---------------------------------------------------------------------------
// Base URL + shared helpers
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

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
    get isNotFound()     { return this.status === 404; }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function fetchHealth(): Promise<{ status: string }> {
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
    const res = await request<{ runs: Run[]; total: number }>("GET", "/api/v1/runs", undefined, filter as Record<string, string | number | boolean | undefined>);
    return { runs: res.runs ?? [], total: res.total ?? 0 };
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

export async function fetchRunResults(runId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResults> {
    const res = await request<{ results: Result[]; total: number }>("GET", `/api/v1/runs/${runId}/results`, undefined, params as Record<string, number | undefined>);
    return { results: res.results ?? [], total: res.total ?? 0 };
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
    const res = await request<{ logs: LogEntry[]; total: number }>("GET", `/api/v1/runs/${runId}/logs`, undefined, filter as Record<string, string | number | undefined>);
    return res.logs ?? [];
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
    const res = await request<{ modules: ModuleInfo[] }>("GET", "/api/v1/modules");
    return res.modules ?? [];
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
