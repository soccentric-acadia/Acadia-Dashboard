"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { ModuleWorkspace } from "@/components/module-page/module-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModule } from "@/lib/api";
import { modulesForOfflineDisplay } from "@/lib/modules/catalog";

export default function ModulePage() {
    const params = useParams<{ moduleId: string }>();
    const moduleId = decodeURIComponent(params.moduleId);
    const { data: module, isLoading, isError, refetch } = useQuery({
        queryKey: ["module", moduleId],
        queryFn: () => getModule(moduleId),
    });
    const fallbackModule = useMemo(() => modulesForOfflineDisplay(undefined).find((item) => item.id === moduleId), [moduleId]);

    if (isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-white/65 dark:bg-zinc-900/55" />;

    if ((isError || !module) && fallbackModule) {
        return <ModuleWorkspace module={fallbackModule} />;
    }

    if (!module) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Module unavailable</CardTitle>
                    <CardDescription>The server did not return metadata for {moduleId}, and no cached or baseline module matches it.</CardDescription>
                    <div><Button type="button" onClick={() => void refetch()}>Retry</Button></div>
                </CardHeader>
            </Card>
        );
    }

    return <ModuleWorkspace module={module} />;
}