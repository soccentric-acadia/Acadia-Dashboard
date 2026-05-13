// Acadia SSE (Server-Sent Events) client replacing the previous WebSocket client.
// The server exposes SSE at GET /api/v1/runs/{id}/events for run status events.

import type { RunSSEEvent } from "./types";

type EventHandler = (event: RunSSEEvent) => void;

class AcadiaSSE {
    private sources: Map<string, EventSource> = new Map();
    private handlers: EventHandler[] = [];
    private base: string;

    constructor() {
        this.base = typeof window !== "undefined"
            ? (process.env.NEXT_PUBLIC_API_BASE ?? "")
            : "";
    }

    /** Subscribe to live events for a run. Opens an SSE connection. */
    subscribe(runId: string): void {
        if (this.sources.has(runId)) return; // already subscribed
        const url = `${this.base}/api/v1/runs/${encodeURIComponent(runId)}/events`;
        const es = new EventSource(url, { withCredentials: true });

        es.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data) as RunSSEEvent;
                this.handlers.forEach((h) => h(data));
            } catch { /* ignore malformed events */ }
        };

        es.onerror = () => {
            // EventSource retries automatically; no manual reconnect needed.
        };

        this.sources.set(runId, es);
    }

    /** Unsubscribe from live events for a run. Closes the SSE connection. */
    unsubscribe(runId: string): void {
        const es = this.sources.get(runId);
        if (es) {
            es.close();
            this.sources.delete(runId);
        }
    }

    on(handler: EventHandler): void {
        this.handlers.push(handler);
    }

    off(handler: EventHandler): void {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    /** Close all open connections (e.g., on unmount). */
    closeAll(): void {
        this.sources.forEach((es) => es.close());
        this.sources.clear();
    }
}

// Singleton instance — reused across the app.
let _sseClient: AcadiaSSE | null = null;

export function getSSEClient(): AcadiaSSE {
    if (!_sseClient) _sseClient = new AcadiaSSE();
    return _sseClient;
}

// Legacy alias — keeps existing import sites working during transition.
export const getWSClient = getSSEClient;

export type { RunSSEEvent };
