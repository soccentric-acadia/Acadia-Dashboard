/**
 * ResultTable — TanStack Table rendering of TestResult arrays.
 *
 * Default columns:
 *   sequence | timestamp | status | severity | test | duration | top metrics (up to 3)
 *
 * Features:
 *   - Multi-select status filter chip group (all 6 values)
 *   - Multi-select severity filter
 *   - Free-text search across name, test_id, error_message, reason values
 *   - Metric columns sorted via TypedValue compare()
 *   - Click row → expanded GenericResultRenderer
 *   - Configurable: metricKeys prop selects which metric columns to show
 */
"use client";

import React, { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
} from "@tanstack/react-table";
import { StatusBadge, SeverityChip } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDurationNs, formatRelativeTime } from "@/lib/utils";
import { toDisplayString, compare as compareTypedValues, isNumeric } from "@/lib/value/typed";
import { STATUS_ORDER, SEVERITY_ORDER, shouldShowSeverity } from "@/lib/status";
import { GenericResultRenderer } from "@/components/results/renderers/generic";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import type { TestResult, Status, Severity, TypedValue } from "@/lib/api/types";

const colHelper = createColumnHelper<TestResult>();

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ResultTableProps {
    results: TestResult[];
    /** Which metric keys to render as extra columns (default: first 3 numeric keys found). */
    metricKeys?: string[];
    /** Callback when user clicks the chart affordance for a metric key. */
    onChartKey?: (source: "metrics" | "monitoring" | "event", key: string) => void;
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResultTable({ results, metricKeys, onChartKey, className }: ResultTableProps) {
    const [sorting, setSorting] = useState<SortingState>([{ id: "sequence", desc: false }]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set());
    const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Determine metric columns: prop override or auto-detect first 3 numeric keys
    const resolvedMetricKeys = useMemo(() => {
        if (metricKeys) return metricKeys.slice(0, 3);
        const keys = new Set<string>();
        for (const r of results) {
            if (keys.size >= 3) break;
            for (const [k, v] of Object.entries(r.metrics ?? {})) {
                if (isNumeric(v)) { keys.add(k); if (keys.size >= 3) break; }
            }
        }
        return Array.from(keys);
    }, [results, metricKeys]);

    // Filter results by status/severity chips and global search
    const filtered = useMemo(() => {
        let rows = results;
        if (selectedStatuses.size > 0) {
            rows = rows.filter((r) => selectedStatuses.has(r.status as Status));
        }
        if (selectedSeverities.size > 0) {
            rows = rows.filter((r) => selectedSeverities.has(r.severity as Severity));
        }
        if (globalFilter.trim()) {
            const q = globalFilter.toLowerCase();
            rows = rows.filter((r) =>
                r.name?.toLowerCase().includes(q) ||
                r.test_id?.toLowerCase().includes(q) ||
                r.error_message?.toLowerCase().includes(q) ||
                Object.values(r.reason ?? {}).some((v) => v.toLowerCase().includes(q))
            );
        }
        return rows;
    }, [results, selectedStatuses, selectedSeverities, globalFilter]);

    const columns = useMemo(() => [
        colHelper.accessor("sequence", {
            header: "#",
            cell: (info) => (
                <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
            ),
            size: 56,
        }),
        colHelper.accessor("timestamp", {
            header: "Time",
            cell: (info) => (
                <span
                    className="text-xs whitespace-nowrap text-muted-foreground"
                    title={new Date(info.getValue()).toLocaleString()}
                >
                    {formatRelativeTime(info.getValue())}
                </span>
            ),
            size: 100,
        }),
        colHelper.accessor("status", {
            header: "Status",
            cell: (info) => (
                <StatusBadge status={info.getValue()} severity={info.row.original.severity} />
            ),
            sortingFn: (a, b) => {
                const ai = STATUS_ORDER.indexOf(a.original.status as Status);
                const bi = STATUS_ORDER.indexOf(b.original.status as Status);
                return ai - bi;
            },
            size: 100,
        }),
        colHelper.accessor("severity", {
            header: "Severity",
            cell: (info) => {
                const sev = info.getValue() as Severity;
                return shouldShowSeverity(sev) ? <SeverityChip severity={sev} /> : null;
            },
            sortingFn: (a, b) => {
                const ai = SEVERITY_ORDER.indexOf(a.original.severity as Severity);
                const bi = SEVERITY_ORDER.indexOf(b.original.severity as Severity);
                return ai - bi;
            },
            size: 90,
        }),
        colHelper.accessor("name", {
            header: "Test",
            cell: (info) => (
                <div className="min-w-0">
                    <div className="text-sm truncate">{info.getValue() || info.row.original.test_id}</div>
                    {info.row.original.test_id && info.row.original.test_id !== info.getValue() && (
                        <div className="font-mono text-[10px] text-muted-foreground truncate">{info.row.original.test_id}</div>
                    )}
                </div>
            ),
            size: 200,
        }),
        colHelper.accessor("duration_ns", {
            header: "Duration",
            cell: (info) => (
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {info.getValue() > 0 ? formatDurationNs(info.getValue()) : "—"}
                </span>
            ),
            size: 90,
        }),
        // Dynamic metric columns
        ...resolvedMetricKeys.map((key) =>
            colHelper.display({
                id: `metric__${key}`,
                header: () => (
                    <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{key}</span>
                    </div>
                ),
                cell: ({ row }) => {
                    const val: TypedValue | undefined = row.original.metrics?.[key];
                    if (!val) return <span className="text-muted-foreground text-xs">—</span>;
                    return (
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-right">{toDisplayString(val, { precision: 4 })}</span>
                            {onChartKey && isNumeric(val) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-40 hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); onChartKey("metrics", key); }}
                                    aria-label={`Chart ${key}`}
                                >
                                    📈
                                </Button>
                            )}
                        </div>
                    );
                },
                sortingFn: (a, b) => {
                    const av = a.original.metrics?.[key];
                    const bv = b.original.metrics?.[key];
                    if (!av || !bv) return av ? 1 : bv ? -1 : 0;
                    const cmp = compareTypedValues(av, bv);
                    return cmp ?? 0;
                },
                size: 110,
            })
        ),
    ], [resolvedMetricKeys, onChartKey]);

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getRowId: (row, index) => row.id ?? String(index),
    });

    const toggleStatus = (s: Status) => {
        setSelectedStatuses((prev) => {
            const next = new Set(prev);
            if (next.has(s)) next.delete(s); else next.add(s);
            return next;
        });
    };
    const toggleSeverity = (s: Severity) => {
        setSelectedSeverities((prev) => {
            const next = new Set(prev);
            if (next.has(s)) next.delete(s); else next.add(s);
            return next;
        });
    };
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    placeholder="Search name, test_id, error…"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="h-8 max-w-xs text-sm"
                    aria-label="Search results"
                />
                <div className="flex flex-wrap gap-1">
                    {STATUS_ORDER.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => toggleStatus(s)}
                            className={cn(
                                "h-6 rounded-full px-2 text-xs font-medium border transition-colors",
                                selectedStatuses.has(s)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:text-foreground"
                            )}
                            aria-pressed={selectedStatuses.has(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1">
                    {SEVERITY_ORDER.filter((s) => s !== "INFO").map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => toggleSeverity(s)}
                            className={cn(
                                "h-6 rounded-full px-2 text-xs font-medium border transition-colors",
                                selectedSeverities.has(s)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border text-muted-foreground hover:text-foreground"
                            )}
                            aria-pressed={selectedSeverities.has(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                    {results.length === 0 ? "No results yet." : "No results match the current filters."}
                </div>
            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {/* expand toggle column */}
                                    <th className="w-6 px-2" />
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            className={cn(
                                                "px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
                                                header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground",
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                            aria-sort={
                                                header.column.getIsSorted() === "asc" ? "ascending"
                                                    : header.column.getIsSorted() === "desc" ? "descending"
                                                        : undefined
                                            }
                                        >
                                            <span className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getIsSorted() === "asc" && <ChevronUp className="h-3 w-3" />}
                                                {header.column.getIsSorted() === "desc" && <ChevronDown className="h-3 w-3" />}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y">
                            {table.getRowModel().rows.map((row) => {
                                const id = row.id;
                                const isExpanded = expandedIds.has(id);
                                return (
                                    <React.Fragment key={id}>
                                        <tr
                                            className="hover:bg-muted/30 cursor-pointer"
                                            onClick={() => toggleExpand(id)}
                                        >
                                            <td className="px-2 w-6">
                                                {isExpanded
                                                    ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                }
                                            </td>
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="px-3 py-2 align-middle">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={row.getVisibleCells().length + 1} className="px-4 pb-4 pt-2 bg-muted/20">
                                                    <GenericResultRenderer
                                                        result={row.original}
                                                        onChartKey={onChartKey}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="text-xs text-muted-foreground">
                {filtered.length !== results.length
                    ? `Showing ${filtered.length} of ${results.length} results`
                    : `${results.length} result${results.length !== 1 ? "s" : ""}`}
            </div>
        </div>
    );
}
