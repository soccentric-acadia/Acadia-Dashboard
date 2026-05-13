"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { getModuleLabel } from "@/lib/utils";
import { useRuns } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = use(params);
    const { data: modules, isLoading } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });
    const { data: runs } = useRuns({ limit: 10 });

    const mod = modules?.find((m) => m.id === moduleId);

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
        </div>
    );

    if (!mod) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Module &quot;{moduleId}&quot; not found in registry</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/modules"><ArrowLeft className="mr-2 h-4 w-4" />Modules</Link>
                </Button>
                <h1 className="text-2xl font-bold">{getModuleLabel(mod.id)}</h1>
                <Badge variant={mod.status === "active" ? "success" : "secondary"}>{mod.status}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Module ID", value: <span className="font-mono text-xs">{mod.id}</span> },
                    { label: "Version", value: `v${mod.version}` },
                    { label: "Proto Package", value: <span className="font-mono text-xs">{mod.proto_package}</span> },
                    { label: "Source", value: <span className="font-mono text-xs break-all">{mod.source_path}</span> },
                ].map(({ label, value }) => (
                    <Card key={label}>
                        <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
                        <CardContent><div className="text-sm">{value}</div></CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Config Type</CardTitle></CardHeader>
                    <CardContent>
                        <code className="block rounded bg-muted px-3 py-2 text-sm font-mono">{mod.config_type}</code>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Use the Config Builder to create a run configuration for this mod.
                        </p>
                        <Button size="sm" className="mt-3" asChild>
                            <Link href={`/configs/new?moduleId=${mod.id}`}>Create config</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Result Type</CardTitle></CardHeader>
                    <CardContent>
                        <code className="block rounded bg-muted px-3 py-2 text-sm font-mono">{mod.result_type}</code>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Results are decoded server-side and returned as JSON.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Runs</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/runs?moduleId=${moduleId}`}>View all</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {!runs?.runs?.length ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">No runs for this module yet.</p>
                    ) : (
                        <div className="space-y-1">
                            {runs.runs.map((run) => (
                                <Link key={run.id} href={`/runs/${run.id}`}
                                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                                    <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 12)}…</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">{"single-board"}</span>
                                        <Badge variant="outline" className="capitalize text-xs">{run.status}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
