"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRuns } from "@/lib/api/queries";
import { getModuleLabel, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { Play, ChevronRight } from "lucide-react";

function RunsTable() {
    const searchParams = useSearchParams();
    const moduleId = searchParams.get("moduleId") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;

    const { data, isLoading, error } = useRuns({ moduleId, clientId, limit: 50 });

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

    const runs = data?.edges ?? [];

    return runs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Play className="h-12 w-12" />
            <p className="font-medium">No runs found</p>
            {(moduleId || clientId) ? (
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
                        <th className="px-4 py-3 text-left font-medium">Run ID</th>
                        <th className="px-4 py-3 text-left font-medium">Module</th>
                        <th className="px-4 py-3 text-left font-medium">Target</th>
                        <th className="px-4 py-3 text-left font-medium">State</th>
                        <th className="px-4 py-3 text-left font-medium">Started</th>
                        <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {runs.map(({ node: run }) => (
                        <tr key={run.runId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                                <span className="font-mono text-xs text-muted-foreground">{run.runId.slice(0, 12)}…</span>
                            </td>
                            <td className="px-4 py-3">{getModuleLabel(run.moduleId)}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                {run.client?.hostname ?? run.client?.clientId?.slice(0, 12) ?? "—"}
                            </td>
                            <td className="px-4 py-3"><RunStateBadge state={run.state} /></td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                {run.startedAt ? formatRelativeTime(run.startedAt) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/runs/${run.runId}`}>
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
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <RunsTable />
            </Suspense>
        </div>
    );
}
