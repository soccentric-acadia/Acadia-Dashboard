// REST API types derived from Acadia-Server's actual JSON responses.
// Field names match Server C++ serializers exactly.

/** Matches Server runs.status CHECK constraint */
export type RunStatus =
    | "queued"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "cancelled";

/** Matches Server runs.mode CHECK constraint */
export type TestMode =
    | "single_shot"
    | "long_term"
    | "monitoring"
    | "event_based";

export type BoardStatus = "online" | "offline";

/** Board (target device) — matches board_to_json() */
export interface Board {
    id: string;
    name: string;
    hostname: string;
    model: string;
    status: BoardStatus;
    first_seen: string;
    last_seen: string;
    os_version: string;
    hal_version: string;
    client_version: string;
}

/** Test run — matches run_to_json() */
export interface Run {
    id: string;
    name: string;
    description: string;
    mode: TestMode;
    status: RunStatus;
    baseline_flag: boolean;
    notes: string;
    error_message: string;
    created_at: string;
    created_by: string;
    started_at: string | null;
    ended_at: string | null;
    tags: Record<string, unknown>;
}

/** Individual result record — matches ResultRepository */
export interface Result {
    id: string;
    run_id: string;
    module_id: string;
    module_version: string;
    timestamp: string;
    mode: TestMode;
    status: "pass" | "fail" | "error" | "unknown";
    error_message: string;
    payload_type_url: string;
    payload: Record<string, unknown>;
}

export interface LogEntry {
    id: string;
    run_id: string | null;
    source: string;
    severity: string;
    timestamp: string;
    message: string;
    metadata: Record<string, unknown> | null;
}

export interface TestConfig {
    id: string;
    name: string;
    description: string;
    mode: TestMode;
    common_config: Record<string, unknown>;
    modules: ModuleConfig[];
    created_at: string;
    created_by: string;
    is_archived: boolean;
}

export interface ModuleConfig {
    id: string;
    enabled: boolean;
    config_payload: Record<string, unknown>;
    notes: string;
}

export interface OtaUpgrade {
    id: string;
    artifact_path: string;
    artifact_hash: string;
    from_version: string;
    to_version: string;
    status: "uploaded" | "pending" | "pushing" | "verifying" | "rebooting" | "completed" | "failed" | "rolled_back";
    progress: number;
    rolled_back_from: string | null;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: string;
    kind: string;
    payload: Record<string, unknown>;
    created_at: string;
    read_at: string | null;
}

// ── Request / Response shapes ─────────────────────────────────────────────

export interface CreateConfigInput {
    name: string;
    description?: string;
    mode: TestMode;
    common_config?: Record<string, unknown>;
    modules: ModuleConfig[];
}

export interface CreateRunInput {
    config_id: string;
    mode: TestMode;
    name?: string;
    description?: string;
}

/** One-shot helper used by the run-new page */
export interface ConfigureRunInput {
    name?: string;
    description?: string;
    mode: TestMode;
    modules: ModuleConfig[];
    common_config?: Record<string, unknown>;
}

export interface ConfigureRunResult {
    config_id: string;
    run_id: string;
    status: RunStatus;
}

export interface PaginatedRuns {
    runs: Run[];
    total: number;
}

export interface PaginatedResults {
    results: Result[];
    total: number;
}

// ── SSE live update events ────────────────────────────────────────────────

export interface RunStateEvent {
    type: "state";
    run_id: string;
    status: RunStatus;
}

export interface RunResultEvent {
    type: "result";
    run_id: string;
    result: Result;
}

export type RunSSEEvent = RunStateEvent | RunResultEvent;
