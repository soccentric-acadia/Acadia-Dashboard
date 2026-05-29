"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Cpu, FileText, FlaskConical, RadioTower, Server, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGlobalLogs, getModules, getRuns, getRunResults, getTarget } from "@/lib/api";
import { modulesForOfflineDisplay, testsForModule, writeCachedModules } from "@/lib/modules/catalog";
import { useAppShell } from "@/state/app-shell-context";

function statusVariant(status: string | undefined): "success" | "warning" | "destructive" | "secondary" {
    const normalized = status?.toLowerCase() ?? "";
    if (normalized.includes("ok") || normalized.includes("online") || normalized.includes("pass") || normalized.includes("complete")) return "success";
    if (normalized.includes("warn") || normalized.includes("running") || normalized.includes("pending")) return "warning";
    if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("offline")) return "destructive";
    return "secondary";
}

export default function DashboardPage() {
    const { serverOnline } = useAppShell();
    const target = useQuery({ queryKey: ["target"], queryFn: getTarget, retry: 1, refetchInterval: 15_000 });
    const liveModules = useQuery({ queryKey: ["modules"], queryFn: getModules });
    const runs = useQuery({ queryKey: ["runs", "dashboard"], queryFn: () => getRuns({ limit: 20 }), refetchInterval: 15_000, enabled: serverOnline !== false });
    const logs = useQuery({ queryKey: ["logs", "dashboard"], queryFn: () => getGlobalLogs({ limit: 8 }), refetchInterval: 15_000, enabled: serverOnline !== false });

    useEffect(() => {
        if (liveModules.data && liveModules.data.length > 0) writeCachedModules(liveModules.data);
    }, [liveModules.data]);

    const modules = useMemo(() => modulesForOfflineDisplay(liveModules.data), [liveModules.data]);
    const latestRun = runs.data?.runs?.[0] ?? null;

    // Per-module test counts from local HAL catalog
    const moduleTestCounts = useMemo(
        () => Object.fromEntries(modules.map((m) => [m.id, testsForModule(m).length])),
        [modules],
    );
    const totalTests = useMemo(() => modules.reduce((s, m) => s + (moduleTestCounts[m.id] ?? 0), 0), [modules, moduleTestCounts]);

    // Module enabled states from localStorage
    const [moduleEnabledMap, setModuleEnabledMap] = useState<Record<string, boolean>>({});
    useEffect(() => {
        if (modules.length === 0) return;
        const map: Record<string, boolean> = {};
        for (const m of modules) {
            const raw = window.localStorage.getItem(`acadia.module-enabled.${m.id}`);
            map[m.id] = raw === null ? true : raw === "true";
        }
        setModuleEnabledMap(map);
    }, [modules.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const enabledModuleCount = modules.filter((m) => moduleEnabledMap[m.id] !== false).length;

    // Latest run results for pass/fail stats
    const { data: latestResultsData } = useQuery({
        queryKey: ["run-results-all-dashboard", latestRun?.id],
        queryFn: () => getRunResults(latestRun!.id, { limit: 2000 }),
        enabled: Boolean(latestRun?.id) && serverOnline !== false,
    });

    const runResultStats = useMemo(() => {
        const results = latestResultsData?.results;
        if (!results?.length) return null;
        const pass = results.filter((r) => r.status?.toLowerCase().includes("pass")).length;
        const fail = results.filter((r) => r.status?.toLowerCase().includes("fail") || r.status?.toLowerCase().includes("error")).length;
        return { pass, fail, total: results.length };
    }, [latestResultsData]);

    // Per-module result status from latest run
    const moduleResultStatus = useMemo(() => {
        const map: Record<string, { anyFailed: boolean }> = {};
        for (const r of latestResultsData?.results ?? []) {
            if (!r.module_id) continue;
            if (!map[r.module_id]) map[r.module_id] = { anyFailed: false };
            if (r.status?.toLowerCase().includes("fail") || r.status?.toLowerCase().includes("error")) {
                map[r.module_id].anyFailed = true;
            }
        }
        return map;
    }, [latestResultsData]);

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

            {/* ── Stats row ── */}
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Modules</CardDescription>
                        <CardTitle className="flex items-center gap-2 text-3xl"><Cpu size={24} />{modules.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                        <span className="text-success font-medium">{enabledModuleCount} enabled</span>
                        {" · "}
                        <span className={modules.length - enabledModuleCount > 0 ? "text-destructive font-medium" : ""}>{modules.length - enabledModuleCount} disabled</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Tests</CardDescription>
                        <CardTitle className="flex items-center gap-2 text-3xl"><FlaskConical size={24} />{totalTests}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                        across {modules.length} modules
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Last Run</CardDescription>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Activity size={22} />
                            {latestRun
                                ? <Badge variant={statusVariant(latestRun.status)}>{latestRun.status}</Badge>
                                : <span className="text-muted-foreground text-base">No runs</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs">
                        {runResultStats ? (
                            <span>
                                <span className="text-success font-medium">{runResultStats.pass} passed</span>
                                {" · "}
                                <span className={runResultStats.fail > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>{runResultStats.fail} failed</span>
                                <span className="text-muted-foreground"> of {runResultStats.total}</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">No result data</span>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Server version</CardDescription>
                        <CardTitle className="flex items-center gap-2 text-xl"><Server size={22} />{serverOnline ? (liveModules.data ? "Online" : "—") : "Offline"}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground font-mono">
                        {target.data?.hal_version ? `HAL ${target.data.hal_version}` : target.data?.client_version ? `Client ${target.data.client_version}` : "No version info"}
                    </CardContent>
                </Card>
            </section>

            {/* ── Main layout ── */}
            <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Module Inventory</CardTitle>
                        <CardDescription>{liveModules.isError ? "Showing cached or baseline modules while the server is unreachable." : "Server-discovered modules — test counts from local HAL catalog, results from latest run."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Tests</TableHead>
                                    <TableHead>Last result</TableHead>
                                    <TableHead>Enabled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedModules.map((module) => {
                                    const testCount = moduleTestCounts[module.id] ?? 0;
                                    const enabled = moduleEnabledMap[module.id] !== false;
                                    const result = moduleResultStatus[module.id] ?? null;
                                    return (
                                        <TableRow key={module.id}>
                                            <TableCell>
                                                <Link href={`/modules/${module.id}`} className="font-semibold text-primary hover:underline">{module.name || module.id}</Link>
                                                <div className="text-xs text-muted-foreground">{module.id}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{module.category || "Module"}</Badge></TableCell>
                                            <TableCell className="text-sm">{testCount}</TableCell>
                                            <TableCell>
                                                {result ? (
                                                    result.anyFailed
                                                        ? <span className="flex items-center gap-1 text-xs text-destructive"><XCircle size={13} />Failed</span>
                                                        : <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 size={13} />Passed</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={enabled ? "success" : "destructive"}>{enabled ? "On" : "Off"}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                            {runResultStats && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Passed</span>
                                        <span className="flex items-center gap-1 font-medium text-success"><CheckCircle2 size={13} />{runResultStats.pass}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-muted-foreground">Failed</span>
                                        <span className={`flex items-center gap-1 font-medium ${runResultStats.fail > 0 ? "text-destructive" : "text-muted-foreground"}`}><XCircle size={13} />{runResultStats.fail}</span>
                                    </div>
                                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Total results</span><span className="font-medium">{runResultStats.total}</span></div>
                                </>
                            )}
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

