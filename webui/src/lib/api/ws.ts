// WebSocket subscription client for live run updates and log streaming.
// The server uses a custom protocol: send {subscribe:[runIds]}, receive tagged messages.

export interface WSRunUpdate {
    type: "run_update";
    runId: string;
    state?: string;
    batch?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface WSLogLine {
    type: "log";
    runId: string;
    source: string;
    seq: number;
    timestamp: string;
    level: string;
    text: string;
    /** alias - server may send either 'text' or 'message' */
    message?: string;
}

type WSMessage = WSRunUpdate | WSLogLine;

// "log_line" is an alias for the server's "log" message type
type EventType = "run_update" | "log_line";
type WSMessageByEvent<T extends EventType> =
    T extends "run_update" ? WSRunUpdate :
    T extends "log_line" ? WSLogLine :
    never;

type Listener = (msg: WSMessage) => void;

class AcadiaWS {
    private ws: WebSocket | null = null;
    private listeners = new Set<Listener>();
    private subscriptions = new Set<string>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
        try {
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
                if (this.subscriptions.size > 0) {
                    this.send({ subscribe: Array.from(this.subscriptions) });
                }
            };
            this.ws.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data as string) as WSMessage;
                    this.listeners.forEach((l) => l(msg));
                } catch {
                    // ignore malformed messages
                }
            };
            this.ws.onclose = () => {
                this.reconnectTimer = setTimeout(() => this.connect(), 3000);
            };
            this.ws.onerror = () => {
                this.ws?.close();
            };
        } catch {
            this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
    }

    subscribe(runId: string | string[]) {
        const ids = Array.isArray(runId) ? runId : [runId];
        ids.forEach((id) => this.subscriptions.add(id));
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ subscribe: ids });
        }
    }

    unsubscribe(runId: string | string[]) {
        const ids = Array.isArray(runId) ? runId : [runId];
        ids.forEach((id) => this.subscriptions.delete(id));
    }

    addListener(listener: Listener) {
        this.listeners.add(listener);
    }

    removeListener(listener: Listener) {
        this.listeners.delete(listener);
    }

    on<T extends EventType>(
        event: T,
        handler: (msg: WSMessageByEvent<T>) => void
    ) {
        const serverType = event === "log_line" ? "log" : event;
        const wrapped: Listener = (msg) => {
            if (msg.type === serverType) handler(msg as WSMessageByEvent<T>);
        };
        (handler as { _wrapped?: Listener })._wrapped = wrapped;
        this.listeners.add(wrapped);
    }

    off<T extends EventType>(
        event: T,
        handler: (msg: WSMessageByEvent<T>) => void
    ) {
        const wrapped = (handler as { _wrapped?: Listener })._wrapped;
        if (wrapped) this.listeners.delete(wrapped);
    }

    private send(payload: unknown) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }
}

let _wsInstance: AcadiaWS | null = null;

export function getWSClient(): AcadiaWS {
    if (!_wsInstance) {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080")
            .replace(/^http/, "ws");
        _wsInstance = new AcadiaWS(`${base}/ws`);
    }
    return _wsInstance;
}
