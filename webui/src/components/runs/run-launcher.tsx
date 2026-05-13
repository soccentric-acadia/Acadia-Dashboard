"use client";


import { useRouter } from "next/navigation";
import { useBoard } from "@/lib/board/context";
import { useCreateConfig, useCreateRun } from "@/lib/api/queries";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Server } from "lucide-react";
import type { SavedConfig } from "@/lib/config-store";
import type { ModuleConfig, TestMode } from "@/lib/api/types";

interface RunLauncherProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultConfig?: SavedConfig;
}

export function RunLauncher({ open, onOpenChange, defaultConfig }: RunLauncherProps) {
    const router = useRouter();
    const { board } = useBoard();
    const createConfig = useCreateConfig();
    const createRun = useCreateRun();

    const handleLaunch = async () => {
        if (!defaultConfig) return;
        try {
            // 1. Create (or re-use) a TestConfig on the Server
            const modules: ModuleConfig[] = [{
                id: defaultConfig.moduleId,
                enabled: true,
                config_payload: {
                    common: defaultConfig.commonConfig,
                    module: defaultConfig.moduleConfig,
                },
                notes: "",
            }];
            const config = await createConfig.mutateAsync({
                name: defaultConfig.name,
                mode: defaultConfig.mode as TestMode,
                modules,
                common_config: defaultConfig.commonConfig as Record<string, unknown>,
            });
            // 2. Start the run against that config
            const run = await createRun.mutateAsync({
                config_id: config.id,
                mode: config.mode,
                name: defaultConfig.name,
            });
            toast.success("Run started");
            onOpenChange(false);
            router.push(`/runs/${run.id}`);
        } catch (err) {
            toast.error(`Launch failed: ${(err as Error).message}`);
        }
    };

    const isPending = createConfig.isPending || createRun.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Launch Run</DialogTitle>
                    <DialogDescription>
                        {defaultConfig ? (
                            <>Config: <strong>{defaultConfig.name}</strong> \u00b7 Mode: <strong>{defaultConfig.mode}</strong></>
                        ) : "Select a configuration to launch."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <p className="text-sm font-medium">Target board</p>
                    {!board ? (
                        <div className="flex items-center gap-2 py-4 text-muted-foreground">
                            <Server className="h-4 w-4" />
                            <span className="text-sm">No board connected. Register a board first.</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-accent/50">
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${board.status === "online" ? "bg-green-500" : "bg-muted-foreground"}`} />
                                <span className="font-medium">{board.name || board.hostname}</span>
                                <span className="text-xs text-muted-foreground">{board.model}</span>
                            </div>
                            <Badge variant={board.status === "online" ? "default" : "secondary"} className="text-xs capitalize">
                                {board.status}
                            </Badge>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLaunch}
                        disabled={!board || board.status !== "online" || !defaultConfig || isPending}
                    >
                        {isPending ? "Launching\u2026" : "Launch"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
