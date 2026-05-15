// REST API types derived from Acadia-Server's actual JSON responses.
// Field names match Server C++ serializers exactly.
// Single canonical export point for all result-related types — import from here, not from generated/.

// ── Test result canonical types ────────────────────────────────────────────

/**
 * Six-valued test status matching HAL TestStatus enum.
 * Server emits uppercase strings. Any other value from the server renders as "UNKNOWN" in the UI.
 */
export type Status =
    | "PASS"
    | "FAIL"
    | "ERROR"
    | "TIMEOUT"
    | "SKIPPED"
    | "ABORTED";

/** Four-valued test severity matching HAL TestSeverity enum. */
export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

/**
 * Discriminated union matching HAL TypedValue oneof.
 * The `int` variant carries int64; values > Number.MAX_SAFE_INTEGER are lossy in JS.
 * All unwrapping must go through helpers in src/lib/value/typed.ts — never inline.
 */
export type TypedValue =
    | { type: "bool"; value: boolean }
    | { type: "int"; value: number }
    | { type: "double"; value: number }
    | { type: "string"; value: string };

/**
 * Individual test result — matches result_to_json() in RunsController.
 * Subtests are recursive (same shape).
 */
export interface TestResult {
    id: string;
    run_id: string;
    module_id: string;
    /** Server stores module_version as a string (version tag, not int). */
    module_version: string;
    test_id: string;
    name: string;
    /** Monotonically increasing within a run. Drives ordering, not arrival time. */
    sequence: number;
    /** ISO 8601 UTC. */
    timestamp: string;
    /** Nanoseconds (int64). Use formatDurationNs() for display. */
    duration_ns: number;
    /** Test execution mode. */
    mode: TestMode;
    status: Status;
    severity: Severity;
    /** Non-empty only when status ∈ {ERROR, TIMEOUT, ABORTED}. */
    error_message: string;
    /** Human-readable key-value explanation pairs. */
    reason: Record<string, string>;
    /** Measured numeric/typed values. */
    metrics: Record<string, TypedValue>;
    /** Environmental readings (MONITORING mode). */
    monitoring: Record<string, TypedValue>;
    /** Event payload fields (EVENT_BASED mode). */
    event: Record<string, TypedValue>;
    subtests: TestResult[];
    payload_type_url: string;
    payload_b64: string;
}

/** Backward-compat alias — migrating consumers should switch to TestResult. */
export type Result = TestResult;

// ── Matches Server runs.status CHECK constraint ────────────────────────────

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
    notes?: string;
    tags?: string[];
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
    results: TestResult[];
    total: number;
}

// ── Compare endpoint types ────────────────────────────────────────────────

export type CompareCategory =
    | "unchanged"
    | "improved"
    | "regressed"
    | "drifted"
    | "disappeared"
    | "appeared";

export interface MetricDiff {
    a: TypedValue | null;
    b: TypedValue | null;
    /** Numeric delta (b - a); null for non-numeric or missing. */
    delta: number | null;
}

/** One row in a run comparison — server-categorised. */
export interface CompareRow {
    module_id: string;
    test_id: string;
    name: string;
    status_a: Status | null;
    status_b: Status | null;
    severity_a: Severity | null;
    severity_b: Severity | null;
    category: CompareCategory;
    metrics_drift: Record<string, MetricDiff>;
}

export interface RunComparison {
    run_a_id: string;
    run_b_id: string;
    rows: CompareRow[];
}

// ── Module trend types ────────────────────────────────────────────────────

export interface TrendPoint {
    run_id: string;
    run_name: string;
    timestamp: string;
    value: number;
}

export interface TrendData {
    module_id: string;
    test_id: string;
    metric_key: string;
    source: "metrics" | "monitoring" | "event";
    points: TrendPoint[];
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
    result: TestResult;
}

export type RunSSEEvent = RunStateEvent | RunResultEvent;
