"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getRunResults, getRuns } from "@/lib/api";
import { testsForModule, type ModuleTestDefinition, type ModuleTestField } from "@/lib/modules/catalog";
import { parseSsePayload, openSse } from "@/lib/sse";
import type { ExecutionMode, ModuleInfo, Run, RunEventState, TestResult } from "@/lib/types/api";
import { useAppShell } from "@/state/app-shell-context";

function formatClock(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString();
}

function numericMetricFromResult(result: TestResult): number | null {
  const candidates = [result.monitoring, result.metrics, result.event];
  for (const map of candidates) {
    for (const value of Object.values(map ?? {})) {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
  }
  return null;
}

function toChartRows(results: TestResult[]) {
  return results
    .map((result) => {
      return {
        t: formatClock(result.timestamp),
        ts: new Date(result.timestamp).getTime(),
        value: numericMetricFromResult(result),
      };
    })
    .filter((row): row is { t: string; ts: number; value: number } => row.value !== null)
    .sort((a, b) => a.ts - b.ts);
}

type TestValue = boolean | number | string;
type TestPlanState = Record<string, { enabled: boolean; fields: Record<string, TestValue> }>;

function testPlanStorageKey(moduleId: string): string {
  return `acadia.module-tests.${moduleId}`;
}

function initialTestPlan(moduleId: string, tests: ModuleTestDefinition[]): TestPlanState {
  const defaults = Object.fromEntries(
    tests.map((test) => [
      test.id,
      {
        enabled: true,
        fields: Object.fromEntries(test.fields.map((field) => [field.key, field.defaultValue])),
      },
    ]),
  ) as TestPlanState;

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(testPlanStorageKey(moduleId));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as TestPlanState;
    return {
      ...defaults,
      ...Object.fromEntries(
        tests.map((test) => [
          test.id,
          {
            enabled: parsed[test.id]?.enabled ?? defaults[test.id].enabled,
            fields: { ...defaults[test.id].fields, ...(parsed[test.id]?.fields ?? {}) },
          },
        ]),
      ),
    };
  } catch {
    return defaults;
  }
}

function modeLabel(mode: ExecutionMode): string {
  if (mode === "single_shot") return "One-shot";
  if (mode === "monitoring") return "Monitoring";
  if (mode === "event") return "Event";
  return "Long-run";
}

