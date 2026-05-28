"use client";

import clsx from "clsx";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGlobalLogs } from "@/lib/api";
import { parseSsePayload, openSse } from "@/lib/sse";
import type { LogEntry } from "@/lib/types/api";
import { useAppShell } from "@/state/app-shell-context";

const levels = ["", "debug", "info", "warn", "error", "fatal"];

function tone(level: string) {
    const normalized = level.toLowerCase();
    if (normalized.includes("fatal") || normalized.includes("error")) return "text-rose-600 dark:text-rose-300";
    if (normalized.includes("warn")) return "text-amber-600 dark:text-amber-300";
    return "text-zinc-600 dark:text-zinc-300";
}

export default function LogsPage() {
    const { activeRunId } = useAppShell();
    const [source, setSource] = useState("");
    const [level, setLevel] = useState("");
    const [query, setQuery] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data } = useQuery({
        queryKey: ["logs", source, level, query],
        queryFn: () => getGlobalLogs({ source, level, query, limit: 300 }),
        refetchInterval: 15_000,
    });

    useEffect(() => {
        if (!activeRunId) return;
        const sourceStream = openSse(`/api/v1/runs/${activeRunId}/logs/tail`);
        sourceStream.addEventListener("log", (event) => {
            const payload = parseSsePayload<LogEntry>((event as MessageEvent).data);
            if (payload) setLiveLogs((prev) => [...prev, payload].slice(-500));
        });
        sourceStream.onerror = () => sourceStream.close();
        return () => sourceStream.close();
    }, [activeRunId]);

    const logs = useMemo(() => {
        const combined = [...(data?.logs ?? []), ...liveLogs];
        const seen = new Set<string>();
        return combined
            .filter((entry) => {
                const id = entry.id || `${entry.timestamp}-${entry.message}`;
                if (seen.has(id)) return false;
                seen.add(id);
                if (source && entry.source !== source) return false;
                if (level && entry.level !== level && entry.severity !== level) return false;
                if (query && !entry.message.toLowerCase().includes(query.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [data?.logs, level, liveLogs, query, source]);

    const sources = useMemo(() => Array.from(new Set(logs.map((entry) => entry.source).filter(Boolean))).sort(), [logs]);

    useEffect(() => {
        if (autoScroll) bottomRef.current?.scrollIntoView({ block: "end" });
    }, [autoScroll, logs.length]);

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-white/50 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/55">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Logs</h1>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Live tail plus server-side log history.</p>
                    </div>
                    <button type="button" onClick={() => setAutoScroll((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                        {autoScroll ? <Pause size={16} /> : <Play size={16} />}
                        {autoScroll ? "Pause auto-scroll" : "Resume auto-scroll"}
                    </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_1fr]">
                    <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="">All sources</option>
                        {sources.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                        {levels.map((item) => <option key={item || "all"} value={item}>{item || "All severities"}</option>)}
                    </select>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search log text" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
                </div>
            </section>

            <section className="h-[calc(100vh-15rem)] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 shadow-sm dark:border-white/10">
                {logs.map((entry) => (
                    <div key={entry.id || `${entry.timestamp}-${entry.message}`} className="grid grid-cols-[9rem_7rem_6rem_1fr] gap-3 border-b border-white/5 py-1">
                        <span className="text-zinc-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "--:--:--"}</span>
                        <span className="text-sky-300">{entry.source || "system"}</span>
                        <span className={clsx("font-semibold", tone(entry.level || entry.severity))}>{entry.level || entry.severity || "info"}</span>
                        <span>{entry.message}</span>
                    </div>
                ))}
                {logs.length === 0 && <div className="grid h-full place-items-center text-zinc-500">No log entries match the current filters.</div>}
                <div ref={bottomRef} />
            </section>
        </div>
    );
}