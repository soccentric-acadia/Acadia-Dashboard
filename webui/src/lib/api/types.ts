// GraphQL types derived from the server schema (Acadia-Server/req.md)
// These are hand-maintained until the server is running and codegen can be set up.

export type RunState =
    | "configuring"
    | "ready"
    | "running"
    | "paused"
    | "stopped"
    | "completed"
    | "failed"
    | "disconnected";

export type TestMode = "single_shot" | "long_term" | "monitoring" | "event_based";

export interface Client {
    clientId: string;
    hostname: string | null;
    halVersion: string | null;
    clientVersion: string | null;
    firstSeen: string; // ISO timestamp
    lastSeen: string;
    isConnected: boolean;
    runs: RunConnection;
}

export interface Run {
    runId: string;
    client: Client;
    moduleId: string;
    mode: TestMode;
    state: RunState;
    config: Record<string, unknown>;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    completedAt: string | null; // alias for endedAt populated by server
    lastBatchAt: string | null;
    passFail: boolean | null;
    errorMessage: string | null;
    batchCount: number;
    sampleCount: number;
    resultBatches: ResultBatchConnection;
    logs: LogConnection;
}

export interface ResultBatch {
    runId: string;
    batchId: string; // UUID alias used in display
    batchSeq: number;
    receivedAt: string;
    createdAt: string; // alias for receivedAt
    tsFirst: string;
    tsLast: string;
    sampleCount: number;
    primaryValue: number | null;
    passFail: boolean | null;
    tags: Record<string, unknown> | null;
    payload: Record<string, unknown>; // decoded JSON
}

export interface LogLine {
    runId: string | null;
    source: string;
    seq: number;
    timestamp: string;
    level: string | null;
    text: string;
}

export interface ModuleSetting {
    clientId: string;
    moduleId: string;
    enabled: boolean;
}

export interface RunConnection {
    edges: Array<{ node: Run; cursor: string }>;
    pageInfo: PageInfo;
}

export interface ResultBatchConnection {
    edges: Array<{ node: ResultBatch; cursor: string }>;
    pageInfo: PageInfo;
}

export interface LogConnection {
    edges: Array<{ node: LogLine; cursor: string }>;
    pageInfo: PageInfo;
}

export interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

export interface ConfigureRunInput {
    clientId: string;
    moduleId: string;
    mode: TestMode;
    config: Record<string, unknown>;
}

export interface ConfigureRunResult {
    runId: string;
    state: RunState;
}

export interface RunUpdate {
    runId: string;
    state?: RunState;
    batch?: ResultBatch;
}