export function ModuleWorkspace({ module }: { module: ModuleInfo }) {
  const {
    mode,
    isRunning,
    activeRunId,
    reviewingRunId,
    setReviewingRunId,
    setIsRunning,
    setActiveRunId,
    setActiveModuleSelection,
  } = useAppShell();

  const [liveResults, setLiveResults] = useState<TestResult[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const moduleTests = useMemo(() => testsForModule(module), [module]);
  const [testPlan, setTestPlan] = useState<TestPlanState>(() => initialTestPlan(module.id, moduleTests));
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [modeFilter, setModeFilter] = useState<"all" | ExecutionMode>("all");

  const toggleExpand = (testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const filteredTests = useMemo(() => {
    if (modeFilter === "all") return moduleTests;
    return moduleTests.filter((t) => t.modes.includes(modeFilter));
  }, [moduleTests, modeFilter]);

  const { data: runsData } = useQuery({
    queryKey: ["runs", module.id],
    queryFn: () => getRuns({ limit: 40 }),
    refetchInterval: 15_000,
  });

  const moduleRuns = useMemo(() => {
    return (runsData?.runs ?? []).filter((run) => {
      return !mode || run.mode === mode;
    });
  }, [mode, runsData?.runs]);

  const selectedRunId = reviewingRunId ?? activeRunId ?? moduleRuns[0]?.id ?? null;

  const { data: selectedResultsData, refetch: refetchResults } = useQuery({
    queryKey: ["run-results", selectedRunId, module.id],
    queryFn: () => getRunResults(selectedRunId as string, { moduleId: module.id, limit: 500 }),
    enabled: Boolean(selectedRunId),
    refetchInterval: isRunning ? 5000 : false,
  });

  useEffect(() => {
    if (!activeRunId || !isRunning) return;

    const source = openSse(`/api/v1/runs/${activeRunId}/events`);

    source.addEventListener("state", (event) => {
      const payload = parseSsePayload<RunEventState>((event as MessageEvent).data);
      if (!payload) return;
      const running = payload.status.toLowerCase().includes("running");
      setIsRunning(running);
      if (!running) {
        setActiveRunId(activeRunId);
        void refetchResults();
      }
    });

    source.addEventListener("result", (event) => {
      const payload = parseSsePayload<TestResult>((event as MessageEvent).data);
      if (!payload) return;
      if (payload.module_id !== module.id) return;
      setLiveResults((prev) => [payload, ...prev].slice(0, 1000));
    });

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [activeRunId, isRunning, module.id, refetchResults, setActiveRunId, setIsRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    window.localStorage.setItem(testPlanStorageKey(module.id), JSON.stringify(testPlan));
  }, [module.id, testPlan]);

  const setTestEnabled = (testId: string, enabled: boolean) => {
    setTestPlan((previous) => ({
      ...previous,
      [testId]: { ...previous[testId], enabled },
    }));
  };

  const setFieldValue = (testId: string, field: ModuleTestField, value: TestValue) => {
    setTestPlan((previous) => ({
      ...previous,
      [testId]: {
        ...previous[testId],
        fields: {
          ...previous[testId].fields,
          [field.key]: value,
        },
      },
    }));
  };

  const activeEnabledTests = useMemo(() => {
    return moduleTests.filter((test) => test.modes.includes(mode) && (testPlan[test.id]?.enabled ?? true));
  }, [mode, moduleTests, testPlan]);

  const activeModuleConfig = useMemo(() => {
    return {
      test_names: activeEnabledTests.map((test) => String(testPlan[test.id]?.fields.test_names ?? test.id)),
      tests: Object.fromEntries(
        activeEnabledTests.map((test) => [
          test.id,
          {
            enabled: true,
            ...testPlan[test.id]?.fields,
          },
        ]),
      ),
    };
  }, [activeEnabledTests, testPlan]);

  useEffect(() => {
    setActiveModuleSelection({
      moduleId: module.id,
      moduleName: module.name || module.id,
      configTypeUrl: module.config_type_url,
      enabledTestNames: activeModuleConfig.test_names,
      moduleConfig: activeModuleConfig,
    });

    return () => setActiveModuleSelection(null);
  }, [activeModuleConfig, module.config_type_url, module.id, module.name, setActiveModuleSelection]);

  const mergedResults = useMemo(() => {
    const base = selectedResultsData?.results ?? [];
    if (!isRunning) return base;
    return [...liveResults, ...base];
  }, [isRunning, liveResults, selectedResultsData?.results]);

  const chartData = useMemo(() => {
    const all = toChartRows(mergedResults);
    if (mode !== "monitoring" && mode !== "long_run") return all;
    return all.filter((row) => now - row.ts <= 60_000);
  }, [mergedResults, mode, now]);

  const latest = mergedResults[0];

  const runningStatus = isRunning
    ? `Running in ${mode} · ${mergedResults.length} samples`
    : `Idle · Last run ${moduleRuns[0] ? formatClock(moduleRuns[0].created_at) : "never"}`;

  return (
    <div className="space-y-5">
      {/* ── Module header ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start gap-6">
            {/* Left: identity */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{module.category || "Module"}</Badge>
                <Badge variant={isRunning ? "warning" : "secondary"}>
                  {isRunning ? "Running" : "Idle"}
                </Badge>
                <Badge variant={activeEnabledTests.length > 0 ? "success" : "destructive"}>
                  {activeEnabledTests.length}/{moduleTests.length} tests enabled
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {module.name || module.id}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                {module.description || "No description was reported for this module."}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{runningStatus}</p>
            </div>

            {/* Right: metadata tiles */}
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
              {[
                { label: "Peripheral ID", value: module.id, mono: true },
                { label: "Version", value: module.version || "n/a", mono: false },
                { label: "Config type", value: module.config_type_url || "—", mono: true },
                { label: "Result type", value: module.result_type_url || "—", mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
                  <div
                    className={clsx(
                      "mt-1 truncate text-xs font-semibold",
                      mono && "font-mono",
                    )}
                    title={value}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main two-column area ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">

        {/* ── HAL Tests table ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>HAL Test Suite</CardTitle>
              <Badge variant={activeEnabledTests.length > 0 ? "success" : "destructive"}>
                {activeEnabledTests.length} enabled for {modeLabel(mode)}
              </Badge>
            </div>
            <CardDescription>
              Toggle tests on/off with the switch. Use ⚙ to configure per-test parameters. Greyed rows are not available in the current global mode.
            </CardDescription>

            {/* Mode filter pills */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["all", "single_shot", "monitoring", "event", "long_run"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModeFilter(m)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    modeFilter === m
                      ? "bg-sky-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                  )}
                >
                  {m === "all" ? "All modes" : modeLabel(m as ExecutionMode)}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60">
                    <th className="w-[40%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Test
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Supported modes
                    </th>
                    <th className="w-10 px-2 py-3" />
                    <th className="w-24 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Enabled
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map((test) => {
                    const plan = testPlan[test.id];
                    const enabled = plan?.enabled ?? true;
                    const modeCompatible = test.modes.includes(mode);
                    const isExpanded = expandedTests.has(test.id);
                    const hasFields = test.fields.length > 0;
                    const locked = isRunning || !modeCompatible || !enabled;

                    return (
                      <>
                        {/* ── Test row ── */}
                        <tr
                          key={test.id}
                          className={clsx(
                            "border-b border-zinc-100 dark:border-zinc-800",
                            modeCompatible
                              ? "bg-white dark:bg-zinc-950/20"
                              : "bg-zinc-50/60 opacity-60 dark:bg-zinc-900/30",
                          )}
                        >
                          {/* Name + description */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {test.name}
                            </div>
                            <div className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              {test.description}
                            </div>
                            {!modeCompatible && (
                              <span className="mt-1 inline-block text-xs text-amber-600 dark:text-amber-400">
                                Not available in {modeLabel(mode)} mode
                              </span>
                            )}
                          </td>

                          {/* Mode badges */}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {test.modes.map((m) => (
                                <Badge
                                  key={m}
                                  variant={m === mode ? "default" : "secondary"}
                                >
                                  {modeLabel(m)}
                                </Badge>
                              ))}
                            </div>
                          </td>

                          {/* Config toggle */}
                          <td className="px-2 py-3">
                            {hasFields && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(test.id)}
                                title="Configure test parameters"
                                className={clsx(
                                  "rounded-lg p-1.5 transition-colors",
                                  isExpanded
                                    ? "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300"
                                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800",
                                )}
                              >
                                <Settings2 size={15} />
                              </button>
                            )}
                          </td>

                          {/* Enable/disable switch */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {enabled ? "On" : "Off"}
                              </span>
                              <Switch
                                checked={enabled}
                                disabled={isRunning}
                                onClick={() => setTestEnabled(test.id, !enabled)}
                                aria-label={`${enabled ? "Disable" : "Enable"} ${test.name}`}
                              />
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded config row ── */}
                        {isExpanded && hasFields && (
                          <tr
                            key={`${test.id}-config`}
                            className="border-b border-sky-100 bg-sky-50/50 dark:border-sky-900/30 dark:bg-sky-950/10"
                          >
                            <td colSpan={4} className="px-6 pb-4 pt-3">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings2 size={13} className="text-sky-500" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                                  Configuration — {test.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(test.id)}
                                  className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {test.fields.map((field) => {
                                  const value = plan?.fields[field.key] ?? field.defaultValue;
                                  return (
                                    <label
                                      key={field.key}
                                      className="block text-xs font-medium text-zinc-600 dark:text-zinc-300"
                                    >
                                      <span className="mb-1 flex items-center justify-between gap-2">
                                        <span>{field.label}</span>
                                        {field.unit && (
                                          <span className="text-zinc-400">{field.unit}</span>
                                        )}
                                      </span>
                                      {field.type === "select" ? (
                                        <select
                                          disabled={locked}
                                          value={String(value)}
                                          onChange={(e) =>
                                            setFieldValue(test.id, field, e.target.value)
                                          }
                                          className="h-9 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                        >
                                          {(field.options ?? []).map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : field.type === "boolean" ? (
                                        <div className="flex h-9 items-center justify-between rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                                          <span>{value ? "Enabled" : "Disabled"}</span>
                                          <Switch
                                            checked={Boolean(value)}
                                            disabled={locked}
                                            onClick={() =>
                                              setFieldValue(test.id, field, !value)
                                            }
                                            aria-label={field.label}
                                          />
                                        </div>
                                      ) : (
                                        <Input
                                          disabled={locked}
                                          type={field.type === "number" ? "number" : "text"}
                                          value={String(value)}
                                          onChange={(e) =>
                                            setFieldValue(
                                              test.id,
                                              field,
                                              field.type === "number"
                                                ? Number(e.target.value)
                                                : e.target.value,
                                            )
                                          }
                                        />
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}

                  {filteredTests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                        No tests available for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Results panel ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {reviewingRunId && (
            <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700 dark:bg-amber-950/30">
              <span className="text-amber-800 dark:text-amber-200">
                Reviewing run {reviewingRunId.slice(0, 8)}…
              </span>
              <button
                type="button"
                onClick={() => setReviewingRunId(null)}
                className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Return to live
              </button>
            </div>
          )}

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Results
              </span>
              <Badge variant={isRunning ? "warning" : "secondary"}>
                {mergedResults.length} samples
              </Badge>
            </div>

            {/* Chart (monitoring / long_run) */}
            {(mode === "monitoring" || mode === "long_run") && (
              <div className="h-56 w-full rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#64748b33" />
                      <XAxis dataKey="t" minTickGap={24} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0ea5e9"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-zinc-500">
                    No numeric samples yet.
                  </div>
                )}
              </div>
            )}

            {/* Single-shot big result */}
            {mode === "single_shot" && (
              <div
                className={clsx(
                  "rounded-xl border p-4 text-center",
                  latest?.status?.toLowerCase() === "pass"
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-rose-400 bg-rose-50 dark:bg-rose-950/20",
                )}
              >
                <div className="text-xs text-zinc-500">Most recent one-shot</div>
                <div className="mt-2 text-4xl font-bold">
                  {latest?.status ?? "No result"}
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  {latest
                    ? `${formatClock(latest.timestamp)} · ${latest.duration_ns} ns`
                    : "Waiting for run"}
                </div>
              </div>
            )}

            {/* Live results mini-table */}
            <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2 py-2 text-left">Time</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Test</th>
                    <th className="px-2 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedResults.slice(0, 200).map((row) => (
                    <tr
                      key={row.id + String(row.sequence)}
                      className="border-t border-zinc-200 dark:border-zinc-700"
                    >
                      <td className="px-2 py-1.5">{formatClock(row.timestamp)}</td>
                      <td className="px-2 py-1.5">
                        <Badge
                          variant={
                            row.status?.toLowerCase() === "pass"
                              ? "success"
                              : row.status?.toLowerCase() === "fail"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1.5">{row.name || row.test_id}</td>
                      <td className="px-2 py-1.5">
                        {String(numericMetricFromResult(row) ?? "—")}
                      </td>
                    </tr>
                  ))}
                  {mergedResults.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-6 text-center text-zinc-500">
                        No results yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Previous runs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Previous Runs</CardTitle>
              <CardDescription className="text-xs">
                Click a row to review stored results.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-500">Run ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-500">Mode</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-500">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-500">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleRuns.map((run: Run) => (
                      <tr
                        key={run.id}
                        className={clsx(
                          "cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60",
                          reviewingRunId === run.id &&
                          "bg-amber-50 dark:bg-amber-950/20",
                        )}
                        onClick={() => setReviewingRunId(run.id)}
                      >
                        <td className="px-3 py-2 font-mono">{run.id.slice(0, 8)}…</td>
                        <td className="px-3 py-2">{run.mode}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              run.status?.toLowerCase() === "pass"
                                ? "success"
                                : run.status?.toLowerCase() === "fail"
                                  ? "destructive"
                                  : run.status?.toLowerCase() === "running"
                                    ? "warning"
                                    : "secondary"
                            }
                          >
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{formatClock(run.created_at)}</td>
                      </tr>
                    ))}
                    {moduleRuns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-5 text-center text-zinc-500">
                          No runs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
