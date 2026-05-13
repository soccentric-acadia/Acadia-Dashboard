"use client";

import { use } from "react";
import Link from "next/link";
import { useClient, useRuns } from "@/lib/api/queries";
import { useEnableModule } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { formatRelativeTime, getModuleLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { toast } from "sonner";

function formatRelativePlaceholder(s: string) { return formatRelativeTime(s); }

export default function TargetDetailPage({ params }: { params: Promise<{ targetId: string }> }) {
    const { targetId } = use(params);
    const { data: client, isLoading, isError, error, refetch } = useClient(targetId);
    const { data: runs } = useRuns({ clientId: targetId, limit: 10 });
    const { data: modules } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });
    const enableModule = useEnableModule();

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );

    if (isError || !client) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{(error as Error)?.message ?? "Target not found"}</span>
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => refetch()}>Retry</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/targets"><ArrowLeft className="mr-2 h-4 w-4" /> Targets</Link>
                </Button>
                <h1 className="text-2xl font-bold">{client.hostname ?? client.clientId.slice(0, 16)}</h1>
                <Badge variant={client.isConnected ? "success" : "secondary"}>
                    {client.isConnected ? "Online" : "Offline"}
                </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Client ID", value: <span className="font-mono text-xs">{client.clientId}</span> },
                    { label: "HAL Version", value: client.halVersion ?? "—" },
                    { label: "Client Version", value: client.clientVersion ?? "—" },
                    { label: "Last Seen", value: client.isConnected ? "Now" : formatRelativePlaceholder(client.lastSeen) },
                ].map(({ label, value }) => (
                    <Card key={label}>
                        <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
                        <CardContent><div className="text-sm font-medium">{value}</div></CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Module inventory */}
                <Card>
                    <CardHeader><CardTitle>Module Settings</CardTitle></CardHeader>
                    <CardContent>
                        {!modules ? (
                            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {modules.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                        <Label htmlFor={`mod-${m.id}`} className="cursor-pointer">
                                            {getModuleLabel(m.id)}
                                            {m.status === "deprecated" && (
                                                <Badge variant="secondary" className="ml-2 text-xs">deprecated</Badge>
                                            )}
                                        </Label>
                                        <Switch
                                            id={`mod-${m.id}`}
                                            defaultChecked
                                            onCheckedChange={(enabled) => {
                                                enableModule.mutate(
                                                    { clientId: client.clientId, moduleId: m.id, enabled },
                                                    {
                                                        onSuccess: () => toast.success(`${getModuleLabel(m.id)} ${enabled ? "enabled" : "disabled"}`),
                                                        onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
                                                    }
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent runs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Runs</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/runs?clientId=${client.clientId}`}>View all</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!runs?.edges.length ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">No runs for this target yet.</p>
                        ) : (
                            <div className="space-y-1">
                                {runs.edges.map(({ node }) => (
                                    <Link key={node.runId} href={`/runs/${node.runId}`}
                                        className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                                        <span>{node.moduleId}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="capitalize">{node.state}</Badge>
                                            <span className="text-xs text-muted-foreground">{formatRelativePlaceholder(node.createdAt)}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
