"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRun } from "@/lib/api/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { AlertCircle, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModuleLabel } from "@/lib/proto/registry";

function DiffValue({ a, b }: { a: unknown; b: unknown }) {
    const changed = JSON.stringify(a) !== JSON.stringify(b);
    return (
        <div className={cn("grid grid-cols-2 gap-2 text-sm", changed && "bg-yellow-500/5 rounded px-1")}>
            <span className={cn(changed && "text-red-500")}>{a == null ? "—" : String(a)}</span>
            <span className={cn(changed && "text-green-500")}>{b == null ? "—" : String(b)}</span>
        </div>
    );
}

function CompareContent() {
    const params = useSearchParams();
    const router = useRouter();
    const runAId = params.get("a") ?? "";
    const runBId = params.get("b") ?? "";

    const { data: runA, isLoading: loadingA, isError: errorA } = useRun(runAId);
    const { data: runB, isLoading: loadingB, isError: errorB } = useRun(runBId);

    if (!runAId || !runBId) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">Compare Runs</h1>
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <GitCompare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">Select two runs to compare</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Open this page with <code className="bg-muted px-1 rounded">?a=run_id_1&b=run_id_2</code> to compare two runs.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/runs")}>
                        Browse runs
                    </Button>
                </div>
            </div>
        );
    }

    if (loadingA || loadingB) return <Skeleton className="h-80 w-full" />;

    if (errorA || errorB || !runA || !runB) {
        return (
            <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Failed to load one or both runs.
            </div>
        );
    }

    const fields: Array<{ label: string; a: unknown; b: unknown }> = [
        { label: "Module", a: getModuleLabel(runA.moduleId), b: getModuleLabel(runB.moduleId) },
        { label: "Mode", a: runA.mode, b: runB.mode },
        { label: "State", a: runA.state, b: runB.state },
        { label: "Pass/Fail", a: runA.passFail == null ? "—" : runA.passFail ? "PASS" : "FAIL", b: runB.passFail == null ? "—" : runB.passFail ? "PASS" : "FAIL" },
        { label: "Result batches", a: runA.batchCount, b: runB.batchCount },
        { label: "Samples", a: runA.sampleCount, b: runB.sampleCount },
        { label: "Started", a: runA.startedAt ? new Date(runA.startedAt).toLocaleString() : "—", b: runB.startedAt ? new Date(runB.startedAt).toLocaleString() : "—" },
        { label: "Ended", a: (runA.endedAt ?? runA.completedAt) ? new Date((runA.endedAt ?? runA.completedAt)!).toLocaleString() : "—", b: (runB.endedAt ?? runB.completedAt) ? new Date((runB.endedAt ?? runB.completedAt)!).toLocaleString() : "—" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <GitCompare className="h-6 w-6" />
                <h1 className="text-2xl font-bold tracking-tight">Run comparison</h1>
            </div>

            {/* Header */}
            <div className="grid grid-cols-2 gap-4">
                {[runA, runB].map((run, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground mb-1">{i === 0 ? "Run A (baseline)" : "Run B (comparison)"}</p>
                            <p className="font-mono text-sm font-medium">{run.runId.slice(0, 12)}…</p>
                            <div className="flex items-center gap-2 mt-1">
                                <RunStateBadge state={run.state} />
                                <Badge variant="outline" className="text-xs">{run.moduleId}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Diff table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Field comparison</CardTitle>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                        <span>Run A ({runA.runId.slice(0, 8)}…)</span>
                        <span>Run B ({runB.runId.slice(0, 8)}…)</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                    {fields.map(({ label, a, b }) => (
                        <div key={label} className="py-2.5">
                            <p className="text-xs text-muted-foreground mb-1">{label}</p>
                            <DiffValue a={a} b={b} />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CompareContent />
        </Suspense>
    );
}
