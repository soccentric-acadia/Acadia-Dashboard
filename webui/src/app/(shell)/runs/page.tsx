"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRuns } from "@/lib/api/queries";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { Play, ChevronRight } from "lucide-react";
import type { RunsFilter } from "@/lib/api/client";

function RunsTable() {
    const searchParams = useSearchParams();
    const status  = searchParams.get("status")  ?? undefined;
    const mode    = searchParams.get("mode")    ?? undefined;

    const filter: RunsFilter = { status, mode, limit: 50 };
    const { data, isLoading, error } = useRuns(filter);

    if (isLoading) return (
        <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
    );
    if (error) return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
            Failed to load runs: {(error as Error).message}
        </div>
    );

    const runs = data?.runs ?? [];

    return runs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Play className="h-12 w-12" />
            <p className="font-medium">No runs found</p>
            {(status || mode) ? (
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/runs">Clear filters</Link>
                </Button>
            ) : (
                <p className="text-sm">Launch a run from a saved configuration.</p>
            )}
        </div>
    ) : (
        <div className="rounded-md border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Run</th>
                        <th className="px-4 py-3 text-left font-medium">Mode</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Started</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {runs.map((run) => (
                        <tr key={run.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                                <div className="font-medium">{run.name || <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 12)}\u2026</span>}</div>
                                {run.description && <div className="text-xs text-muted-foreground">{run.description}</div>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground capitalize">{run.mode.replace("_", "\u00a0")}</td>
                            <td className="px-4 py-3"><RunStateBadge state={run.status} /></td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                {run.started_at ? formatRelativeTime(run.started_at) : "\u2014"}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/runs/${run.id}`}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function RunsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Run History</h1>
                <Button asChild>
                    <Link href="/configs"><Play className="mr-2 h-4 w-4" />New run</Link>
                </Button>
            </div>
            <Suspense fallback={<div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}>
                <RunsTable />
            </Suspense>
        </div>
    );
}
