"use client";

import React, { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
    useRun,
    useCancelRun,
    usePauseRun,
    useResumeRun,
    useRunResults,
    useRunLogs,
    useRunSSE,
} from "@/lib/api/queries";
import { getModuleLabel, formatRelativeTime, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { ResultTable } from "@/components/results/result-table";
import { isFailureStatus, isUserCancelled } from "@/lib/status";
import { extractNumericSeries } from "@/lib/value/typed";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import {
    ArrowLeft, Square, PauseCircle, PlayCircle, AlertCircle, Flag,
    RotateCcw, Download, Trash2, BarChart2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setBaseline, rerunRun, deleteRun } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import type { TestResult, RunStatus, Status, LogEntry } from "@/lib/api/types";

const ACTIVE_STATUSES = new Set<RunStatus>(["queued", "running", "paused"]);
type ModuleSummaryStatus = "PASS" | "FAIL" | "NEVER" | "ABORTED";

function deriveModuleStatus(results: TestResult[]): ModuleSummaryStatus {
    if (results.length === 0) return "NEVER";
    const effective = results.filter((r) => r.status !== "SKIPPED");
    if (effective.length === 0) return "NEVER";
    const last = effective[effective.length - 1];
    if (last.status === "PASS") return "PASS";
    if (isUserCancelled(last.status as Status)) return "ABORTED";
    if (isFailureStatus(last.status as Status)) return "FAIL";
    return "NEVER";
}

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
    const { runId } = use(params);
    const { data: run, isLoading, error } = useRun(runId);
    const cancelRun = useCancelRun();
    const pauseRun = usePauseRun();
    const resumeRun = useResumeRun();
    const qc = useQueryClient();
    const router = useRouter();
    const isActive = ACTIVE_STATUSES.has(run?.status as RunStatus);
    useRunSSE(runId, isActive);

    const baselineMutation = useMutation({
        mutationFn: () => setBaseline(runId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["run", runId] }); toast.success("Set as baseline"); },
        onError: (e: Error) => toast.error(e.message),
    });
    const rerunMutation = useMutation({
        mutationFn: () => rerunRun(runId),
        onSuccess: (r) => { toast.success("Re-run created"); router.push(`/runs/${r.id}`); },
        onError: (e: Error) => toast.error(e.message),
    });
    const deleteMutation = useMutation({
        mutationFn: () => deleteRun(runId),
        onSuccess: () => { toast.success("Run deleted"); router.push("/runs"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleExport = () => {
        const url = `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/v1/runs/${encodeURIComponent(runId)}/export?format=csv`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `run-${runId.slice(0, 8)}.csv`;
        a.click();
    };

    const { data: resultsPage } = useRunResults(runId);
    const { data: logs } = useRunLogs(runId);

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

    const allResults = resultsPage?.results ?? [];
    const wasAborted = allResults.some((r) => r.status === "ABORTED");

    return (
        <div className="space-y-6">
            {(run.status === "cancelled" || wasAborted) && !isActive && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        {run.status === "cancelled"
                            ? "This run was cancelled. Results captured up to cancellation are shown below."
                            : "One or more tests were aborted. Partial results are shown."}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/runs"><ArrowLeft className="mr-2 h-4 w-4" />Runs</Link>
                </Button>
                <h1 className="text-xl font-bold font-mono">{run.name || runId.slice(0, 20) + "…"}</h1>
                <RunStateBadge state={run.status} />
                {isActive && (
                    <Badge variant="outline" className="animate-pulse text-xs text-green-500 border-green-500">
                        ● live
                    </Badge>
                )}
            </div>

            {isActive && (
                <div className="flex gap-2">
                    {run.status === "running" && (
                        <Button variant="outline" size="sm" disabled={pauseRun.isPending}
                            onClick={() => pauseRun.mutateAsync(runId).then(() => toast.success("Paused")).catch((e: Error) => toast.error(e.message))}>
                            <PauseCircle className="mr-2 h-4 w-4" />Pause
                        </Button>
                    )}
                    {run.status === "paused" && (
                        <Button variant="outline" size="sm" disabled={resumeRun.isPending}
                            onClick={() => resumeRun.mutateAsync(runId).then(() => toast.success("Resumed")).catch((e: Error) => toast.error(e.message))}>
                            <PlayCircle className="mr-2 h-4 w-4" />Resume
                        </Button>
                    )}
                    <Button variant="destructive" size="sm" disabled={cancelRun.isPending}
                        onClick={() => cancelRun.mutateAsync(runId).then(() => toast.success("Cancelled")).catch((e: Error) => toast.error(e.message))}>
                        <Square className="mr-2 h-4 w-4" />Cancel
                    </Button>
                </div>
            )}

            {!isActive && (
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={baselineMutation.isPending || !!run.baseline_flag} onClick={() => baselineMutation.mutate()}>
                        <Flag className="mr-2 h-4 w-4" />{run.baseline_flag ? "Baseline" : "Set as baseline"}
                    </Button>
                    <Button variant="outline" size="sm" disabled={rerunMutation.isPending} onClick={() => rerunMutation.mutate()}>
                        <RotateCcw className="mr-2 h-4 w-4" />Re-run
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />Export CSV
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 ml-auto" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                    </Button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Mode" value={run.mode} />
                <StatCard label="Status" value={<RunStateBadge state={run.status} />} />
                <StatCard label="Started" value={run.started_at ? formatRelativeTime(run.started_at) : "—"} />
                <StatCard label="Duration" value={run.started_at ? formatDuration((run.ended_at ? new Date(run.ended_at) : new Date()).getTime() - new Date(run.started_at).getTime()) : "—"} />
            </div>

            <Tabs defaultValue="results">
                <TabsList>
                    <TabsTrigger value="results">Results ({resultsPage?.total ?? 0})</TabsTrigger>
                    <TabsTrigger value="summary">Per-module summary</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                </TabsList>
                <TabsContent value="results" className="mt-4">
                    <ResultsTab results={allResults} isActive={isActive} />
                </TabsContent>
                <TabsContent value="summary" className="mt-4">
                    <ModuleSummaryTab results={allResults} runId={runId} />
                </TabsContent>
                <TabsContent value="logs" className="mt-4">
                    <LogsPanel logs={logs ?? []} />
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
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-sm font-medium capitalize">{value}</div></CardContent>
        </Card>
    );
}

const CHART_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

function ResultsTab({ results, isActive }: { results: TestResult[]; isActive: boolean }) {
    const [chartedKeys, setChartedKeys] = useState<Array<{ source: "metrics" | "monitoring" | "event"; key: string }>>([]);

    const addChartKey = useCallback((source: "metrics" | "monitoring" | "event", key: string) => {
        setChartedKeys((prev) => prev.some((e) => e.source === source && e.key === key) ? prev : [...prev, { source, key }]);
    }, []);

    const chartData = useMemo(() => {
        const bySeq = new Map<number, Record<string, number | undefined> & { sequence: number }>();
        for (const { source, key } of chartedKeys) {
            const seriesKey = source === "metrics" ? key : `${source}:${key}`;
            for (const pt of extractNumericSeries(results, source, key)) {
                const row = bySeq.get(pt.sequence) ?? { sequence: pt.sequence };
                row[seriesKey] = pt.value;
                bySeq.set(pt.sequence, row);
            }
        }
        return Array.from(bySeq.values()).sort((a, b) => a.sequence - b.sequence);
    }, [results, chartedKeys]);

    if (!results.length) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {isActive ? "Waiting for results…" : "No results recorded."}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            {chartedKeys.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="h-4 w-4" />Metrics chart</CardTitle>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setChartedKeys([])}><X className="h-3 w-3" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {chartedKeys.map(({ source, key }) => (
                                <Badge key={`${source}:${key}`} variant="secondary" className="text-xs gap-1">
                                    {source !== "metrics" && <span className="opacity-60">{source}:</span>}{key}
                                    <button onClick={() => setChartedKeys((p) => p.filter((e) => !(e.source === source && e.key === key)))} aria-label={`Remove ${key}`}>
                                        <X className="h-2.5 w-2.5 ml-0.5" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {chartData.length === 0
                            ? <p className="text-xs text-muted-foreground text-center py-4">No numeric data for the selected keys.</p>
                            : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="sequence" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <RechartTooltip contentStyle={{ fontSize: 11 }} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        {chartedKeys.map(({ source, key }, i) => (
                                            <Line key={`${source}:${key}`} type="monotone"
                                                dataKey={source === "metrics" ? key : `${source}:${key}`}
                                                name={key} stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                                dot={false} connectNulls />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )
                        }
                    </CardContent>
                </Card>
            )}
            <ResultTable results={results} onChartKey={addChartKey} />
        </div>
    );
}

function ModuleSummaryTab({ results, runId }: { results: TestResult[]; runId: string }) {
    const byModule = useMemo(() => {
        const map = new Map<string, TestResult[]>();
        for (const r of results) {
            const arr = map.get(r.module_id) ?? [];
            arr.push(r);
            map.set(r.module_id, arr);
        }
        Array.from(map.values()).forEach((arr) => arr.sort((a: TestResult, b: TestResult) => a.sequence - b.sequence));
        return map;
    }, [results]);

    if (byModule.size === 0) return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No results yet.</CardContent></Card>
    );

    const badgeVariantMap: Record<ModuleSummaryStatus, "success" | "destructive" | "secondary" | "aborted"> = {
        PASS: "success", FAIL: "destructive", NEVER: "secondary", ABORTED: "aborted",
    };

    return (
        <div className="rounded-md border">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Module</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Summary</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Results</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Last test</th>
                        <th className="px-4 py-2" />
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {Array.from(byModule.entries()).map(([moduleId, moduleResults]) => {
                        const summaryStatus = deriveModuleStatus(moduleResults);
                        const last = moduleResults[moduleResults.length - 1];
                        const passCount = moduleResults.filter((r) => r.status === "PASS").length;
                        const failCount = moduleResults.filter((r) => isFailureStatus(r.status as Status)).length;
                        return (
                            <tr key={moduleId} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{getModuleLabel(moduleId)}</td>
                                <td className="px-4 py-3">
                                    <Badge variant={badgeVariantMap[summaryStatus]} className="uppercase text-xs">{summaryStatus}</Badge>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    <span className="text-green-600 dark:text-green-400">{passCount}✓</span>
                                    {failCount > 0 && <span className="ml-1 text-red-500">{failCount}✗</span>}
                                    <span className="ml-1">/ {moduleResults.length}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{last ? formatRelativeTime(last.timestamp) : "—"}</td>
                                <td className="px-4 py-3">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                        <Link href={`/modules/${moduleId}`}>Module</Link>
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function LogsPanel({ logs }: { logs: LogEntry[] }) {
    const SEVERITY_COLORS: Record<string, string> = {
        ERROR: "text-red-400", WARN: "text-yellow-400", WARNING: "text-yellow-400",
        INFO: "text-blue-400", DEBUG: "text-muted-foreground",
    };
    if (!logs.length) return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No log entries.</CardContent></Card>
    );
    return (
        <Card>
            <CardContent className="p-0">
                <div className="h-[500px] overflow-y-auto font-mono text-xs p-3 space-y-0.5">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-2 items-start leading-5">
                            <span className="text-muted-foreground shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`shrink-0 w-12 ${SEVERITY_COLORS[log.severity?.toUpperCase() ?? ""] ?? ""}`}>{log.severity}</span>
                            <span className="shrink-0 text-muted-foreground">[{log.source}]</span>
                            <span className="break-all">{log.message}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
