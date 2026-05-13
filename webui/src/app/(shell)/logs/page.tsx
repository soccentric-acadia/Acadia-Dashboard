"use client";

import { useState, useEffect, useRef } from "react";
import { useRuns } from "@/lib/api/queries";
import { getWSClient } from "@/lib/api/ws";
import { getModuleLabel } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import type { WSLogLine } from "@/lib/api/ws";
import { Terminal, Search } from "lucide-react";

const LEVEL_COLORS: Record<string, string> = {
    ERROR: "text-red-400",
    WARN: "text-yellow-400",
    INFO: "text-blue-400",
    DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
    const { data: runs } = useRuns({ limit: 20 });
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [logs, setLogs] = useState<WSLogLine[]>([]);
    const [filter, setFilter] = useState("");
    const logsEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);

    // Switch subscription when selected run changes
    useEffect(() => {
        if (!selectedRunId) return;
        const ws = getWSClient();
        setLogs([]);

        const handleLog = (log: WSLogLine) => {
            if (log.runId === selectedRunId) {
                setLogs((prev) => [...prev.slice(-5000), log]);
            }
        };
        ws.on("log_line", handleLog);
        ws.subscribe(selectedRunId);

        return () => {
            ws.off("log_line", handleLog);
            ws.unsubscribe(selectedRunId);
        };
    }, [selectedRunId]);

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const activeRuns = runs?.edges ?? [];
    const filteredLogs = filter
        ? logs.filter(
            (l) =>
                (l.message ?? l.text).toLowerCase().includes(filter.toLowerCase()) ||
                l.source.toLowerCase().includes(filter.toLowerCase())
        )
        : logs;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Log Viewer</h1>

            <div className="flex gap-3 flex-wrap">
                <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                    <SelectTrigger className="w-80">
                        <SelectValue placeholder="Select a run to tail logs…" />
                    </SelectTrigger>
                    <SelectContent>
                        {activeRuns.map(({ node }) => (
                            <SelectItem key={node.runId} value={node.runId}>
                                <span className="font-mono text-xs">{node.runId.slice(0, 16)}</span>
                                <span className="ml-2 text-muted-foreground">{getModuleLabel(node.moduleId)}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter logs…"
                        className="pl-8 w-64"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <Button variant="outline" size="sm" onClick={() => setLogs([])}>
                    Clear
                </Button>

                {logs.length > 0 && (
                    <Badge variant="secondary">{logs.length} lines</Badge>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="h-[600px] overflow-y-auto font-mono text-xs p-3 bg-muted/30 rounded-md space-y-0.5">
                        {!selectedRunId ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                                <Terminal className="h-12 w-12" />
                                <p>Select a run to view its logs</p>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                                <p>{filter ? "No logs match your filter." : "Waiting for log lines…"}</p>
                            </div>
                        ) : (
                            filteredLogs.map((log, i) => (
                                <div key={i} className="flex gap-2 items-start leading-5">
                                    <span className="text-muted-foreground shrink-0">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className={`shrink-0 w-12 ${LEVEL_COLORS[log.level as string] ?? ""}`}>
                                        {log.level}
                                    </span>
                                    <span className="shrink-0 text-muted-foreground">[{log.source}]</span>
                                    <span className="break-all">{log.message ?? log.text}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </CardContent>
            </Card>

            {selectedRunId && (
                <p className="text-xs text-muted-foreground">
                    Viewing live logs for run{" "}
                    <Link href={`/runs/${selectedRunId}`} className="underline font-mono">
                        {selectedRunId.slice(0, 16)}
                    </Link>
                    . Open the run page to control the run.
                </p>
            )}
        </div>
    );
}
