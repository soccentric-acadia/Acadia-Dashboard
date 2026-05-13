"use client";

import Link from "next/link";
import { useConfigStore } from "@/lib/config-store";
import { getModuleLabel, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MODE_LABELS: Record<string, string> = {
    single_shot: "Single Shot",
    long_term: "Long Term",
    monitoring: "Monitoring",
    event_based: "Event Based",
};

export default function ConfigsPage() {
    const { configs, remove } = useConfigStore();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Configurations</h1>
                <Button asChild>
                    <Link href="/configs/new"><Plus className="mr-2 h-4 w-4" />New config</Link>
                </Button>
            </div>

            {!configs.length ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                    <Settings2 className="h-12 w-12" />
                    <p className="font-medium">No saved configurations</p>
                    <p className="text-sm">Create a configuration to define how a module should be tested.</p>
                    <Button asChild>
                        <Link href="/configs/new"><Plus className="mr-2 h-4 w-4" />Create your first config</Link>
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Module</th>
                                <th className="px-4 py-3 text-left font-medium">Mode</th>
                                <th className="px-4 py-3 text-left font-medium">Created</th>
                                <th className="px-4 py-3 text-right font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map((c) => (
                                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{c.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{getModuleLabel(c.moduleId)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{MODE_LABELS[c.mode] ?? c.mode}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatRelativeTime(c.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/configs/${c.id}`}>View</Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => {
                                                    remove(c.id);
                                                    toast.success(`"${c.name}" deleted`);
                                                }}
                                                aria-label="Delete config"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
