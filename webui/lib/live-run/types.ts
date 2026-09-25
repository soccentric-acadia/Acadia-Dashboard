/**
 * Live-run SSE event contract — mirrors Acadia-Server's
 * `GET /api/v1/runs/{run_id}/events` (see
 * Acadia-Server/src/rest_api/controllers/RunsController.cc, `events()`).
 *
 * This previously documented a `run.start`/`module.transition`/`run.complete`/
 * `flow.paused` vocabulary the Server never actually implements (DSH-001);
 * the real contract is two named SSE events:
 *   - `state`  : the full run row (see LiveRun) plus `type: "state"`. Sent
 *                once on connect. The Server has no push for later status
 *                changes yet (improvements.md DSH-001 follow-up) — a run
 *                that finishes while a viewer is connected will not update
 *                that viewer's terminal banner until they reconnect.
 *   - `result` : a result row (see LiveResult), with no `type` field of its
 *                own — the client tags it from the SSE event name.
 *
 * There is no module-list or per-module "transition" event: `moduleOrder`/
 * `modules` are derived client-side, purely from which `module_id`s have
 * landed a result (see reducer.ts). A module a run intends to execute but
 * that hasn't reported a result yet will not appear in the list.
 *
 * On (re)connect the server replays current state: one `state` event + a
 * `result` event per already-landed top-level row. The client dedups result
 * events by id (high-water mark) so a reconnect resumes without duplication.
 */

export type RunStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "rejected"
  | "unspecified"
  | string;

export interface LiveRun {
  id: string;
  name: string;
  mode: string;
  status: RunStatus;
  // Not emitted by run_to_json on the Server today (V-D04: runs have no
  // board_id column yet) — always undefined in practice until that lands.
  board_id?: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
  error_message: string;
}

export interface LiveResult {
  id: string;
  run_id: string;
  module_id: string;
  module_version: string;
  test_id: string;
  name: string;
  sequence: number;
  timestamp: string | null;
  duration_ns: number;
  status: string; // uppercase: PASS | FAIL | ERROR | TIMEOUT | ABORTED | SKIPPED
  severity: string;
  mode: string;
  error_message: string;
  reason: Record<string, unknown>;
  metrics: Record<string, unknown>;
  monitoring: Record<string, unknown>;
  event: Record<string, unknown>;
  // Not emitted by result_to_json on the Server — always null in practice.
  parent_id: string | null;
}

/** Sent once on connect (see the module docstring for the "no later push" gap). */
export interface StateEvent {
  type: "state";
  run: LiveRun;
}

export type ResultEvent = {
  type: "result";
  // All LiveResult fields are spread at the top level of the payload.
} & LiveResult;

export type LiveRunEvent = StateEvent | ResultEvent;

export type ModuleState = "pending" | "running" | "done";

export interface LiveRunState {
  run: LiveRun | null;
  modules: Record<string, ModuleState>;
  moduleOrder: string[];
  results: LiveResult[];
  /** High-water mark of result ids — a reconnect replays already-seen rows,
   *  which the reducer drops to avoid duplication. */
  seenResultIds: Set<string>;
  terminal: boolean;
  terminalStatus: RunStatus | null;
  flowPaused: boolean;
  lastEventSeq: number;
}

export const TERMINAL_RUN_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "failed",
  "cancelled",
  "rejected",
]);

export function isTerminalRunStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return TERMINAL_RUN_STATUSES.has(status.toLowerCase());
}