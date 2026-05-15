"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useRun, useRunResults, useRunSSE,
  useCancelRun, usePauseRun, useResumeRun,
  useSetBaseline, useRerunRun, useExportRun, useDeleteRun,
} from "@/lib/api/queries";
import { LiveDot } from "@/components/primitives/live-dot";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/primitives/section-card";
import { CountUp } from "@/components/primitives/count-up";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft, Square, Pause, Play, GitCompare, Loader2,
  CheckCircle2, AlertCircle, Download, Repeat, Flag, Trash2,
} from "lucide-react";
import { formatRelativeTime, formatDuration, cn } from "@/lib/utils";
import type { Run, TestResult, RunStatus, Status } from "@/lib/api/types";
import { pageVariants, listItemVariants } from "@/components/motion/presets";
import { isFailureStatus } from "@/lib/status";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isActiveStatus(s: RunStatus): boolean {
  return s === "running" || s === "paused";
}

function elapsedMs(run: Run): number {
  if (!run.started_at) return 0;
  const end = run.ended_at ? new Date(run.ended_at).getTime() : Date.now();
  return end - new Date(run.started_at).getTime();
}

// ─── Live result row ──────────────────────────────────────────────────────────

function ResultRow({ result }: { result: TestResult }) {
  return (
    <motion.tr
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      layout
      className="border-b border-border/30 hover:bg-accent/10 transition-colors"
    >
      <td className="py-1.5 pl-3 font-mono text-[10px] text-muted-foreground w-8">
        {result.sequence}
      </td>
      <td className="py-1.5 font-mono text-xs">{result.test_id}</td>
      <td className="py-1.5">
        <StatusBadge status={result.status as Status} />
      </td>
      <td className="py-1.5 pr-3 font-technical text-[11px] text-muted-foreground text-right">
        {result.duration_ns ? formatDuration(result.duration_ns / 1_000_000) : "—"}
      </td>
    </motion.tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const router = useRouter();
  const { data: run, isLoading } = useRun(runId);
  const { data: resultsPage, isLoading: resultsLoading } = useRunResults(runId, { limit: 500 });
  const results = resultsPage?.results ?? [];

  const cancelRun = useCancelRun();
  const pauseRun = usePauseRun();
  const resumeRun = useResumeRun();
  const setBaseline = useSetBaseline();
  const rerunRun = useRerunRun();
  const exportRun = useExportRun();
  const deleteRun = useDeleteRun();

  const isActive = !!run && isActiveStatus(run.status as RunStatus);
  useRunSSE(runId, isActive);

  const [elapsed, setElapsed] = React.useState(() => run ? elapsedMs(run) : 0);
  React.useEffect(() => {
    if (!run || !isActive) return;
    setElapsed(elapsedMs(run));
    const id = setInterval(() => setElapsed(elapsedMs(run)), 1000);
    return () => clearInterval(id);
  }, [run, isActive]);

  // KPIs derived from results
  const totalResults = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => isFailureStatus(r.status as Status)).length;
  const passRate = totalResults > 0 ? Math.round((passed / totalResults) * 100) : 0;
  const failedResults = results.filter((r) => isFailureStatus(r.status as Status));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Run <span className="font-mono">{runId}</span> not found</p>
        <Button variant="outline" asChild><Link href="/runs">Back to runs</Link></Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5 shrink-0" asChild>
          <Link href="/runs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold truncate">{run.name || run.id.slice(0, 20)}</h1>
            <RunStateBadge state={run.status as RunStatus} />
            {isActive && <LiveDot state="running" size="sm" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="font-mono">{run.id}</span>
            {run.mode && <Badge variant="outline" className="h-4 text-[9px] px-1 font-mono">{run.mode.replace("_", " ")}</Badge>}
            {run.started_at && <span>Started {formatRelativeTime(run.started_at)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isActive && run.status === "running" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => pauseRun.mutate(runId, { onError: (e: Error) => toast.error(e.message) })}
              disabled={pauseRun.isPending}
            >
              <Pause className="h-3 w-3" /> Pause
            </Button>
          )}
          {isActive && run.status === "paused" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => resumeRun.mutate(runId, { onError: (e: Error) => toast.error(e.message) })}
              disabled={resumeRun.isPending}
            >
              <Play className="h-3 w-3" /> Resume
            </Button>
          )}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => cancelRun.mutate(runId, {
                onSuccess: () => toast.success("Run cancelled"),
                onError: (e: Error) => toast.error(e.message),
              })}
              disabled={cancelRun.isPending}
            >
              <Square className="h-3 w-3" /> Abort
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href={`/runs/compare?a=${runId}`}><GitCompare className="h-3 w-3" /> Compare</Link>
          </Button>
          {!isActive && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={setBaseline.isPending || run.baseline_flag}
                onClick={() => setBaseline.mutate(runId, {
                  onSuccess: () => toast.success("Baseline set"),
                  onError: (e: Error) => toast.error(e.message),
                })}
              >
                <Flag className="h-3 w-3" />{run.baseline_flag ? "Baseline" : "Set baseline"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={rerunRun.isPending}
                onClick={() => rerunRun.mutate(runId, {
                  onSuccess: (newRun) => { toast.success("Re-run created"); router.push(`/runs/${newRun.id}`); },
                  onError: (e: Error) => toast.error(e.message),
                })}
              >
                <Repeat className="h-3 w-3" /> Re-run
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={exportRun.isPending}
                onClick={async () => {
                  try {
                    const blob = await exportRun.mutateAsync({ id: runId, format: "csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `run-${runId.slice(0, 8)}.csv`; a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    const message = e instanceof Error ? e.message : "Export failed";
                    toast.error(message);
                  }
                }}
              >
                <Download className="h-3 w-3" /> Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                disabled={deleteRun.isPending}
                onClick={() => {
                  if (!window.confirm("Delete this run permanently?")) return;
                  deleteRun.mutate(runId, {
                    onSuccess: () => { toast.success("Run deleted"); router.push("/runs"); },
                    onError: (e: Error) => toast.error(e.message),
                  });
                }}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Progress bar (active runs only) ── */}
      {isActive && (
        <div className="space-y-1">
          <Progress className="h-1.5 animate-live-glow" />
          <div className="flex justify-between text-[10px] text-muted-foreground font-technical">
            <span>{totalResults} results so far</span>
            <span>{formatDuration(elapsed)}</span>
          </div>
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="instrument-tile rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Results</div>
          <div className="text-2xl font-bold font-technical"><CountUp value={totalResults} /></div>
        </div>
        <div className="instrument-tile rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pass Rate</div>
          <div className={cn("text-2xl font-bold font-technical", passRate >= 80 ? "text-status-pass" : passRate >= 50 ? "text-status-timeout" : "text-status-fail")}>
            <CountUp value={passRate} suffix="%" />
          </div>
        </div>
        <div className="instrument-tile rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Passed</div>
          <div className="text-2xl font-bold font-technical text-status-pass"><CountUp value={passed} /></div>
        </div>
        <div className="instrument-tile rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {!isActive ? "Duration" : "Elapsed"}
          </div>
          <div className="text-2xl font-bold font-technical">
            {formatDuration(isActive ? elapsed : elapsedMs(run))}
          </div>
        </div>
      </div>

      {/* ── Tabs: Results | Failures ── */}
      <Tabs defaultValue="results">
        <TabsList className="h-8">
          <TabsTrigger value="results" className="text-xs h-7">
            All Results
            {totalResults > 0 && <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[9px]">{totalResults}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="failures" className="text-xs h-7">
            Failures
            {failed > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[9px]">{failed}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-3">
          <SectionCard title="" noPadding>
            {resultsLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                {isActive
                  ? <><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="text-sm text-muted-foreground">Waiting for results…</p></>
                  : <><AlertCircle className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No results recorded</p></>
                }
              </div>
            ) : (
              <ScrollArea className="h-[420px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                    <tr className="border-b border-border/40">
                      <th className="py-2 pl-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground w-8">#</th>
                      <th className="py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground">Test</th>
                      <th className="py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="py-2 pr-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {results.map((r) => <ResultRow key={`${r.test_id}-${r.sequence}`} result={r} />)}
                    </AnimatePresence>
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="failures" className="mt-3">
          <SectionCard title="" noPadding>
            {failedResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <CheckCircle2 className="h-8 w-8 text-status-pass/40" />
                <p className="text-sm text-muted-foreground">No failures</p>
              </div>
            ) : (
              <ScrollArea className="h-[420px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                    <tr className="border-b border-border/40">
                      <th className="py-2 pl-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground w-8">#</th>
                      <th className="py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground">Test</th>
                      <th className="py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="py-2 pr-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedResults.map((r) => <ResultRow key={`${r.test_id}-${r.sequence}`} result={r} />)}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
