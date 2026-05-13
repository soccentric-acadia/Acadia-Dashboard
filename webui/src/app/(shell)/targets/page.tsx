"use client";

import { useBoard } from "@/lib/board/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function TargetsPage() {
    const { board, isLoading, refresh } = useBoard();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Target Board</h1>
                <Button variant="outline" size="sm" onClick={refresh}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : !board ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Server className="h-12 w-12" />
                    <p className="font-medium">No board registered</p>
                    <p className="text-sm">A board appears here when the Acadia Client connects to this server.</p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Board</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">HAL</th>
                                <th className="px-4 py-3 text-left font-medium">Client</th>
                                <th className="px-4 py-3 text-left font-medium">OS</th>
                                <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b last:border-0 hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium">{board.name || board.hostname || "\u2014"}</div>
                                    <div className="font-mono text-xs text-muted-foreground">{board.id.slice(0, 16)}\u2026</div>
                                    <div className="text-xs text-muted-foreground">{board.model}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={board.status === "online" ? "default" : "secondary"} className="capitalize">
                                        {board.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{board.hal_version || "\u2014"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{board.client_version || "\u2014"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{board.os_version || "\u2014"}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {board.status === "online" ? "Now" : formatRelativeTime(board.last_seen)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
