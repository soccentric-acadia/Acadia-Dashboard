"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRun, useCancelRun, usePauseRun, useResumeRun, useRunResults, useRunLogs } from "@/lib/api/queries";
import { getModuleLabel, formatRelativeTime, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { ArrowLeft, Square, PauseCircle, PlayCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Run, Result, LogEntry, RunStatus } from "@/lib/api/types";

const ACTIVE_STATUSES = new Set<RunStatus>(["queued", "running", "paused"]);

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
    const { runId } = use(params);
    const { data: run, isLoading, error } = useRun(runId);
    const cancelRun = useCancelRun();
    const pauseRun  = usePauseRun();
    const resumeRun = useResumeRun();
    const { data: resultsPage } = useRunResults(runId);
    const { data: logs } = useRunLogs(runId);

    const logsEndRef = useRef<HTMLDivElement | null>(null);

    const isActive = ACTIVE_STATUSES.has(run?.status as RunStatus);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleCancel = async () => {
        try {
            await cancelRun.mutateAsync(runId);
            toast.success("Run cancelled");
        } catch (err) {
            toast.error(`Cancel failed: ${(err as Error).message}`);
        }
    };

    const handlePause = async () => {
        try {
            await pauseRun.mutateAsync(runId);
            toast.success("Run paused");
        } catch (err) {
            toast.error(`Pause failed: ${(err as Error).message}`);
        }
    };

    const handleResume = async () => {
        try {
            await resumeRun.mutateAsync(runId);
            toast.success("Run resumed");
        } catch (err) {
            toast.error(`Resume failed: ${(err as Error).message}`);
        }
    };

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (error || !run) return (
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
                <h1 className="text-xl font-bold font-mono">
                    {run.name || runId.slice(0, 20) + "\u2026"}
                </h1>
                <RunStateBadge state={run.status} />
                {isActive && (
                    <Badge variant="outline" className="animate-pulse text-xs text-green-500 border-green-500">
                        \u25cf live
                    </Badge>
                )}
            </div>

            {/* Controls */}
            {isActive && (
                <div className="flex gap-2">
                    {run.status === "running" && (
                        <Button variant="outline" size="sm" onClick={handlePause} disabled={pauseRun.isPending}>
                            <PauseCircle className="mr-2 h-4 w-4" />Pause
                        </Button>
                    )}
                    {run.status === "paused" && (
                        <Button variant="outline" size="sm" onClick={handleResume} disabled={resumeRun.isPending}>
                            <PlayCircle className="mr-2 h-4 w-4" />Resume
                        </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelRun.isPending}>
                        <Square className="mr-2 h-4 w-4" />Cancel
                    </Button>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Mode"    value={run.mode} />
                <StatCard label="Status"  value={run.status} />
                <StatCard label="Started" value={run.started_at ? formatRelativeTime(run.started_at) : "\u2014"} />
                <StatCard
                    label="Duration"
                    value={
                        run.started_at
                            ? formatDuration(
                                (run.ended_at
                                    ? new Date(run.ended_at)
                                    : new Date()
                                ).getTime() - new Date(run.started_at).getTime()
                            )
                            : "\u2014"
                    }
                />
            </div>

            {/* Main tabs */}
            <Tabs defaultValue="results">
                <TabsList>
                    <TabsTrigger value="results">Results ({resultsPage?.total ?? 0})</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-4">
                    <ResultsPanel results={resultsPage?.results ?? []} isActive={isActive} />
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <LogsPanel logs={logs ?? []} logsEndRef={logsEndRef} />
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                    <Card>
                        <CardContent className="pt-4">
                            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-muted rounded p-3">
                                {JSON.stringify(run, null, 2)}
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
                <div className="text-sm font-medium capitalize">{value}</div>
            </CardContent>
        </Card>
    );
}

function ResultsPanel({ results, isActive }: { results: Result[]; isActive: boolean }) {
    if (!results.length) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {isActive ? "Waiting for results\u2026" : "No results recorded."}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-3">
            {results.map((r) => (
                <Card key={r.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                                {getModuleLabel(r.module_id)}
                                <span className="ml-2 text-xs text-muted-foreground font-mono">{r.id.slice(0, 12)}</span>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant={r.status === "pass" ? "success" : r.status === "fail" ? "destructive" : "secondary"} className="text-xs capitalize">
                                    {r.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{formatRelativeTime(r.timestamp)}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-muted rounded p-3">
                            {JSON.stringify(r.payload ?? {}, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function LogsPanel({ logs, logsEndRef }: { logs: LogEntry[]; logsEndRef: React.RefObject<HTMLDivElement | null> }) {
    const SEVERITY_COLORS: Record<string, string> = {
        ERROR: "text-red-400",
        WARN:  "text-yellow-400",
        INFO:  "text-blue-400",
        DEBUG: "text-muted-foreground",
    };

    if (!logs.length) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No log entries.
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
                            <span className={`shrink-0 w-12 ${SEVERITY_COLORS[log.severity?.toUpperCase() ?? ""] ?? ""}`}>
                                {log.severity}
                            </span>
                            <span className="shrink-0 text-muted-foreground">[{log.source}]</span>
                            <span className="break-all">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef as React.RefObject<HTMLDivElement>} />
                </div>
            </CardContent>
        </Card>
    );
}
