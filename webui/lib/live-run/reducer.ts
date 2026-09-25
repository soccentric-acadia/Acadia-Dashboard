/**
 * Pure reducer for the live-run SSE stream. Kept side-effect-free so the dedup
 * (high-water mark of result ids) and terminal-state logic are unit-testable in
 * Node without a browser EventSource. The React hook (useLiveRunStream) wraps
 * this reducer and owns the EventSource lifecycle + reconnect behaviour.
 */
import {
  type LiveRunEvent,
  type LiveRunState,
  type LiveResult,
  isTerminalRunStatus,
} from "./types";

export function initialLiveRunState(): LiveRunState {
  return {
    run: null,
    modules: {},
    moduleOrder: [],
    results: [],
    seenResultIds: new Set<string>(),
    terminal: false,
    terminalStatus: null,
    flowPaused: false,
    lastEventSeq: 0,
  };
}

/**
 * Apply one parsed SSE event to the state. Returns a NEW state object (the
 * `seenResultIds` Set is copied-on-write so React state updates are detected).
 * Duplicate `result` events (id already in the high-water set) are dropped.
 */
export function liveRunReducer(
  state: LiveRunState,
  event: LiveRunEvent,
): LiveRunState {
  switch (event.type) {
    case "state": {
      // Sent once on connect today (see types.ts docstring — the Server has
      // no push for later status changes yet). A terminal status here means
      // either a replay of an already-finished run, or — once that push
      // exists — a live transition to terminal.
      return {
        ...state,
        run: event.run,
        terminal: state.terminal || isTerminalRunStatus(event.run?.status),
        terminalStatus:
          state.terminalStatus ??
          (isTerminalRunStatus(event.run?.status) ? event.run.status : null),
      };
    }

    case "result": {
      // Dedup by result id (high-water mark). A reconnect replays already-landed
      // rows; drop them so the list doesn't duplicate.
      if (state.seenResultIds.has(event.id)) {
        return state;
      }
      const result: LiveResult = {
        id: event.id,
        run_id: event.run_id,
        module_id: event.module_id,
        module_version: event.module_version,
        test_id: event.test_id,
        name: event.name,
        sequence: event.sequence,
        timestamp: event.timestamp,
        duration_ns: event.duration_ns,
        status: event.status,
        severity: event.severity,
        mode: event.mode,
        error_message: event.error_message,
        reason: event.reason,
        metrics: event.metrics,
        monitoring: event.monitoring,
        event: event.event,
        parent_id: event.parent_id,
      };
      const seen = new Set(state.seenResultIds);
      seen.add(event.id);
      // Newest first (the live list reads top-down).
      const results = [result, ...state.results];
      const modules = { ...state.modules };
      const moduleOrder = [...state.moduleOrder];
      if (!(event.module_id in modules)) {
        modules[event.module_id] = "running";
        moduleOrder.push(event.module_id);
      }
      return {
        ...state,
        results,
        seenResultIds: seen,
        modules,
        moduleOrder,
        lastEventSeq: Math.max(state.lastEventSeq, event.sequence),
      };
    }

    default: {
      return state;
    }
  }
}

/** Running pass/fail tally from the accumulated results. */
export function tallyResults(results: LiveResult[]): {
  total: number;
  passed: number;
  failed: number;
} {
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const s = r.status.toLowerCase();
    if (s.includes("pass")) ++passed;
    else if (s.includes("fail") || s.includes("error") || s.includes("abort") || s.includes("timeout")) ++failed;
  }
  return { total: results.length, passed, failed };
}