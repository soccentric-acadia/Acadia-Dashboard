"use client";

import Link from "next/link";
import { useBoard } from "@/lib/board/context";
import { useRuns, useHealth } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Play, CheckCircle2, Activity, ChevronRight, XCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Run } from "@/lib/api/types";
import { RunStateBadge } from "@/components/runs/run-state-badge";

function HealthBadge() {
    const { isLoading, isError } = useHealth();
    if (isLoading) return <Badge variant="outline" className="bg-background/50">Checking Server\u2026</Badge>;
    if (isError) return <Badge variant="destructive">Server unreachable</Badge>;
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Server reachable</Badge>;
}

function calculateDuration(start: string | null, end: string | null) {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - startTime;
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

export default function DashboardPage() {
    const { board } = useBoard();
    const { data: recentRunsData, isLoading: recentLoading } = useRuns({ limit: 10 });
    const { data: failedRunsData, isLoading: failedLoading } = useRuns({ status: "failed", limit: 5 });
    const { data: successRunsData, isLoading: successLoading } = useRuns({ status: "completed", limit: 1 });
    const { data: activeRunsData } = useRuns({ status: "running", limit: 5 });

    const recentRuns = recentRunsData?.runs ?? [];
    const failedRuns = failedRunsData?.runs ?? [];
    const activeRuns = activeRunsData?.runs ?? [];
    const lastSuccess = successRunsData?.runs?.[0] ?? null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">System overview and recent activity</p>
                </div>
                <HealthBadge />
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Board Status</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {board ? (
                            <>
                                <div className="text-2xl font-bold">{board.hostname || board.name}</div>
                                <p className="text-xs text-muted-foreground">
                                    <Badge variant={board.status === "online" ? "default" : "secondary"} className="capitalize text-xs">{board.status}</Badge>
                                    <span className="ml-1">{board.model}</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-muted-foreground">No board</div>
                                <p className="text-xs text-muted-foreground">No board connected</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Runs</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeRuns.length}</div>
                        <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Failure</CardTitle>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {failedLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : failedRuns.length > 0 ? (
                            <>
                                <div className="text-2xl font-bold text-destructive">{failedRuns.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Last: {formatRelativeTime(failedRuns[0]?.ended_at ?? failedRuns[0]?.created_at ?? "")}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-green-500">0</div>
                                <p className="text-xs text-muted-foreground">No recent failures</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Success</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {successLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : lastSuccess ? (
                            <>
                                <div className="text-2xl font-bold text-green-500">
                                    {formatRelativeTime(lastSuccess.ended_at ?? lastSuccess.created_at ?? "")}
                                </div>
                                <p className="text-xs text-muted-foreground">{lastSuccess.name || lastSuccess.id.slice(0, 12)}</p>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-muted-foreground">\u2014</div>
                                <p className="text-xs text-muted-foreground">No completed runs yet</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent runs table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Runs</CardTitle>
                        <CardDescription>Last 10 runs across all modes</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/runs">View all <ChevronRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : recentRuns.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            <Play className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            No runs yet. <Link href="/configs" className="underline">Start your first run.</Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Run</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Started</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRuns.map((run: Run) => (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-medium">
                                            {run.name || <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 12)}\u2026</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground capitalize">{run.mode}</TableCell>
                                        <TableCell><RunStateBadge state={run.status} /></TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {run.started_at ? formatRelativeTime(run.started_at) : "\u2014"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {calculateDuration(run.started_at ?? null, run.ended_at ?? null)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/runs/${run.id}`}><ChevronRight className="h-4 w-4" /></Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
