"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { getModuleLabel, formatRelativeTime, formatDurationNs, cn } from "@/lib/utils";
import { useModuleResults } from "@/lib/api/queries";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { LiveDot } from "@/components/primitives/live-dot";
import type { LiveDotState } from "@/components/primitives/live-dot";
import { Sparkline } from "@/components/primitives/sparkline";
import { SectionCard } from "@/components/primitives/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResultTable } from "@/components/results/result-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ArrowLeft, AlertCircle, TrendingUp } from "lucide-react";
import { isFailureStatus } from "@/lib/status";
import { numericKeys, extractNumericSeries } from "@/lib/value/typed";
import type { Status, TestResult } from "@/lib/api/types";
import { pageVariants } from "@/components/motion/presets";

// ─── helpers ──────────────────────────────────────────────────────────────────

function lastDotState(results: TestResult[]): LiveDotState {
  const last = results.at(-1);
  if (!last) return "never";
  const s = last.status as Status;
  if (s === "PASS") return "pass";
  if (s === "FAIL") return "fail";
  if (s === "ERROR") return "error";
  if (s === "TIMEOUT") return "timeout";
  if (s === "SKIPPED") return "skipped";
  if (s === "ABORTED") return "aborted";
  return "idle";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: getModuleRegistry,
    staleTime: Infinity,
  });

  const { data: resultsPage, isLoading: resultsLoading } = useModuleResults(moduleId, { limit: 200 });

  const results = resultsPage?.results ?? [];

  const mod = modules?.find((m) => m.id === moduleId);
  const label = getModuleLabel(moduleId);

  // KPIs
  const totalRuns = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => isFailureStatus(r.status as Status)).length;
  const passRate = totalRuns > 0 ? Math.round((passed / totalRuns) * 100) : 0;

  // Sparkline data (pass=1, fail=0) from recent results
  const trendSeries = results.slice(-30).map((r) => (r.status === "PASS" ? 1 : 0));

  // Recharts chart data from results
  const chartData = results.slice(-50).map((r, i) => ({
    index: i + 1,
    status: r.status === "PASS" ? 1 : 0,
    duration: r.duration_ns ? r.duration_ns / 1_000_000 : null,
  }));

  // Numeric measurement keys from metrics field
  const numericMetricKeys = results.length > 0
    ? numericKeys(results, "metrics")
    : [];

  const isLoading = modulesLoading || resultsLoading;
  const dotState = lastDotState(results);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/modules"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-lg instrument-tile flex items-center justify-center shrink-0">
            <ModuleIcon moduleId={moduleId} size="md" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{label}</h1>
            <p className="font-mono text-xs text-muted-foreground">{moduleId}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <LiveDot state={dotState} size="md" />
            <Sparkline data={trendSeries} width={80} height={24} />
            {results.at(-1) && (
              <StatusBadge status={results.at(-1)!.status as Status} />
            )}
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="instrument-tile rounded-lg p-3 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Runs</div>
          <div className="text-2xl font-bold font-technical">{totalRuns}</div>
        </div>
        <div className="instrument-tile rounded-lg p-3 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pass Rate</div>
          <div className={cn("text-2xl font-bold font-technical", passRate >= 80 ? "text-status-pass" : passRate >= 50 ? "text-status-timeout" : "text-status-fail")}>
            {passRate}%
          </div>
        </div>
        <div className="instrument-tile rounded-lg p-3 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Passed</div>
          <div className="text-2xl font-bold font-technical text-status-pass">{passed}</div>
        </div>
        <div className="instrument-tile rounded-lg p-3 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Failures</div>
          <div className="text-2xl font-bold font-technical text-status-fail">{failed}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="results">
        <TabsList className="h-8">
          <TabsTrigger value="results" className="text-xs h-7">Results</TabsTrigger>
          <TabsTrigger value="trend" className="text-xs h-7">Trend</TabsTrigger>
          {numericMetricKeys.length > 0 && (
            <TabsTrigger value="measurements" className="text-xs h-7">Measurements</TabsTrigger>
          )}
        </TabsList>

        {/* Results table */}
        <TabsContent value="results" className="mt-4">
          <SectionCard title={`Results (${results.length})`} noPadding>
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">No results recorded for this module</p>
              </div>
            ) : (
              <ResultTable results={results} />
            )}
          </SectionCard>
        </TabsContent>

        {/* Trend chart */}
        <TabsContent value="trend" className="mt-4">
          <SectionCard title="Pass/Fail Trend (last 50 runs)">
            {chartData.length < 2 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-40" />
                <p className="text-sm">Not enough data for trend analysis</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v: number) => v === 1 ? "P" : "F"} tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0.5} stroke="hsl(var(--border))" strokeDasharray="4 2" />
                  <Line
                    type="step"
                    dataKey="status"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Status"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </TabsContent>

        {/* Measurements */}
        {numericMetricKeys.length > 0 && (
          <TabsContent value="measurements" className="mt-4">
            <SectionCard title="Numeric Measurements">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {numericMetricKeys.slice(0, 9).map((key) => {
                  const series = extractNumericSeries(results, "metrics", key);
                  const vals = series.map((p) => p.value);
                  return (
                    <div key={key} className="instrument-tile rounded-lg p-3 space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground truncate">{key}</div>
                      <div className="text-lg font-bold font-technical">
                        {vals.at(-1)?.toFixed(3) ?? "—"}
                      </div>
                      <Sparkline data={vals.slice(-20)} width={80} height={18} />
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
