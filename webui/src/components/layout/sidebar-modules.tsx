"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Circle, CheckCircle2, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModuleRegistry, getCategoryForModule, getModuleLabel } from "@/lib/proto/registry";
import type { ModuleInfo } from "@/lib/proto/registry";
import { useBoard } from "@/lib/board/context";
import { useRuns } from "@/lib/api/queries";

type ModuleStatus = "idle" | "running" | "pass" | "fail" | "never";

function StatusDot({ status }: { status: ModuleStatus }) {
    if (status === "running") return <Circle className="h-2.5 w-2.5 fill-blue-400 text-blue-400 animate-pulse" />;
    if (status === "pass") return <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />;
    if (status === "fail") return <XCircle className="h-2.5 w-2.5 text-red-500" />;
    if (status === "idle") return <Circle className="h-2.5 w-2.5 text-muted-foreground" />;
    return <Minus className="h-2.5 w-2.5 text-muted-foreground/40" />;
}

export function SidebarModules() {
    const pathname = usePathname();
    const { board } = useBoard();

    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    // Fetch run statuses to derive per-module live status.
    const clientId = board?.clientId;
    const { data: runsData } = useRuns(clientId ? { clientId, limit: 100 } : { limit: 0 });

    useEffect(() => {
        getModuleRegistry().then(setModules).catch(() => { });
    }, []);

    // Derive module statuses from recent runs.
    const moduleStatuses = useMemo<Record<string, ModuleStatus>>(() => {
        const statuses: Record<string, ModuleStatus> = {};
        const edges = runsData?.edges ?? [];
        for (const { node: run } of edges) {
            const prev = statuses[run.moduleId];
            if (run.state === "running") {
                statuses[run.moduleId] = "running";
            } else if (!prev || prev === "never") {
                if (run.passFail === true) statuses[run.moduleId] = "pass";
                else if (run.passFail === false) statuses[run.moduleId] = "fail";
                else statuses[run.moduleId] = "idle";
            }
        }
        return statuses;
    }, [runsData]);

    const grouped = useMemo(() => {
        const map = new Map<string, ModuleInfo[]>();
        for (const mod of modules) {
            const cat = getCategoryForModule(mod.id);
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(mod);
        }
        return map;
    }, [modules]);

    const toggleCategory = (cat: string) =>
        setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

    const categorySortOrder = [
        "Processor", "Sensors", "Camera", "Audio", "Network",
        "Display", "Peripherals", "Timing", "Safety", "Debug", "Other",
    ];

    const sortedCategories = Array.from(grouped.keys()).sort(
        (a, b) => categorySortOrder.indexOf(a) - categorySortOrder.indexOf(b)
    );

    return (
        <aside className="flex h-full w-56 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-4 shrink-0">
                <span className="font-semibold tracking-tight text-sm">Acadia IV&amp;V</span>
            </div>

            {modules.length === 0 && (
                <div className="flex flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
                    Loading modules…
                </div>
            )}

            <nav className="flex-1 overflow-y-auto py-2">
                {sortedCategories.map((cat) => {
                    const mods = grouped.get(cat) ?? [];
                    const isCollapsed = collapsed[cat] ?? false;
                    return (
                        <div key={cat}>
                            <button
                                onClick={() => toggleCategory(cat)}
                                className="flex w-full items-center gap-1 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {isCollapsed ? (
                                    <ChevronRight className="h-3 w-3" />
                                ) : (
                                    <ChevronDown className="h-3 w-3" />
                                )}
                                {cat}
                            </button>

                            {!isCollapsed && mods.map((mod) => {
                                const active = pathname === `/modules/${mod.id}`;
                                const status: ModuleStatus = moduleStatuses[mod.id] ?? "never";
                                return (
                                    <Link
                                        key={mod.id}
                                        href={`/modules/${mod.id}`}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md mx-1 px-2 py-1.5 text-xs transition-colors",
                                            active
                                                ? "bg-accent text-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                                        )}
                                    >
                                        <StatusDot status={status} />
                                        <span className="truncate">{getModuleLabel(mod.id)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
