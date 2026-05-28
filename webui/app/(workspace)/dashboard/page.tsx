"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Cpu, Database, FileText, RadioTower, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

    const PAGE_SIZE = 10;
    const [inventoryPage, setInventoryPage] = useState(0);
    const pageCount = Math.ceil(modules.length / PAGE_SIZE);
    const pagedModules = modules.slice(inventoryPage * PAGE_SIZE, (inventoryPage + 1) * PAGE_SIZE);

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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Config type</TableHead>
                                    <TableHead>Result type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedModules.map((module) => (
                                    <TableRow key={module.id}>
                                        <TableCell><Link href={`/modules/${module.id}`} className="font-semibold text-primary hover:underline">{module.name || module.id}</Link><div className="text-xs text-muted-foreground">{module.id}</div></TableCell>
                                        <TableCell><Badge variant="outline">{module.category || "Module"}</Badge></TableCell>
                                        <TableCell>{module.version || "n/a"}</TableCell>
                                        <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{module.config_type_url || "Not reported"}</TableCell>
                                        <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{module.result_type_url || "Not reported"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {pageCount > 1 && (
                            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                                <span>{inventoryPage * PAGE_SIZE + 1}–{Math.min((inventoryPage + 1) * PAGE_SIZE, modules.length)} of {modules.length}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={inventoryPage === 0}
                                        onClick={() => setInventoryPage((p) => p - 1)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="px-2">{inventoryPage + 1} / {pageCount}</span>
                                    <button
                                        type="button"
                                        disabled={inventoryPage >= pageCount - 1}
                                        onClick={() => setInventoryPage((p) => p + 1)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Target</CardTitle>
                            <CardDescription>{target.data?.hostname ?? "No connected target identity reported."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Model</span><span className="font-medium">{target.data?.model ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">OS</span><span className="font-medium">{target.data?.os_version ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">HAL</span><span className="font-medium">{target.data?.hal_version ?? "Unknown"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Client</span><span className="font-medium">{target.data?.client_version ?? "Unknown"}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Latest Run</CardTitle>
                            <CardDescription>{latestRun?.id ?? "No run history loaded."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Badge variant={statusVariant(latestRun?.status)}>{latestRun?.status ?? "None"}</Badge></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Mode</span><span className="font-medium">{latestRun?.mode ?? "n/a"}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Created</span><span className="font-medium">{latestRun?.created_at ? new Date(latestRun.created_at).toLocaleString() : "n/a"}</span></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><RadioTower size={18} /> Recent Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(logs.data?.logs ?? []).slice(0, 5).map((entry) => (
                                <div key={entry.id || `${entry.timestamp}-${entry.message}`} className="text-sm">
                                    <div className="flex items-center gap-2"><Badge variant={statusVariant(entry.level || entry.severity)}>{entry.level || entry.severity || "info"}</Badge><span className="text-xs text-muted-foreground">{entry.source || "system"}</span></div>
                                    <p className="mt-1 line-clamp-2 text-foreground">{entry.message}</p>
                                    <Separator className="mt-2" />
                                </div>
                            ))}
                            {(logs.data?.logs ?? []).length === 0 && <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><AlertTriangle size={16} /> No logs available.</div>}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}