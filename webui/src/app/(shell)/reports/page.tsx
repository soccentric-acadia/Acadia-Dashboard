"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useRuns } from "@/lib/api/queries";
import { useBoard } from "@/lib/board/context";
import { RunStateBadge } from "@/components/runs/run-state-badge";

export default function ReportsPage() {
    const { board } = useBoard();
    const { data: runsData } = useRuns({ clientId: board?.clientId, limit: 20 });
    const runs = runsData?.edges?.map((e) => e.node) ?? [];

    const completedRuns = runs.filter((r) => r.state === "completed" || r.state === "stopped" || r.state === "failed");

    const handleGenerate = (runId: string) => {
        toast.info(`Report generation for run ${runId.slice(0, 8)}… coming soon.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">Generate and manage run reports.</p>
                </div>
                <Button size="sm" onClick={() => toast.info("Scheduled reports coming soon.")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Schedule report
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Generate one-off report</CardTitle>
                </CardHeader>
                <CardContent>
                    {completedRuns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No completed runs found.</p>
                    ) : (
                        <div className="divide-y">
                            {completedRuns.map((run) => (
                                <div key={run.runId} className="flex items-center justify-between py-3 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium font-mono truncate">{run.runId.slice(0, 12)}…</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-xs">{run.moduleId}</Badge>
                                            <RunStateBadge state={run.state} />
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(run.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleGenerate(run.runId)}
                                        >
                                            <Download className="h-3.5 w-3.5 mr-1.5" />
                                            PDF
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleGenerate(run.runId)}
                                        >
                                            HTML
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Scheduled reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No scheduled reports configured.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
