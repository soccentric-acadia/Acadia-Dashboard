/**
 * Generic result renderer — renders any TestResult in a structured layout.
 * This component is the default for ALL modules. Module-specific overrides
 * are registered in registry.ts and must be justified by genuine display needs.
 *
 * Layout (top to bottom):
 *   1. Header: status, severity, module, test name, timestamp, duration, sequence
 *   2. Error message banner (when non-empty)
 *   3. Reason key-value list
 *   4. Metrics section (typed values)
 *   5. Monitoring section (collapsible)
 *   6. Event section (collapsible)
 *   7. Subtests (recursive, indented)
 *   8. Raw payload viewer (collapsible)
 */
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SeverityChip } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, AlertCircle, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDurationNs, formatRelativeTime } from "@/lib/utils";
import { toDisplayString, isNumeric } from "@/lib/value/typed";
import { shouldShowSeverity } from "@/lib/status";
import { getModuleLabel } from "@/lib/utils";
import type { TestResult, TypedValue } from "@/lib/api/types";

export interface ResultRendererProps {
    result: TestResult;
    /** Nesting depth — controls indentation for subtests. Default 0. */
    depth?: number;
    /** Callback when user clicks the chart affordance on a metric key. */
    onChartKey?: (source: "metrics" | "monitoring" | "event", key: string) => void;
}

