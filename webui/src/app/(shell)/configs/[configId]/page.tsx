"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useConfigStore } from "@/lib/config-store";
import { getModuleLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pencil, AlertCircle } from "lucide-react";
import { RunLauncher } from "@/components/runs/run-launcher";

const MODE_LABELS: Record<string, string> = {
    single_shot: "Single Shot",
    long_term: "Long Term",
    monitoring: "Monitoring",
    event_based: "Event Based",
};

export default function ConfigDetailPage({ params }: { params: Promise<{ configId: string }> }) {
    const { configId } = use(params);
    const getConfig = useConfigStore((s) => s.get);
    const config = getConfig(configId);
    const [launchOpen, setLaunchOpen] = useState(false);

    if (!config) return (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Configuration not found.</span>
            <Button variant="ghost" size="sm" asChild className="ml-auto">
                <Link href="/configs">Back to configs</Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/configs"><ArrowLeft className="mr-2 h-4 w-4" />Configs</Link>
                </Button>
                <h1 className="text-2xl font-bold">{config.name}</h1>
            </div>

            <div className="flex gap-2">
                <Button onClick={() => setLaunchOpen(true)}>
                    <Play className="mr-2 h-4 w-4" />Launch run
                </Button>
                <Button variant="outline" asChild>
                    <Link href={`/configs/new?from=${configId}`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
                </Button>
            </div>

            <Card>
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Row label="Module" value={getModuleLabel(config.moduleId)} />
                    <Row label="Mode" value={<Badge variant="outline">{MODE_LABELS[config.mode]}</Badge>} />
                    {config.commonConfig.interval_ms && (
                        <Row label="Interval" value={`${config.commonConfig.interval_ms}ms`} />
                    )}
                    {config.commonConfig.run_forever ? (
                        <Row label="Duration" value="Until stopped" />
                    ) : config.commonConfig.duration_ms ? (
                        <Row label="Duration" value={`${config.commonConfig.duration_ms}ms`} />
                    ) : null}
                    {config.commonConfig.poll_interval_ms && (
                        <Row label="Poll interval" value={`${config.commonConfig.poll_interval_ms}ms`} />
                    )}
                </CardContent>
            </Card>

            {Object.keys(config.moduleConfig).length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Module Config</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="rounded-md bg-muted px-3 py-2 text-xs font-mono overflow-x-auto">
                            {JSON.stringify(config.moduleConfig, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            <RunLauncher
                open={launchOpen}
                onOpenChange={setLaunchOpen}
                defaultConfig={config}
            />
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    );
}
