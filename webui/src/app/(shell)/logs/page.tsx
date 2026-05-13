"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRuns, useRunLogs } from "@/lib/api/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Search } from "lucide-react";
import type { LogEntry } from "@/lib/api/types";

const LEVEL_COLORS: Record<string, string> = {
    error: "text-red-400",
    warn: "text-yellow-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
    debug: "text-muted-foreground",
    ERROR: "text-red-400",
    WARN: "text-yellow-400",
    INFO: "text-blue-400",
    DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
    const { data: runs } = useRuns({ limit: 30 });
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [filter, setFilter] = useState("");
    const logsEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);

    const { data: logData } = useRunLogs(selectedRunId || null, {});

    const logs: LogEntry[] = logData ?? [];

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const filteredLogs = filter
        ? logs.filter(
            (l) =>
                (l.message ?? "").toLowerCase().includes(filter.toLowerCase()) ||
                (l.source ?? "").toLowerCase().includes(filter.toLowerCase())
        )
        : logs;

    const runList = runs?.runs ?? [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Log Viewer</h1>

            <div className="flex gap-3 flex-wrap">
                <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                    <SelectTrigger className="w-80">
                        <SelectValue placeholder="Select a run to view logs\u2026" />
                    </SelectTrigger>
                    <SelectContent>
                        {runList.map((run) => (
                            <SelectItem key={run.id} value={run.id}>
                                <span className="font-mono text-xs">{run.id.slice(0, 16)}</span>
                                <span className="ml-2 text-muted-foreground">{run.name}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter messages\u2026"
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="h-[60vh] overflow-y-auto bg-zinc-950 rounded-md font-mono text-xs p-4 space-y-0.5">
                        {!selectedRunId ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                                <Terminal className="h-5 w-5" />
                                <span>Select a run to view its logs</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                                <Terminal className="h-5 w-5" />
                                <span>No logs found</span>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-2 items-start">
                                    <span className="text-muted-foreground/50 shrink-0 tabular-nums">
                                        {log.timestamp ? new Date(log.timestamp).toISOString().slice(11, 23) : "—"}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`shrink-0 text-[10px] px-1 py-0 ${LEVEL_COLORS[log.severity] ?? "text-muted-foreground"}`}
                                    >
                                        {(log.severity ?? "info").toUpperCase().slice(0, 4)}
                                    </Badge>
                                    <span className="text-muted-foreground/70 shrink-0">{log.source}</span>
                                    <span className="text-zinc-100 break-all">{log.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
