"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Activity, AlertTriangle, ArrowRight, Cpu, Database, FileText, RadioTower, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGlobalLogs, getHealth, getModules, getRuns, getTarget } from "@/lib/api";
import { modulesForOfflineDisplay, writeCachedModules } from "@/lib/modules/catalog";

function statusVariant(status: string | undefined): "success" | "warning" | "destructive" | "secondary" {
    const normalized = status?.toLowerCase() ?? "";
    if (normalized.includes("ok") || normalized.includes("online") || normalized.includes("pass") || normalized.includes("complete")) return "success";
    if (normalized.includes("warn") || normalized.includes("running") || normalized.includes("pending")) return "warning";
    if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("offline")) return "destructive";
    return "secondary";
}

export default function DashboardPage() {
    const health = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 10_000 });
    const target = useQuery({ queryKey: ["target"], queryFn: getTarget, retry: 1, refetchInterval: 15_000 });
    const liveModules = useQuery({ queryKey: ["modules"], queryFn: getModules });
    const runs = useQuery({ queryKey: ["runs", "dashboard"], queryFn: () => getRuns({ limit: 8 }), refetchInterval: 15_000 });
    const logs = useQuery({ queryKey: ["logs", "dashboard"], queryFn: () => getGlobalLogs({ limit: 8 }), refetchInterval: 15_000 });

    useEffect(() => {
        if (liveModules.data && liveModules.data.length > 0) writeCachedModules(liveModules.data);
    }, [liveModules.data]);

    const modules = useMemo(() => modulesForOfflineDisplay(liveModules.data), [liveModules.data]);
    const categories = useMemo(() => Array.from(new Set(modules.map((module) => module.category || "Uncategorized"))).sort(), [modules]);
    const serverOnline = !health.isError && health.data?.status === "ok";
    const latestRun = runs.data?.runs?.[0];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant={serverOnline ? "success" : "destructive"}>{serverOnline ? "Server online" : "Server offline"}</Badge>
                            <Badge variant={statusVariant(target.data?.status)}>{target.data?.status ?? "Target unknown"}</Badge>
                        </div>
                        <CardTitle className="text-3xl">Acadia IV&V Dashboard</CardTitle>
                        <CardDescription className="mt-2 max-w-3xl">
                            Single-target operator view for module inventory, run state, recent evidence, logs, and system identity.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/modules"><Button type="button" variant="outline">All modules <ArrowRight size={16} /></Button></Link>
                        <Link href="/logs"><Button type="button" variant="secondary">Logs <FileText size={16} /></Button></Link>
                    </div>
                </CardHeader>
            </Card>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card><CardHeader><CardDescription>Modules</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Cpu size={24} />{modules.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Categories</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Database size={24} />{categories.length}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Recent runs</CardDescription><CardTitle className="flex items-center gap-2 text-3xl"><Activity size={24} />{runs.data?.runs?.length ?? 0}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Server version</CardDescription><CardTitle className="flex items-center gap-2 text-xl"><Server size={22} />{health.data?.version ?? "Unavailable"}</CardTitle></CardHeader></Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Module Inventory</CardTitle>
                        <CardDescription>{liveModules.isError ? "Showing cached or baseline modules while the server is unreachable." : "Server-discovered modules with API metadata."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-zinc-100 text-left dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-3 py-2">Module</th>
                                        <th className="px-3 py-2">Category</th>
                                        <th className="px-3 py-2">Version</th>
                                        <th className="px-3 py-2">Config type</th>
                                        <th className="px-3 py-2">Result type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((module) => (
                                        <tr key={module.id} className="border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60">
                                            <td className="px-3 py-2"><Link href={`/modules/${module.id}`} className="font-semibold text-sky-700 hover:underline dark:text-sky-300">{module.name || module.id}</Link><div className="text-xs text-zinc-500">{module.id}</div></td>
                                            <td className="px-3 py-2"><Badge variant="outline">{module.category || "Module"}</Badge></td>
                                            <td className="px-3 py-2">{module.version || "n/a"}</td>
                                            <td className="max-w-[220px] truncate px-3 py-2 text-xs text-zinc-500">{module.config_type_url || "Not reported"}</td>
                                            <td className="max-w-[220px] truncate px-3 py-2 text-xs text-zinc-500">{module.result_type_url || "Not reported"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Target</CardTitle>
                            <CardDescription>{target.data?.hostname ?? "No connected target identity reported."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">Model</span><span className="font-medium">{target.data?.model ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">OS</span><span className="font-medium">{target.data?.os_version ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">HAL</span><span className="font-medium">{target.data?.hal_version ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">Client</span><span className="font-medium">{target.data?.client_version ?? "Unknown"}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Latest Run</CardTitle>
                            <CardDescription>{latestRun?.id ?? "No run history loaded."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3"><span className="text-zinc-500">Status</span><Badge variant={statusVariant(latestRun?.status)}>{latestRun?.status ?? "None"}</Badge></div>
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">Mode</span><span className="font-medium">{latestRun?.mode ?? "n/a"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-zinc-500">Created</span><span className="font-medium">{latestRun?.created_at ? new Date(latestRun.created_at).toLocaleString() : "n/a"}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><RadioTower size={18} /> Recent Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(logs.data?.logs ?? []).slice(0, 5).map((entry) => (
                                <div key={entry.id || `${entry.timestamp}-${entry.message}`} className="text-sm">
                                    <div className="flex items-center gap-2"><Badge variant={statusVariant(entry.level || entry.severity)}>{entry.level || entry.severity || "info"}</Badge><span className="text-xs text-zinc-500">{entry.source || "system"}</span></div>
                                    <p className="mt-1 line-clamp-2 text-zinc-700 dark:text-zinc-200">{entry.message}</p>
                                    <Separator className="mt-2" />
                                </div>
                            ))}
                            {(logs.data?.logs ?? []).length === 0 && <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-3 text-sm text-zinc-500 dark:bg-zinc-800"><AlertTriangle size={16} /> No logs available.</div>}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}