export function GenericResultRenderer({ result, depth = 0, onChartKey }: ResultRendererProps) {
    const hasErrorMessage = Boolean(result.error_message);
    const hasReason = Object.keys(result.reason ?? {}).length > 0;
    const hasMetrics = Object.keys(result.metrics ?? {}).length > 0;
    const hasMonitoring = Object.keys(result.monitoring ?? {}).length > 0;
    const hasEvent = Object.keys(result.event ?? {}).length > 0;
    const hasSubtests = (result.subtests ?? []).length > 0;
    const hasPayload = Boolean(result.payload_b64);

    return (
        <div className={cn("space-y-2", depth > 0 && "pl-4 border-l-2 border-muted ml-2")}>
            {/* ── 1. Header ─────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={result.status} severity={result.severity} />
                {shouldShowSeverity(result.severity) && (
                    <SeverityChip severity={result.severity} />
                )}
                <span className="font-medium text-sm">
                    {getModuleLabel(result.module_id)}
                </span>
                {result.test_id && result.test_id !== result.name && (
                    <span className="font-mono text-xs text-muted-foreground">{result.test_id}</span>
                )}
                {result.name && (
                    <span className="text-sm text-muted-foreground">{result.name}</span>
                )}
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    {result.sequence != null && (
                        <Badge variant="outline" className="text-xs font-mono">#{result.sequence}</Badge>
                    )}
                    <span title={new Date(result.timestamp).toLocaleString()}>
                        {formatRelativeTime(result.timestamp)}
                    </span>
                    {result.duration_ns > 0 && (
                        <span>{formatDurationNs(result.duration_ns)}</span>
                    )}
                </span>
            </div>

            {/* ── 2. Error message banner ───────────────────────────── */}
            {hasErrorMessage && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="break-all">{result.error_message}</span>
                </div>
            )}

            {/* ── 3. Reason ─────────────────────────────────────────── */}
            {hasReason && (
                <TypedMapSection
                    title="Reason"
                    entries={Object.entries(result.reason).map(([k, v]) => [k, { type: "string", value: v } as TypedValue])}
                    source="metrics"
                    onChartKey={undefined}
                    defaultOpen
                />
            )}

            {/* ── 4. Metrics ────────────────────────────────────────── */}
            {hasMetrics && (
                <TypedMapSection
                    title="Metrics"
                    entries={Object.entries(result.metrics)}
                    source="metrics"
                    onChartKey={onChartKey}
                    defaultOpen
                />
            )}

            {/* ── 5. Monitoring ─────────────────────────────────────── */}
            {hasMonitoring && (
                <TypedMapSection
                    title="Monitoring"
                    entries={Object.entries(result.monitoring)}
                    source="monitoring"
                    onChartKey={onChartKey}
                    defaultOpen={false}
                />
            )}

            {/* ── 6. Event ──────────────────────────────────────────── */}
            {hasEvent && (
                <TypedMapSection
                    title="Event"
                    entries={Object.entries(result.event)}
                    source="event"
                    onChartKey={onChartKey}
                    defaultOpen={false}
                />
            )}

            {/* ── 7. Subtests ───────────────────────────────────────── */}
            {hasSubtests && (
                <CollapsibleSection title={`Subtests (${result.subtests.length})`} defaultOpen>
                    <div className="space-y-3 pt-1">
                        {result.subtests.map((sub, i) => (
                            <GenericResultRenderer
                                key={sub.id ?? `sub-${i}`}
                                result={sub}
                                depth={depth + 1}
                                onChartKey={onChartKey}
                            />
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* ── 8. Raw payload ────────────────────────────────────── */}
            {hasPayload && (
                <RawPayloadViewer
                    payloadB64={result.payload_b64}
                    payloadTypeUrl={result.payload_type_url}
                />
            )}
        </div>
    );
}

// ── Internal sub-components ───────────────────────────────────────────────────

function CollapsibleSection({
    title,
    defaultOpen = false,
    children,
}: {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground py-1"
                aria-expanded={open}
            >
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {title}
            </button>
            {open && children}
        </div>
    );
}

interface TypedMapSectionProps {
    title: string;
    entries: [string, TypedValue][];
    source: "metrics" | "monitoring" | "event";
    onChartKey: ((source: "metrics" | "monitoring" | "event", key: string) => void) | undefined;
    defaultOpen: boolean;
}

function TypedMapSection({ title, entries, source, onChartKey, defaultOpen }: TypedMapSectionProps) {
    if (entries.length === 0) return null;
    return (
        <CollapsibleSection title={`${title} (${entries.length})`} defaultOpen={defaultOpen}>
            <div className="rounded-md border divide-y text-sm">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                        <span className="text-muted-foreground font-mono text-xs shrink-0 min-w-[120px]">{key}</span>
                        <span className={cn(
                            "font-mono text-xs ml-auto",
                            val.type === "bool" && (val.value ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"),
                        )}>
                            {toDisplayString(val)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">{val.type}</span>
                        {onChartKey && isNumeric(val) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-1 opacity-50 hover:opacity-100"
                                title={`Chart ${key}`}
                                onClick={() => onChartKey(source, key)}
                                aria-label={`Add ${key} to chart`}
                            >
                                <BarChart2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </CollapsibleSection>
    );
}

function RawPayloadViewer({ payloadB64, payloadTypeUrl }: { payloadB64: string; payloadTypeUrl: string }) {
    const [showRaw, setShowRaw] = useState(false);
    const [decoded, setDecoded] = useState<string | null>(null);
    const [decodeError, setDecodeError] = useState<string | null>(null);

    const handleDecode = () => {
        try {
            const bytes = atob(payloadB64);
            // Attempt UTF-8 decode as JSON; fall back to raw bytes hex
            const text = new TextDecoder("utf-8", { fatal: false }).decode(
                Uint8Array.from(bytes, (c) => c.charCodeAt(0)),
            );
            // Attempt JSON parse for pretty printing
            try {
                const obj = JSON.parse(text);
                setDecoded(JSON.stringify(obj, null, 2));
            } catch {
                setDecoded(text);
            }
        } catch (e) {
            setDecodeError((e as Error).message);
        }
    };

    return (
        <CollapsibleSection title="Raw payload" defaultOpen={false}>
            <div className="space-y-2 pt-1">
                {payloadTypeUrl && (
                    <p className="text-xs text-muted-foreground font-mono">
                        type: {payloadTypeUrl}
                    </p>
                )}
                {!decoded && !decodeError && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDecode}>
                        Decode payload
                    </Button>
                )}
                {decodeError && (
                    <p className="text-xs text-destructive">Decode failed: {decodeError}</p>
                )}
                {decoded && (
                    <pre className="max-h-48 overflow-y-auto rounded bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all">
                        {decoded}
                    </pre>
                )}
                {showRaw ? (
                    <>
                        <Separator />
                        <pre className="max-h-32 overflow-y-auto rounded bg-muted px-3 py-2 text-[10px] font-mono break-all">
                            {payloadB64}
                        </pre>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRaw(false)}>
                            Hide base64
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRaw(true)}>
                        Show base64
                    </Button>
                )}
            </div>
        </CollapsibleSection>
    );
}
