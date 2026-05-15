"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useRuns } from "@/lib/api/queries";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { fetchRunReport } from "@/lib/api/client";

export default function ReportsPage() {
    const { data: runsData } = useRuns({ limit: 50 });
    const runs = runsData?.runs ?? [];

    const completedRuns = runs.filter(
        (r) => r.status === "completed" || r.status === "cancelled" || r.status === "failed"
    );

    const handleHtml = async (runId: string) => {
        try {
            const html = await fetchRunReport(runId);
            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `run-${runId.slice(0, 8)}-report.html`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { toast.error((e as Error).message); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                <p className="text-sm text-muted-foreground mt-1">Generate and download run reports.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Download run report</CardTitle>
                </CardHeader>
                <CardContent>
                    {completedRuns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No completed runs found.</p>
                    ) : (
                        <div className="divide-y">
                            {completedRuns.map((run) => (
                                <div key={run.id} className="flex items-center justify-between py-3 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium font-mono truncate">{run.name || run.id.slice(0, 12) + "…"}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-xs capitalize">{run.mode}</Badge>
                                            <RunStateBadge state={run.status} />
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(run.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleHtml(run.id)}>
                                        <Download className="h-3.5 w-3.5 mr-1.5" />HTML
                                    </Button>
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
