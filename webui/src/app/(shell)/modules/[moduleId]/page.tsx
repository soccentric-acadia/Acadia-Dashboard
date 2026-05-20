"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { motion } from "motion/react";
import { MODULE_CATALOG } from "@/proto/module-catalog";
import { getModuleLabel, cn } from "@/lib/utils";
import { useModuleResults, useIsSimulated } from "@/data";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { LiveDot } from "@/components/primitives/live-dot";
import type { LiveDotState } from "@/components/primitives/live-dot";
import { Sparkline } from "@/components/primitives/sparkline";
import { SectionCard } from "@/components/primitives/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResultTable } from "@/components/results/result-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from "recharts";
import {
  ArrowLeft, AlertCircle, TrendingUp, BarChart2, Grid,
  Settings2, Code2, FlaskConical, History, Map, Info,
} from "lucide-react";
import { isFailureStatus } from "@/lib/status";
import { numericKeys, extractNumericSeries } from "@/lib/value/typed";
import type { Status, TestResult } from "@/lib/api/types";
import { pageVariants } from "@/components/motion/presets";

// ─── helpers ─────────────────────────────────────────────────────────────────

function lastDotState(results: TestResult[]): LiveDotState {
  if (!results.length) return "idle";
  const last = results[results.length - 1];
  const s: string = last.status;
  if (s === "PASS") return "pass";
  if (s === "FAIL" || s === "ERROR") return "fail";
  return "idle";
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

function OverviewTab({ results, latestResult }: { results: TestResult[]; latestResult: TestResult | undefined }) {
  const keys = numericKeys(results, "metrics");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Last Result">
        {latestResult ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={latestResult.status} />
              <span className="text-xs text-muted-foreground font-mono">{latestResult.test_id}</span>
            </div>
            {latestResult.error_message && (
              <p className="text-xs text-status-fail font-mono break-all">{latestResult.error_message}</p>
            )}
            {keys.length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {keys.map((k) => {
                  const m = latestResult.metrics[k];
                  return (
                    <div key={k} className="flex justify-between gap-2 text-xs rounded bg-muted/30 px-2 py-1">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono">{typeof m?.value === "number" ? m.value.toFixed(4) : String(m?.value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No results yet</p>
        )}
      </SectionCard>

      <SectionCard title="Activity">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Total results</span><span className="font-semibold">{results.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Failures</span>
            <span className={cn("font-semibold", results.filter((r) => isFailureStatus(r.status as Status)).length > 0 ? "text-status-fail" : "text-status-pass")}>
              {results.filter((r) => isFailureStatus(r.status as Status)).length}
            </span>
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Pass rate</span>
            <span className="font-semibold">
              {results.length ? `${Math.round((results.filter((r) => !isFailureStatus(r.status as Status)).length / results.length) * 100)}%` : "—"}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function HistoryTab({ results }: { results: TestResult[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} across all runs</p>
      <ResultTable results={results} />
    </div>
  );
}

function TrendTab({ results }: { results: TestResult[] }) {
  const keys = React.useMemo(() => numericKeys(results, "metrics"), [results]);
  const [metricKey, setMetricKey] = React.useState(() => keys[0] ?? "");
  React.useEffect(() => { if (!metricKey && keys[0]) setMetricKey(keys[0]); }, [keys, metricKey]);

  const series = React.useMemo(() => extractNumericSeries(results, "metrics", metricKey).map((p, i) => ({ ...p, index: i })), [results, metricKey]);
  const values = series.map((p) => p.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  if (!keys.length) return <p className="text-sm text-muted-foreground">No numeric metrics available.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Metric</Label>
        <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className="h-7 rounded border border-input bg-background px-2 text-xs">
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        {values.length > 0 && <span className="text-xs text-muted-foreground">avg: <strong>{avg.toFixed(4)}</strong></span>}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="index" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={60} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "avg", position: "insideTopRight", fontSize: 10 }} />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} name={metricKey} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistributionTab({ results }: { results: TestResult[] }) {
  const keys = React.useMemo(() => numericKeys(results, "metrics"), [results]);
  const [metricKey, setMetricKey] = React.useState(() => keys[0] ?? "");
  React.useEffect(() => { if (!metricKey && keys[0]) setMetricKey(keys[0]); }, [keys, metricKey]);

  const histData = React.useMemo(() => {
    const series = extractNumericSeries(results, "metrics", metricKey).map((p) => p.value);
    if (!series.length) return [];
    const min = Math.min(...series), max = Math.max(...series);
    const bins = 20;
    const step = (max - min) / bins || 1;
    const buckets = Array.from({ length: bins }, (_, i) => ({
      label: (min + i * step).toFixed(2),
      count: 0,
    }));
    series.forEach((v) => {
      const idx = Math.min(Math.floor((v - min) / step), bins - 1);
      buckets[idx].count++;
    });
    return buckets;
  }, [results, metricKey]);

  const values = extractNumericSeries(results, "metrics", metricKey).map((p) => p.value);
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance = values.length ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length : 0;

  if (!keys.length) return <p className="text-sm text-muted-foreground">No numeric metrics available.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Metric</Label>
        <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className="h-7 rounded border border-input bg-background px-2 text-xs">
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[["Mean", mean.toFixed(4)], ["Std dev", Math.sqrt(variance).toFixed(4)], ["Samples", String(values.length)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-3">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-mono font-semibold text-sm">{v}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={histData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeatmapTab({ results }: { results: TestResult[] }) {
  const runIds = React.useMemo(() => Array.from(new Set(results.map((r) => r.run_id))).slice(-20), [results]);
  const testIds = React.useMemo(() => Array.from(new Set(results.map((r) => r.test_id))).slice(0, 30), [results]);

  const cell = React.useMemo(() => {
    const map: Record<string, string> = {};
    results.forEach((r) => { map[`${r.run_id}__${r.test_id}`] = r.status; });
    return map;
  }, [results]);

  const color = (status: string | undefined) => {
    if (!status) return "bg-muted/30";
    if (status === "pass") return "bg-status-pass/30";
    if (status === "fail") return "bg-status-fail/30";
    if (status === "error") return "bg-status-error/30";
    return "bg-muted/30";
  };

  if (!runIds.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;

  return (
    <ScrollArea className="w-full">
      <div className="overflow-x-auto">
        <table className="text-[9px] border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground px-1 pb-1 font-normal">test / run →</th>
              {runIds.map((r) => <th key={r} className="text-muted-foreground font-normal pb-1 w-6 max-w-6 overflow-hidden text-ellipsis">{r.slice(-4)}</th>)}
            </tr>
          </thead>
          <tbody>
            {testIds.map((t) => (
              <tr key={t}>
                <td className="text-muted-foreground pr-2 py-0.5 text-[9px] whitespace-nowrap">{t}</td>
                {runIds.map((r) => {
                  const s = cell[`${r}__${t}`];
                  return <td key={r} className={cn("h-4 w-4 rounded-sm", color(s))} title={`${t}: ${s ?? "—"}`} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}

function ThresholdTab({ results }: { results: TestResult[] }) {
  const keys = React.useMemo(() => numericKeys(results, "metrics"), [results]);
  const [thresholds, setThresholds] = React.useState<Record<string, { min: string; max: string }>>({});

  const setThreshold = (k: string, field: "min" | "max", v: string) => {
    setThresholds((prev) => {
      const existing = prev[k] ?? { min: "", max: "" };
      return { ...prev, [k]: { ...existing, [field]: v } };
    });
  };

  if (!keys.length) return <p className="text-sm text-muted-foreground">No numeric metrics available.</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Define pass/fail boundaries for each metric. These are stored locally and highlighted in charts.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {keys.map((k) => (
          <div key={k} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="text-xs font-semibold">{k}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Min</Label>
                <Input placeholder="e.g. 0.5" className="h-7 text-xs font-mono"
                  value={thresholds[k]?.min ?? ""} onChange={(e) => setThreshold(k, "min", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Max</Label>
                <Input placeholder="e.g. 5.0" className="h-7 text-xs font-mono"
                  value={thresholds[k]?.max ?? ""} onChange={(e) => setThreshold(k, "max", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => console.log("thresholds:", thresholds)}>Save Thresholds</Button>
      <p className="text-[10px] text-muted-foreground">Note: threshold persistence coming in a future release.</p>
    </div>
  );
}

function ConfigTab({ moduleId }: { moduleId: string }) {
  const mod = MODULE_CATALOG[moduleId];
  if (!mod) return <p className="text-sm text-muted-foreground">Module not found in catalog.</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[["Module ID", mod.id], ["Category", mod.category], ["Display name", mod.displayName]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        Configuration fields are defined by the HAL proto descriptor. Use the Config Builder in the Configs section to create or edit configs for this module.
      </p>
      <Button size="sm" variant="outline" asChild>
        <Link href="/configs">Open Config Builder</Link>
      </Button>
    </div>
  );
}

function RawTab({ results }: { results: TestResult[] }) {
  const [idx, setIdx] = React.useState(0);
  const result = results[idx];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Result index</Label>
        <Input type="number" min={0} max={Math.max(0, results.length - 1)} value={idx}
          onChange={(e) => setIdx(Math.min(results.length - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          className="h-7 w-20 text-xs font-mono" />
        <span className="text-xs text-muted-foreground">of {results.length}</span>
      </div>
      <ScrollArea className="h-96">
        <pre className="text-[10px] font-mono rounded-lg bg-muted/30 p-3 whitespace-pre-wrap break-all">
          {result ? JSON.stringify(result, null, 2) : "No data"}
        </pre>
      </ScrollArea>
    </div>
  );
}

function SimulateTab({ moduleId }: { moduleId: string }) {
  const [pinStatus, setPinStatus] = React.useState("pass");
  const [injectFault, setInjectFault] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
        <div className="text-xs font-semibold text-purple-400">Simulation Controls</div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pin result status</Label>
          <div className="flex gap-2">
            {["pass", "fail", "error", "skip"].map((s) => (
              <button key={s} type="button"
                onClick={() => setPinStatus(s)}
                className={cn("rounded px-2 py-1 text-xs border transition-colors",
                  pinStatus === s ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border text-muted-foreground hover:border-purple-500/50"
                )}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="inject-fault" checked={injectFault} onChange={(e) => setInjectFault(e.target.checked)} className="h-3.5 w-3.5" />
          <Label htmlFor="inject-fault" className="text-xs cursor-pointer">Inject random fault (1 in 5 results)</Label>
        </div>
        <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
          onClick={() => console.log("sim pin:", moduleId, pinStatus, injectFault)}>
          <FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Apply Sim Override
        </Button>
        <p className="text-[10px] text-muted-foreground">Sim overrides take effect on the next run. Full persistence in a future release.</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const isSimMode = useIsSimulated();

  const {
    data: resultsData,
    isLoading,
    error,
  } = useModuleResults(moduleId) as {
    data: { results: TestResult[]; total: number } | undefined;
    isLoading: boolean;
    error: unknown;
  };

  const results: TestResult[] = resultsData?.results ?? [];
  const latestResult = results[results.length - 1];
  const mod = MODULE_CATALOG[moduleId];
  const label = mod?.displayName ?? getModuleLabel(moduleId);
  const dotState = lastDotState(results);
  const keys = numericKeys(results, "metrics");

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
          <Link href="/modules"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <ModuleIcon moduleId={moduleId} size="md" className="text-muted-foreground" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight flex items-center gap-2">
            {label}
            {isSimMode && <Badge variant="outline" className="text-[9px] px-1 border-purple-500/40 text-purple-400">sim</Badge>}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{moduleId}</span>
            {mod?.category && <Badge variant="secondary" className="text-[9px] h-4 px-1">{mod.category}</Badge>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LiveDot state={dotState} />
          {latestResult && <StatusBadge status={latestResult.status} />}
        </div>
      </div>

      {/* KPI strip */}
      {results.length > 0 && keys.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {keys.slice(0, 4).map((k) => {
            const series = extractNumericSeries(results, "metrics", k);
            const vals = series.map((p) => p.value);
            const last = vals[vals.length - 1];
            return (
              <div key={k} className="rounded-lg border bg-card p-3">
                <div className="text-[10px] text-muted-foreground truncate">{k}</div>
                <div className="text-lg font-bold font-mono leading-tight">{last?.toFixed(3) ?? "—"}</div>
                <Sparkline data={vals} className="mt-1" />
              </div>
            );
          })}
        </div>
      )}

      {/* Loading / Error states */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      )}
      {!!error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load module results.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-0.5">
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><Info className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs"><History className="h-3.5 w-3.5" />History</TabsTrigger>
          <TabsTrigger value="trend" className="gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5" />Trend</TabsTrigger>
          <TabsTrigger value="distribution" className="gap-1.5 text-xs"><BarChart2 className="h-3.5 w-3.5" />Distribution</TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5 text-xs"><Grid className="h-3.5 w-3.5" />Heatmap</TabsTrigger>
          <TabsTrigger value="thresholds" className="gap-1.5 text-xs"><Map className="h-3.5 w-3.5" />Thresholds</TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs"><Settings2 className="h-3.5 w-3.5" />Config</TabsTrigger>
          <TabsTrigger value="raw" className="gap-1.5 text-xs"><Code2 className="h-3.5 w-3.5" />Raw</TabsTrigger>
          {isSimMode && <TabsTrigger value="simulate" className="gap-1.5 text-xs text-purple-400"><FlaskConical className="h-3.5 w-3.5" />Simulate</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab results={results} latestResult={latestResult} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab results={results} />
        </TabsContent>
        <TabsContent value="trend" className="mt-4">
          <TrendTab results={results} />
        </TabsContent>
        <TabsContent value="distribution" className="mt-4">
          <DistributionTab results={results} />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <HeatmapTab results={results} />
        </TabsContent>
        <TabsContent value="thresholds" className="mt-4">
          <ThresholdTab results={results} />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigTab moduleId={moduleId} />
        </TabsContent>
        <TabsContent value="raw" className="mt-4">
          <RawTab results={results} />
        </TabsContent>
        {isSimMode && (
          <TabsContent value="simulate" className="mt-4">
            <SimulateTab moduleId={moduleId} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
