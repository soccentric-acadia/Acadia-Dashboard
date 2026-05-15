"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus, BookMarked, Play, Archive, Trash2, AlertCircle,
} from "lucide-react";
import {
    fetchTemplates, deleteTemplate, archiveTemplate, instantiateTemplate,
    type Template,
} from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TemplatesPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");

    const { data: templates = [], isLoading, error } = useQuery<Template[]>({
        queryKey: ["templates"],
        queryFn: fetchTemplates,
    });

    const archiveMutation = useMutation({
        mutationFn: (id: string) => archiveTemplate(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Template archived"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTemplate(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Template deleted"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const instantiateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => instantiateTemplate(id, name),
        onSuccess: (cfg) => {
            toast.success("Config created from template");
            router.push(`/runs/new?configId=${cfg.id}`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const filtered = templates
        .filter(t => !t.archived)
        .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) ||
                     t.module_id.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                    <p className="text-sm text-muted-foreground mt-1">Saved run configurations you can reuse.</p>
                </div>
                <Button size="sm" onClick={() => router.push("/configs/new")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New template
                </Button>
            </div>

            <Input
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {isLoading && (
                <div className="space-y-2">
                    {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load templates: {(error as Error).message}</span>
                </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <BookMarked className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No templates yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Save a run configuration as a template to reuse it later.</p>
                    <Button className="mt-4" onClick={() => router.push("/configs/new")}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create template
                    </Button>
                </div>
            )}

            <div className="grid gap-3">
                {filtered.map((t) => (
                    <Card key={t.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{t.name}</p>
                                {t.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{t.module_id}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Use this template"
                                    onClick={() => instantiateMutation.mutate({ id: t.id, name: t.name })}
                                >
                                    <Play className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Archive"
                                    onClick={() => archiveMutation.mutate(t.id)}
                                >
                                    <Archive className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Delete"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => deleteMutation.mutate(t.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
