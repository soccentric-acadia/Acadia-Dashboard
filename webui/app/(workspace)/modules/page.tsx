"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowRight, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModules } from "@/lib/api";
import { modulesForOfflineDisplay, writeCachedModules } from "@/lib/modules/catalog";

export default function ModulesIndexPage() {
    const { data: liveModules, isLoading, isError, refetch } = useQuery({
        queryKey: ["modules"],
        queryFn: getModules,
    });

    useEffect(() => {
        if (liveModules && liveModules.length > 0) writeCachedModules(liveModules);
    }, [liveModules]);

    const modules = useMemo(() => modulesForOfflineDisplay(liveModules), [liveModules]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Cpu size={20} className="text-muted-foreground" />
                            <Badge variant={isError ? "warning" : "success"}>{isError ? "Offline inventory" : "Server inventory"}</Badge>
                        </div>
                        <CardTitle className="text-2xl">Modules</CardTitle>
                        <CardDescription>
                            {isError
                                ? "Server modules are unavailable, so cached or baseline module information is shown."
                                : "Server-discovered modules with categories, schema type URLs, versions, and descriptions."}
                        </CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void refetch()}>Refresh</Button>
                </CardHeader>
            </Card>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {isLoading && !modules.length && Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-muted" />)}
                {modules.map((module) => (
                    <Link key={module.id} href={`/modules/${module.id}`}>
                        <Card className="h-full transition-colors hover:bg-accent/50">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <Badge variant="outline">{module.category || "Module"}</Badge>
                                    <ArrowRight size={16} className="text-muted-foreground" />
                                </div>
                                <CardTitle>{module.name || module.id}</CardTitle>
                                <CardDescription className="line-clamp-3">{module.description || "No module description supplied by the server."}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex justify-between gap-3"><span>ID</span><span className="font-mono">{module.id}</span></div>
                                <div className="flex justify-between gap-3"><span>Version</span><span>{module.version || "n/a"}</span></div>
                                <div className="truncate"><span className="font-medium text-foreground">Config:</span> {module.config_type_url || "Not reported"}</div>
                                <div className="truncate"><span className="font-medium text-foreground">Result:</span> {module.result_type_url || "Not reported"}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </section>
        </div>
    );
}