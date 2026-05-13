"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, Download, Copy, Trash2, Play, BookMarked } from "lucide-react";
import { useConfigStore } from "@/lib/config-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getModuleLabel } from "@/lib/proto/registry";

export default function TemplatesPage() {
    const router = useRouter();
    const { configs, remove } = useConfigStore();
    const [search, setSearch] = useState("");

    // Saved configs double as templates in the current implementation.
    const filtered = configs.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.moduleId.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = (id: string) => {
        const cfg = configs.find((c) => c.id === id);
        if (!cfg) return;
        const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cfg.name.replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result as string);
                    toast.success(`Imported: ${data.name ?? "template"}`);
                } catch {
                    toast.error("Invalid template file.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                    <p className="text-sm text-muted-foreground mt-1">Saved run configurations you can reuse.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleImport}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Import
                    </Button>
                    <Button size="sm" onClick={() => router.push("/configs/new")}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New template
                    </Button>
                </div>
            </div>

            <Input
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {filtered.length === 0 && (
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
                {filtered.map((cfg) => (
                    <Card key={cfg.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{cfg.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{getModuleLabel(cfg.moduleId)}</Badge>
                                    <Badge variant="secondary" className="text-xs">{cfg.mode.replace("_", " ")}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(cfg.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Use this template"
                                    onClick={() => router.push(`/runs/new?configId=${cfg.id}`)}
                                >
                                    <Play className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Duplicate"
                                    onClick={() => toast.info("Duplicate coming soon.")}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Export"
                                    onClick={() => handleExport(cfg.id)}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Delete"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => { remove(cfg.id); toast.success("Deleted."); }}
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
