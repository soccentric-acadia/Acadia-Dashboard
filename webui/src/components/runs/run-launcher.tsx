"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClients, useConfigureRun, useStartRun } from "@/lib/api/queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Server } from "lucide-react";
import type { SavedConfig } from "@/lib/config-store";
import type { TestMode } from "@/lib/api/types";

interface RunLauncherProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultConfig?: SavedConfig;
}

export function RunLauncher({ open, onOpenChange, defaultConfig }: RunLauncherProps) {
    const router = useRouter();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const { data: clients, isLoading } = useClients();
    const configureRun = useConfigureRun();
    const startRun = useStartRun();

    const handleLaunch = async () => {
        if (!defaultConfig || !selectedClientId) return;
        try {
            // 1. Configure the run
            const { runId } = await configureRun.mutateAsync({
                clientId: selectedClientId,
                moduleId: defaultConfig.moduleId,
                mode: defaultConfig.mode as TestMode,
                config: {
                    common: defaultConfig.commonConfig,
                    module: defaultConfig.moduleConfig,
                },
            });
            // 2. Start the run
            await startRun.mutateAsync(runId);
            toast.success("Run started");
            onOpenChange(false);
            router.push(`/runs/${runId}`);
        } catch (err) {
            toast.error(`Launch failed: ${(err as Error).message}`);
        }
    };

    const isPending = configureRun.isPending || startRun.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Launch Run</DialogTitle>
                    <DialogDescription>
                        {defaultConfig ? (
                            <>Config: <strong>{defaultConfig.name}</strong> · Module: <strong>{defaultConfig.moduleId}</strong></>
                        ) : "Select a target to launch this run on."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <p className="text-sm font-medium">Select a target</p>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : !clients?.length ? (
                        <div className="flex items-center gap-2 py-4 text-muted-foreground">
                            <Server className="h-4 w-4" />
                            <span className="text-sm">No targets connected</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {clients.map((c) => (
                                <button
                                    key={c.clientId}
                                    type="button"
                                    disabled={!c.isConnected}
                                    onClick={() => setSelectedClientId(c.clientId)}
                                    className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedClientId === c.clientId
                                            ? "border-primary bg-accent"
                                            : "hover:bg-accent"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${c.isConnected ? "bg-green-500" : "bg-muted-foreground"}`} />
                                        <span>{c.hostname ?? c.clientId.slice(0, 16)}</span>
                                    </div>
                                    <Badge variant={c.isConnected ? "success" : "secondary"} className="text-xs">
                                        {c.isConnected ? "online" : "offline"}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLaunch}
                        disabled={!selectedClientId || !defaultConfig || isPending}
                    >
                        {isPending ? "Launching…" : "Launch"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
