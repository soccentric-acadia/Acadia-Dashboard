"use client";

import Link from "next/link";
import { useClients } from "@/lib/api/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, AlertCircle, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Client } from "@/lib/api/types";

export default function TargetsPage() {
    const { data: clients, isLoading, isError, error, refetch } = useClients();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Targets</h1>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {isError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                        Failed to load targets: {(error as Error)?.message ?? "Unknown error"}
                    </span>
                    <Button variant="destructive" size="sm" className="ml-auto" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : !clients?.length ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Server className="h-12 w-12" />
                    <p className="font-medium">No targets registered</p>
                    <p className="text-sm">Targets appear here when an Acadia-Client connects to the server.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Hostname</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">HAL Version</th>
                                <th className="px-4 py-3 text-left font-medium">Client Version</th>
                                <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                                <th className="px-4 py-3 text-right font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((c: Client) => (
                                <tr key={c.clientId} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{c.hostname ?? "—"}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{c.clientId.slice(0, 16)}…</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={c.isConnected ? "success" : "secondary"}>
                                            {c.isConnected ? "Online" : "Offline"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.halVersion ?? "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.clientVersion ?? "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {c.isConnected ? "Now" : formatRelativeTime(c.lastSeen)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/targets/${c.clientId}`}>View</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
