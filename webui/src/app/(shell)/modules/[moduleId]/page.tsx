"use client";

import React, { use, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { getModuleLabel, formatRelativeTime, formatDurationNs } from "@/lib/utils";
import { useModuleResults, useModuleTrend } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResultTable } from "@/components/results/result-table";
import { isFailureStatus } from "@/lib/status";
import { numericKeys } from "@/lib/value/typed";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import { ArrowLeft, AlertCircle, TrendingUp } from "lucide-react";
import type { Status, TestResult } from "@/lib/api/types";

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = use(params);
    const { data: modules, isLoading: modulesLoading } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });

    const { data: resultsPage, isLoading: resultsLoading } = useModuleResults(moduleId, { limit: 200 });
    const results = resultsPage?.results ?? [];

    const mod = modules?.find((m) => m.id === moduleId);

    if (modulesLoading || resultsLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (!mod && !modulesLoading) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Module not found: {moduleId}</span>
        </div>
    );

    const passCount = results.filter((r) => r.status === "PASS").length;
    const failCount = results.filter((r) => isFailureStatus(r.status as Status)).length;
    const totalCount = results.length;
    const mKeys = numericKeys(results, "metrics");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/modules"><ArrowLeft className="mr-2 h-4 w-4" />Modules</Link>
                </Button>
                <h1 className="text-xl font-bold">{mod ? getModuleLabel(mod.id) : moduleId}</h1>
                {mod && <Badge variant="outline" className="font-mono text-xs">{mod.id}</Badge>}
                {mod?.version && <Badge variant="secondary" className="text-xs">v{mod.version}</Badge>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total results" value={String(totalCount)} />
                <StatCard label="Pass" value={<span className="text-green-600 dark:text-green-400">{passCount}</span>} />
                <StatCard label="Fail / Error" value={<span className={failCount > 0 ? "text-red-500" : ""}>{failCount}</span>} />
                <StatCard label="Pass rate" value={totalCount > 0 ? `${Math.round(passCount / totalCount * 100)}%` : "—"} />
            </div>

            <Tabs defaultValue="results">
                <TabsList>
                    <TabsTrigger value="results">Results ({totalCount})</TabsTrigger>
                    <TabsTrigger value="trend" disabled={mKeys.length === 0}>Trend</TabsTrigger>
                    <TabsTrigger value="heatmap" disabled={results.length === 0}>Heatmap</TabsTrigger>
                </TabsList>
                <TabsContent value="results" className="mt-4">
                    {results.length === 0
                        ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No results recorded for this module.</CardContent></Card>
                        : <ResultTable results={results} />}
                </TabsContent>
                <TabsContent value="trend" className="mt-4">
                    <TrendTab moduleId={moduleId} metricKeys={mKeys} />
                </TabsContent>
                <TabsContent value="heatmap" className="mt-4">
                    <HeatmapTab results={results} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-sm font-medium">{value}</div></CardContent>
        </Card>
    );
}

// ── Trend tab ────────────────────────────────────────────────────────────

const CHART_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

function TrendTab({ moduleId, metricKeys }: { moduleId: string; metricKeys: string[] }) {
    const [selectedKey, setSelectedKey] = useState(metricKeys[0] ?? "");
    const { data: trend, isLoading } = useModuleTrend(moduleId, "*", selectedKey, "metrics");

    const chartData = useMemo(() => {
        if (!trend?.points) return [];
        return trend.points.map((pt) => ({ run: pt.run_name ?? pt.run_id.slice(0, 8), value: pt.value }));
    }, [trend]);

    if (metricKeys.length === 0) return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No numeric metrics available.</CardContent></Card>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {metricKeys.map((k) => (
                    <Button key={k} variant={selectedKey === k ? "default" : "outline"} size="sm" onClick={() => setSelectedKey(k)}>
                        <TrendingUp className="mr-1.5 h-3.5 w-3.5" />{k}
                    </Button>
                ))}
            </div>
            <Card>
                <CardHeader><CardTitle className="text-sm">{selectedKey} over runs</CardTitle></CardHeader>
                <CardContent>
                    {isLoading
                        ? <Skeleton className="h-48 w-full" />
                        : chartData.length === 0
                            ? <p className="text-xs text-center text-muted-foreground py-8">No trend data.</p>
                            : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="run" tick={{ fontSize: 9 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <RechartTooltip contentStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="value" name={selectedKey} stroke={CHART_COLORS[0]} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )
                    }
                </CardContent>
            </Card>
        </div>
    );
}

// ── Heatmap tab ─────────────────────────────────────────────────────────

const STATUS_HEATMAP_COLOR: Record<string, string> = {
    PASS:    "bg-green-500",
    FAIL:    "bg-red-500",
    ERROR:   "bg-red-700",
    TIMEOUT: "bg-amber-500",
    SKIPPED: "bg-muted",
    ABORTED: "bg-purple-500",
};

function HeatmapTab({ results }: { results: TestResult[] }) {
    // Group by run_id rows, test_id columns
    const { runIds, testIds, grid } = useMemo(() => {
        const runSet = new Set<string>();
        const testSet = new Set<string>();
        for (const r of results) { runSet.add(r.run_id); testSet.add(r.test_id); }
        const rIds = Array.from(runSet);
        const tIds = Array.from(testSet);
        const g = new Map<string, Map<string, string>>();
        for (const r of results) {
            const row = g.get(r.run_id) ?? new Map<string, string>();
            row.set(r.test_id, r.status);
            g.set(r.run_id, row);
        }
        return { runIds: rIds, testIds: tIds, grid: g };
    }, [results]);

    if (runIds.length === 0) return (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No data.</CardContent></Card>
    );

    return (
        <div className="overflow-x-auto">
            <table className="text-xs border-separate border-spacing-0.5">
                <thead>
                    <tr>
                        <th className="px-2 text-left text-muted-foreground">Run</th>
                        {testIds.map((tid) => (
                            <th key={tid} className="px-1 font-mono text-muted-foreground max-w-[60px] truncate" title={tid}>
                                {tid.slice(0, 8)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {runIds.map((runId) => (
                        <tr key={runId}>
                            <td className="pr-2 font-mono text-muted-foreground">{runId.slice(0, 8)}</td>
                            {testIds.map((tid) => {
                                const status = grid.get(runId)?.get(tid);
                                return (
                                    <td key={tid} title={status ?? "no data"}>
                                        <div className={`h-4 w-4 rounded-sm ${status ? (STATUS_HEATMAP_COLOR[status] ?? "bg-muted") : "bg-muted/30"}`} />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(STATUS_HEATMAP_COLOR).map(([s, cls]) => (
                    <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className={`h-3 w-3 rounded-sm ${cls}`} />{s}
                    </div>
                ))}
            </div>
        </div>
    );
}
