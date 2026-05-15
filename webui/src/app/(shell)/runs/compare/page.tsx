"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useRun, useRunResults, useRunCompare } from "@/lib/api/queries";
import { SectionCard } from "@/components/primitives/section-card";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, GitCompare, ArrowRight } from "lucide-react";
import { formatRelativeTime, formatDuration, cn } from "@/lib/utils";
import type { RunStatus, Status } from "@/lib/api/types";
import { isFailureStatus } from "@/lib/status";
import { pageVariants } from "@/components/motion/presets";

// ─── RunSelector ──────────────────────────────────────────────────────────────

function RunSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste run ID…"
        className="font-mono text-xs h-8"
      />
    </div>
  );
}

// ─── RunSummaryCard ────────────────────────────────────────────────────────────

function RunSummaryCard({ runId, side }: { runId: string; side: "A" | "B" }) {
  const { data: run, isLoading } = useRun(runId);
  const { data: resultsPage } = useRunResults(runId, { limit: 500 });
  const results = resultsPage?.results ?? [];

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => isFailureStatus(r.status as Status)).length;
  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  if (!runId) return (
    <div className="instrument-tile rounded-xl p-6 flex items-center justify-center text-muted-foreground/40 min-h-[120px]">
      <span className="text-sm">Select Run {side}</span>
    </div>
  );

  if (isLoading) return <Skeleton className="h-[120px] rounded-xl" />;
  if (!run) return (
    <div className="instrument-tile rounded-xl p-6 text-destructive text-sm">
      Run not found: <span className="font-mono">{runId.slice(0, 16)}</span>
    </div>
  );

  const elapsed = run.started_at
    ? ((run.ended_at ? new Date(run.ended_at) : new Date()).getTime() - new Date(run.started_at).getTime())
    : 0;

  return (
    <div className={cn("instrument-tile rounded-xl p-4 space-y-3 border", side === "A" ? "border-primary/30" : "border-accent/60")}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{run.name || "Unnamed"}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{run.id.slice(0, 20)}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className="h-5 text-[9px] px-1.5 font-semibold">{side}</Badge>
          <RunStateBadge state={run.status as RunStatus} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-lg font-bold font-technical">{total}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Pass%</div>
          <div className={cn("text-lg font-bold font-technical", passRate >= 80 ? "text-status-pass" : "text-status-fail")}>
            {passRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Duration</div>
          <div className="text-sm font-bold font-technical">{formatDuration(elapsed)}</div>
        </div>
      </div>
      {run.started_at && (
        <div className="text-[10px] text-muted-foreground">{formatRelativeTime(run.started_at)}</div>
      )}
    </div>
  );
}

// ─── Diff table ───────────────────────────────────────────────────────────────

function DiffTable({ runIdA, runIdB }: { runIdA: string; runIdB: string }) {
  const { data: compareData, isLoading } = useRunCompare(runIdA, runIdB);

  if (isLoading) return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
    </div>
  );

  if (!compareData) return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Enter both run IDs above to see a comparison
    </div>
  );

  const rows = compareData.rows ?? [];

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No overlapping tests found between these runs
      </div>
    );
  }

  return (
    <ScrollArea className="h-[480px]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
          <tr className="border-b border-border/40">
            <th className="py-2 pl-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground">Test</th>
            <th className="py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">Run A</th>
            <th className="py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">Run B</th>
            <th className="py-2 pr-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i: number) => {
            const changed = row.status_a !== row.status_b || row.category === "regressed" || row.category === "improved";
            return (
              <tr key={i} className={cn("border-b border-border/20 hover:bg-accent/10 transition-colors", changed && "bg-amber-500/5")}>
                <td className="py-1.5 pl-3 font-mono">{row.test_id}</td>
                <td className="py-1.5 text-center">
                  <StatusBadge status={row.status_a as Status} />
                </td>
                <td className="py-1.5 text-center">
                  <StatusBadge status={row.status_b as Status} />
                </td>
                <td className="py-1.5 pr-3 text-center">
                  {changed
                    ? <span className="inline-flex items-center gap-0.5 text-amber-500 font-medium text-[10px]">
                      <ArrowRight className="h-2.5 w-2.5" /> Changed
                    </span>
                    : <span className="text-muted-foreground/40">—</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompareRunsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [runIdA, setRunIdA] = React.useState(searchParams.get("a") ?? "");
  const [runIdB, setRunIdB] = React.useState(searchParams.get("b") ?? "");

  const canCompare = runIdA.trim().length > 0 && runIdB.trim().length > 0;

  function doCompare() {
    const url = new URL(window.location.href);
    url.searchParams.set("a", runIdA.trim());
    url.searchParams.set("b", runIdB.trim());
    router.replace(url.pathname + url.search);
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/runs"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Compare Runs</h1>
          <p className="text-sm text-muted-foreground">Side-by-side diff of two test runs</p>
        </div>
      </div>

      {/* Run ID selectors */}
      <SectionCard title="Select runs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RunSelector value={runIdA} onChange={setRunIdA} label="Run A (baseline)" />
          <RunSelector value={runIdB} onChange={setRunIdB} label="Run B (comparison)" />
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={doCompare} disabled={!canCompare} className="gap-1.5">
            <GitCompare className="h-4 w-4" /> Compare
          </Button>
        </div>
      </SectionCard>

      {/* Summary cards */}
      {(runIdA || runIdB) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RunSummaryCard runId={runIdA} side="A" />
          <RunSummaryCard runId={runIdB} side="B" />
        </div>
      )}

      {/* Diff table */}
      {canCompare && (
        <SectionCard title="Test-level diff" noPadding>
          <DiffTable runIdA={runIdA.trim()} runIdB={runIdB.trim()} />
        </SectionCard>
      )}
    </motion.div>
  );
}
