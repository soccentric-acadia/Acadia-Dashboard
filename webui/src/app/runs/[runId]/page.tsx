"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRun, useStopRun } from "@/lib/api/queries";
import { getWSClient } from "@/lib/api/ws";
import { getModuleLabel, formatRelativeTime, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { ArrowLeft, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Run } from "@/lib/api/types";
import type { WSRunUpdate, WSLogLine } from "@/lib/api/ws";

const TERMINAL_RUNNING_STATES = new Set(["starting", "running", "paused", "stopping"]);

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
    const { runId } = use(params);
    const { data: run, isLoading, error } = useRun(runId);
    const stopRun = useStopRun();

    const [liveState, setLiveState] = useState<Partial<Run> | null>(null);
    const [logs, setLogs] = useState<WSLogLine[]>([]);
    const logsEndRef = useRef<HTMLDivElement | null>(null);

    const isLive = TERMINAL_RUNNING_STATES.has(liveState?.state ?? run?.state ?? "");

    // WebSocket subscription
    useEffect(() => {
        if (!runId) return;
        const ws = getWSClient();

        const handleUpdate = (update: WSRunUpdate) => {
            if (update.runId === runId) {
                setLiveState((prev) => ({ ...prev, ...(update as unknown as Partial<Run>) }));
            }
        };
        const handleLog = (log: WSLogLine) => {
            if (log.runId === runId) {
                setLogs((prev) => [...prev.slice(-2000), log]); // keep last 2000 lines
            }
        };

        ws.on("run_update", handleUpdate);
        ws.on("log_line", handleLog);
        ws.subscribe(runId);

        return () => {
            ws.off("run_update", handleUpdate);
            ws.off("log_line", handleLog);
            ws.unsubscribe(runId);
        };
    }, [runId]);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleStop = async () => {
        try {
            await stopRun.mutateAsync(runId);
            toast.success("Run stop requested");
        } catch (err) {
            toast.error(`Stop failed: ${(err as Error).message}`);
        }
    };

    const displayRun = { ...run, ...liveState } as Run | null;

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (error || !displayRun) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load run: {(error as Error)?.message ?? "Not found"}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/runs"><ArrowLeft className="mr-2 h-4 w-4" />Runs</Link>
                </Button>
                <h1 className="text-xl font-bold font-mono">{runId.slice(0, 20)}…</h1>
                <RunStateBadge state={displayRun.state} />
                {isLive && (
                    <Badge variant="outline" className="animate-pulse text-xs text-green-500 border-green-500">
                        ● live
                    </Badge>
                )}
            </div>

            {/* Controls */}
            {isLive && (
                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleStop}
                        disabled={stopRun.isPending}
                    >
                        <Square className="mr-2 h-4 w-4" />
                        Stop run
                    </Button>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Module" value={getModuleLabel(displayRun.moduleId)} />
                <StatCard label="Target" value={displayRun.client?.hostname ?? displayRun.client?.clientId?.slice(0, 16) ?? "—"} />
                <StatCard label="Started" value={displayRun.startedAt ? formatRelativeTime(displayRun.startedAt) : "—"} />
                <StatCard
                    label="Duration"
                    value={
                        displayRun.startedAt
                            ? formatDuration(
                                (displayRun.completedAt
                                    ? new Date(displayRun.completedAt)
                                    : new Date()
                                ).getTime() - new Date(displayRun.startedAt).getTime()
                            )
                            : "—"
                    }
                />
            </div>

            {/* Main tabs */}
            <Tabs defaultValue="results">
                <TabsList>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="logs">Logs{logs.length > 0 ? ` (${logs.length})` : ""}</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-4">
                    <ResultsPanel run={displayRun} />
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <LogsPanel logs={logs} logsEndRef={logsEndRef} />
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                    <Card>
                        <CardContent className="pt-4">
                            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-muted rounded p-3">
                                {JSON.stringify(displayRun.config ?? {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm font-medium">{value}</div>
            </CardContent>
        </Card>
    );
}

function ResultsPanel({ run }: { run: Run }) {
    const batches = run.resultBatches?.edges ?? [];
    if (!batches.length) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {TERMINAL_RUNNING_STATES.has(run.state) ? "Waiting for results…" : "No results recorded."}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-3">
            {batches.map(({ node }) => (
                <Card key={node.batchId}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-mono">{node.batchId.slice(0, 12)}</CardTitle>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(node.createdAt)}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-muted rounded p-3">
                            {JSON.stringify(node.payload ?? {}, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function LogsPanel({
    logs,
    logsEndRef,
}: {
    logs: WSLogLine[];
    logsEndRef: React.RefObject<HTMLDivElement | null>;
}) {
    const LEVEL_COLORS: Record<string, string> = {
        ERROR: "text-red-400",
        WARN: "text-yellow-400",
        INFO: "text-blue-400",
        DEBUG: "text-muted-foreground",
    };

    if (!logs.length) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No log lines received yet.
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardContent className="p-0">
                <div className="h-[500px] overflow-y-auto font-mono text-xs p-3 space-y-0.5">
                    {logs.map((log, i) => (
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
                    ))}
                    <div ref={logsEndRef as React.RefObject<HTMLDivElement>} />
                </div>
            </CardContent>
        </Card>
    );
}
