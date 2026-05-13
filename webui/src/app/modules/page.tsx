"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { getModuleLabel } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Boxes, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ModulesPage() {
    const [search, setSearch] = useState("");
    const { data: modules, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });

    const filtered = modules?.filter((m) =>
        m.id.includes(search.toLowerCase()) ||
        getModuleLabel(m.id).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Module Catalog</h1>
                <span className="text-sm text-muted-foreground">
                    {modules ? `${modules.length} modules` : ""}
                </span>
            </div>

            <Input
                placeholder="Search modules…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {isError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{(error as Error)?.message}</span>
                    <Button size="sm" variant="destructive" className="ml-auto" onClick={() => refetch()}>Retry</Button>
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : !filtered?.length ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Boxes className="h-12 w-12" />
                    <p>{search ? "No modules match your search" : "No modules found"}</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((m) => (
                        <Link key={m.id} href={`/modules/${m.id}`}>
                            <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium">{getModuleLabel(m.id)}</div>
                                            <div className="font-mono text-xs text-muted-foreground mt-0.5">{m.id}</div>
                                        </div>
                                        <Badge variant={m.status === "active" ? "success" : "secondary"} className="shrink-0">
                                            {m.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">v{m.version}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
