/**
 * useLiveRunStream — React hook that consumes the live-run SSE stream.
 *
 * Opens an EventSource to `GET /api/v1/runs/{run_id}/events` (the Server's
 * actual live-run endpoint — see RunsController::events; this used to point
 * at a nonexistent `/stream` path, DSH-001/VB-5), parses each event payload,
 * and folds it through the pure `liveRunReducer` (see ./reducer.ts). Owns the
 * EventSource lifecycle and surfaces a coarse connection status for the UI.
 *
 * Returns `{ state, connection }`:
 *   - `state`      — the current `LiveRunState` (run, modules, results, terminal…)
 *   - `connection` — `"connecting" | "open" | "closed"`
 *
 * The server sends named SSE events (`event: state`, `event: result`), not
 * the unnamed default `message` event — EventSource only fires `onmessage`
 * for that default, so each named event needs its own `addEventListener`.
 * The server replays current state on (re)connect: one `state` event plus a
 * `result` event per already-landed row; the reducer's high-water mark of
 * result ids dedups replayed rows so a reconnect resumes cleanly.
 */
"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { apiUrl } from "@/lib/api/client";
import {
  type LiveRunEvent,
  type LiveRunState,
} from "./types";
import { initialLiveRunState, liveRunReducer } from "./reducer";

export type LiveRunConnection = "connecting" | "open" | "closed";

export interface UseLiveRunStreamResult {
  state: LiveRunState;
  connection: LiveRunConnection;
}

/**
 * Parse one SSE `data:` payload for a given named SSE event into a
 * `LiveRunEvent`, tagging it with that event name since only the `state`
 * payload carries its own `type` field (`result` payloads don't — see
 * types.ts). Malformed payloads are dropped (never crash the stream).
 */
function parseEvent(sseEventName: string, raw: string): LiveRunEvent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return { ...parsed, type: sseEventName } as LiveRunEvent;
    }
  } catch {
    // ignore malformed frames
  }
  return null;
}

export function useLiveRunStream(runId: string): UseLiveRunStreamResult {
  const [state, dispatch] = useReducer(liveRunReducer, undefined, initialLiveRunState);
  const [connection, setConnection] = useState<LiveRunConnection>("connecting");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!runId) {
      setConnection("closed");
      return;
    }

    setConnection("connecting");
    const es = new EventSource(apiUrl(`/api/v1/runs/${encodeURIComponent(runId)}/events`));
    esRef.current = es;

    es.onopen = () => setConnection("open");
    es.onerror = () => {
      // EventSource auto-reconnects; surface the transient state to the UI.
      setConnection("closed");
    };

    const onNamedEvent = (sseEventName: string) => (ev: MessageEvent<string>) => {
      const event = parseEvent(sseEventName, ev.data);
      if (event) dispatch(event);
    };
    es.addEventListener("state", onNamedEvent("state"));
    es.addEventListener("result", onNamedEvent("result"));

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [runId]);

  return { state, connection };
}
