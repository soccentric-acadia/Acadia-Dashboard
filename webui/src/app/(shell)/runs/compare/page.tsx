"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRun, useRunCompare } from "@/lib/api/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertCircle, GitCompare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompareRow, CompareCategory, Status } from "@/lib/api/types";

const CATEGORY_LABEL: Record<CompareCategory, string> = {
    unchanged: "Unchanged",
    improved: "Improved",
    regressed: "Regressed",
    drifted: "Drifted",
    disappeared: "Disappeared",
    appeared: "Appeared",
};

const CATEGORY_VARIANT: Record<CompareCategory, React.ComponentProps<typeof Badge>["variant"]> = {
    unchanged: "secondary",
    improved: "success",
    regressed: "destructive",
    drifted: "timeout",
    disappeared: "aborted",
    appeared: "outline",
};

function CompareContent() {
    const params = useSearchParams();
    const router = useRouter();
    const runAId = params.get("a") ?? "";
    const runBId = params.get("b") ?? "";

    const { data: runA, isLoading: loadingA, isError: errorA } = useRun(runAId);
    const { data: runB, isLoading: loadingB, isError: errorB } = useRun(runBId);
    const { data: comparison, isLoading: loadingCmp, isError: errorCmp } = useRunCompare(
        runAId && runBId ? runAId : "",
        runAId && runBId ? runBId : ""
    );

    if (!runAId || !runBId) return (
        <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Select two runs to compare via <code>?a=runA&b=runB</code>.
            </CardContent>
        </Card>
    );

    if (loadingA || loadingB || loadingCmp) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (errorA || errorB) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Could not load one or both runs.</span>
        </div>
    );

    if (errorCmp || !comparison) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Compare failed. The server may not yet support this endpoint.</span>
        </div>
    );

    const rows = comparison.rows ?? [];
    // Group by category for summary
    const categoryCount = rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
                <GitCompare className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-xl font-bold">Compare runs</h1>
            </div>

            {/* Run pair header */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Run A</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <span className="font-mono text-sm">{runA?.name ?? runAId.slice(0, 12)}</span>
                        {runA && <RunStateBadge state={runA.status} />}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Run B</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <span className="font-mono text-sm">{runB?.name ?? runBId.slice(0, 12)}</span>
                        {runB && <RunStateBadge state={runB.status} />}
                    </CardContent>
                </Card>
            </div>

            {/* Category summary chips */}
            <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABEL) as CompareCategory[]).map((cat) => (
                    categoryCount[cat] ? (
                        <Badge key={cat} variant={CATEGORY_VARIANT[cat]} className="gap-1">
                            {CATEGORY_LABEL[cat]}
                            <span className="font-bold">{categoryCount[cat]}</span>
                        </Badge>
                    ) : null
                ))}
                {rows.length === 0 && <span className="text-sm text-muted-foreground">No differences.</span>}
            </div>

            {/* Full diff table */}
            {rows.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Module</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Test</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status A</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"></th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status B</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Metric drift</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((row, i) => (
                                <CompareRowItem key={i} row={row} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CompareRowItem({ row }: { row: CompareRow }) {
    const isChanged = row.category !== "unchanged";
    const driftKeys = row.metrics_drift ? Object.keys(row.metrics_drift) : [];

    return (
        <tr className={cn("hover:bg-muted/30", isChanged && "bg-muted/10")}>
            <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{row.module_id}</td>
            <td className="px-4 py-2 max-w-[200px]">
                <div className="truncate font-medium">{row.name || row.test_id}</div>
                {row.name && <div className="text-xs text-muted-foreground font-mono truncate">{row.test_id}</div>}
            </td>
            <td className="px-4 py-2">
                {row.status_a ? <StatusBadge status={row.status_a as Status} severity={row.severity_a as import("@/lib/api/types").Severity | undefined} /> : <span className="text-muted-foreground text-xs">—</span>}
            </td>
            <td className="px-2 py-2 text-muted-foreground"><ArrowRight className="h-3 w-3" /></td>
            <td className="px-4 py-2">
                {row.status_b ? <StatusBadge status={row.status_b as Status} severity={row.severity_b as import("@/lib/api/types").Severity | undefined} /> : <span className="text-muted-foreground text-xs">—</span>}
            </td>
            <td className="px-4 py-2">
                <Badge variant={CATEGORY_VARIANT[row.category]} className="text-xs">{CATEGORY_LABEL[row.category]}</Badge>
            </td>
            <td className="px-4 py-2 text-xs text-muted-foreground">
                {driftKeys.length > 0
                    ? driftKeys.map((k) => <div key={k}>{k}: {String(row.metrics_drift![k])}</div>)
                    : "—"}
            </td>
        </tr>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <CompareContent />
        </Suspense>
    );
}
