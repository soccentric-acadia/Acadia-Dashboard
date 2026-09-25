import { describe, it, expect } from "vitest";
import { initialLiveRunState, liveRunReducer, tallyResults } from "./reducer";
import type { LiveRunEvent, LiveResult } from "./types";

function result(partial: Partial<LiveResult> & { id: string }): LiveResult {
  return {
    id: partial.id,
    run_id: partial.run_id ?? "run-1",
    module_id: partial.module_id ?? "cpu",
    module_version: partial.module_version ?? "1.0.0",
    test_id: partial.test_id ?? "temp",
    name: partial.name ?? "CPU Temp",
    sequence: partial.sequence ?? 1,
    timestamp: partial.timestamp ?? "2026-07-28T12:00:00Z",
    duration_ns: partial.duration_ns ?? 2_000_000,
    status: partial.status ?? "PASS",
    severity: partial.severity ?? "INFO",
    mode: partial.mode ?? "single_shot",
    error_message: partial.error_message ?? "",
    reason: partial.reason ?? {},
    metrics: partial.metrics ?? {},
    monitoring: partial.monitoring ?? {},
    event: partial.event ?? {},
    parent_id: partial.parent_id ?? null,
  };
}

// The Server sends this once on connect (RunsController::events), carrying
// the full run row tagged with type: "state". There is no separate
// run.start/run.complete distinction on the wire — terminality is derived
// from the run's own status (see reducer.ts's "state" case).
const state = (status = "running"): LiveRunEvent => ({
  type: "state",
  run: {
    id: "run-1", name: "Run", mode: "single_shot", status,
    board_id: "board-1", started_at: "2026-07-28T12:00:00Z",
    ended_at: status === "completed" || status === "failed" ? "2026-07-28T12:00:05Z" : null,
    created_at: "2026-07-28T12:00:00Z", error_message: "",
  },
});

describe("liveRunReducer — state", () => {
  it("seeds run from the initial state event", () => {
    const s = liveRunReducer(initialLiveRunState(), state("running"));
    expect(s.run?.id).toBe("run-1");
    expect(s.terminal).toBe(false);
  });

  it("treats a replayed terminal state as terminal", () => {
    const s = liveRunReducer(initialLiveRunState(), state("completed"));
    expect(s.terminal).toBe(true);
    expect(s.terminalStatus).toBe("completed");
  });

  it("keeps the first terminal status across repeated state events", () => {
    let s = liveRunReducer(initialLiveRunState(), state("failed"));
    s = liveRunReducer(s, state("failed"));
    expect(s.terminal).toBe(true);
    expect(s.terminalStatus).toBe("failed");
  });
});

describe("liveRunReducer — result dedup (high-water mark)", () => {
  it("appends a new result and records its id", () => {
    let s = liveRunReducer(initialLiveRunState(), state("running"));
    s = liveRunReducer(s, { type: "result", ...result({ id: "r1", sequence: 1 }) });
    expect(s.results).toHaveLength(1);
    expect(s.results[0].id).toBe("r1");
    expect(s.seenResultIds.has("r1")).toBe(true);
  });

  it("drops a duplicate result id (reconnect replay)", () => {
    let s = liveRunReducer(initialLiveRunState(), state("running"));
    s = liveRunReducer(s, { type: "result", ...result({ id: "r1", sequence: 1 }) });
    // Reconnect: state replay + the same result row again.
    s = liveRunReducer(s, state("running"));
    s = liveRunReducer(s, { type: "result", ...result({ id: "r1", sequence: 1 }) });
    expect(s.results).toHaveLength(1);
    expect(s.seenResultIds.size).toBe(1);
  });

  it("keeps results with distinct ids", () => {
    let s = liveRunReducer(initialLiveRunState(), state("running"));
    s = liveRunReducer(s, { type: "result", ...result({ id: "r1", sequence: 1 }) });
    s = liveRunReducer(s, { type: "result", ...result({ id: "r2", sequence: 2 }) });
    expect(s.results.map((r) => r.id)).toEqual(["r2", "r1"]);
  });

  it("auto-creates a module as running when a new module's result arrives", () => {
    let s = liveRunReducer(initialLiveRunState(), state("running"));
    s = liveRunReducer(s, { type: "result", ...result({ id: "r1", module_id: "mem" }) });
    expect(s.modules.mem).toBe("running");
    expect(s.moduleOrder).toContain("mem");
  });
});

describe("tallyResults", () => {
  it("counts pass vs fail/error/abort/timeout", () => {
    const rs = [
      result({ id: "1", status: "PASS" }),
      result({ id: "2", status: "FAIL" }),
      result({ id: "3", status: "ERROR" }),
      result({ id: "4", status: "TIMEOUT" }),
      result({ id: "5", status: "SKIPPED" }),
    ];
    expect(tallyResults(rs)).toEqual({ total: 5, passed: 1, failed: 3 });
  });
});
