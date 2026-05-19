"use client";

import { use } from "react";
import Link from "next/link";
import { useBoard } from "@/lib/board/context";
import { useRuns } from "@/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { ArrowLeft } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// In the single-board model, /targets/[id] redirects to the board detail view.
// The targetId param is ignored — there is exactly one board.
export default function TargetDetailPage({ params }: { params: Promise<{ targetId: string }> }) {
    use(params); // consume params — ignored in single-board model
    const { board, isLoading } = useBoard();
    const { data: runsData } = useRuns({ limit: 10 });
    const runs = runsData?.runs ?? [];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!board) {
        return (
            <div className="space-y-4">
                <Link href="/targets" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Targets
                </Link>
                <p className="text-muted-foreground">No board registered.</p>
            </div>
        );
    }

    const fields = [
        { label: "Board ID", value: <span className="font-mono text-xs">{board.id}</span> },
        { label: "Hostname", value: board.hostname },
        { label: "Model", value: board.model ?? "\u2014" },
        { label: "HAL Version", value: board.hal_version ?? "\u2014" },
        { label: "Client Version", value: board.client_version ?? "\u2014" },
        { label: "OS Version", value: board.os_version ?? "\u2014" },
        { label: "First Seen", value: board.first_seen ? formatRelativeTime(board.first_seen) : "\u2014" },
        { label: "Last Seen", value: board.last_seen ? formatRelativeTime(board.last_seen) : "Now" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/targets" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Targets
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{board.name || board.hostname}</h1>
                <Badge variant={board.status === "online" ? "default" : "secondary"} className="capitalize">
                    {board.status}
                </Badge>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-base">Board Details</CardTitle></CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {fields.map(({ label, value }) => (
                            <div key={label}>
                                <dt className="text-xs text-muted-foreground">{label}</dt>
                                <dd className="font-medium mt-0.5">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    {runs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No runs found.</p>
                    ) : (
                        <div className="space-y-1 divide-y">
                            {runs.map((run) => (
                                <Link key={run.id} href={`/runs/${run.id}`} className="flex items-center justify-between py-2 hover:bg-accent/50 rounded px-2 transition-colors">
                                    <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 12)}\u2026</span>
                                    <span className="text-sm truncate mx-2">{run.name}</span>
                                    <RunStateBadge state={run.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                    <Link href="/runs" className="text-xs text-primary hover:underline mt-3 block">View all runs</Link>
                </CardContent>
            </Card>
        </div>
    );
}
