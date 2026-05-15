"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useBoard } from "@/lib/board/context";
import { useRuns, useHealth } from "@/lib/api/queries";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { KpiCard } from "@/components/primitives/kpi-card";
import { SectionCard } from "@/components/primitives/section-card";
import { LiveDot } from "@/components/primitives/live-dot";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listItemVariants, pageVariants } from "@/components/motion/presets";
import {
  Server, Activity, CheckCircle2, XCircle, Gauge, Zap,
  ChevronRight, Plus, BarChart3,
} from "lucide-react";
import { formatRelativeTime, formatDuration, cn } from "@/lib/utils";
import type { Run } from "@/lib/api/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function runElapsedMs(run: Run): number {
  if (!run.started_at) return 0;
  const end = run.ended_at ? new Date(run.ended_at).getTime() : Date.now();
  return end - new Date(run.started_at).getTime();
}

function RunRow({ run }: { run: Run }) {
  return (
    <motion.tr
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="group border-b border-border/40 hover:bg-accent/20 transition-colors"
    >
      <TableCell className="py-2 pl-4">
        <Link
          href={`/runs/${run.id}`}
          className="font-mono text-xs text-primary hover:underline underline-offset-2"
        >
          {run.id.slice(0, 12)}
        </Link>
      </TableCell>
      <TableCell className="py-2">
        <span className="text-sm truncate max-w-[200px] block">{run.name || "—"}</span>
      </TableCell>
      <TableCell className="py-2">
        <RunStateBadge state={run.status} />
      </TableCell>
      <TableCell className="py-2 font-technical text-xs text-muted-foreground">
        {formatDuration(runElapsedMs(run))}
      </TableCell>
      <TableCell className="py-2 text-xs text-muted-foreground">
        {run.started_at ? formatRelativeTime(run.started_at) : "—"}
      </TableCell>
      <TableCell className="py-2 pr-4 text-right">
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" asChild>
          <Link href={`/runs/${run.id}`}><ChevronRight className="h-3 w-3" /></Link>
        </Button>
      </TableCell>
    </motion.tr>
  );
}

// ─── Active run card ───────────────────────────────────────────────────────────

function ActiveRunCard({ run }: { run: Run }) {
  const [elapsed, setElapsed] = React.useState(() => runElapsedMs(run));

  React.useEffect(() => {
    const id = setInterval(() => setElapsed(runElapsedMs(run)), 1000);
    return () => clearInterval(id);
  }, [run]);

  return (
    <Link href={`/runs/${run.id}`}>
      <motion.div
        whileHover={{ y: -1, scale: 1.005 }}
        className="rounded-lg border border-status-running/30 bg-status-running-bg p-3 space-y-1.5 cursor-pointer hover:border-status-running/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <LiveDot state="running" size="sm" />
          <span className="text-sm font-medium truncate flex-1">{run.name || run.id.slice(0, 16)}</span>
          <Badge variant="outline" className="text-[9px] font-mono h-4 px-1.5">
            {run.mode?.replace("_", " ")}
          </Badge>
        </div>
        <div className="text-[10px] text-muted-foreground font-technical pl-4">
          {formatDuration(elapsed)}
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Module tile ───────────────────────────────────────────────────────────────

function ModuleTile({ id }: { id: string }) {
  return (
    <Link href={`/modules/${id}`}>
      <motion.div
        variants={listItemVariants}
        whileHover={{ y: -2, scale: 1.02 }}
        className="instrument-tile flex flex-col items-center gap-1.5 p-3 rounded-lg cursor-pointer group"
      >
        <ModuleIcon moduleId={id} size="md" className="text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="font-mono text-[9px] text-muted-foreground text-center leading-tight truncate w-full text-center">
          {id.replace(/_/g, " ")}
        </span>
        <LiveDot state="never" size="xs" />
      </motion.div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { board } = useBoard();
  const { isError: serverUnreachable } = useHealth();

  const { data: recentData, isLoading: recentLoading } = useRuns({ limit: 15 });
  const { data: activeData } = useRuns({ status: "running", limit: 5 });
  const { data: failedData } = useRuns({ status: "failed", limit: 5 });
  const { data: completedData } = useRuns({ status: "completed", limit: 100 });
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: getModuleRegistry,
    staleTime: Infinity,
  });

  const recentRuns = recentData?.runs ?? [];
  const activeRuns = activeData?.runs ?? [];
  const failedRuns = failedData?.runs ?? [];
  const completedRuns = completedData?.runs ?? [];

  const totalCompleted = completedData?.total ?? completedRuns.length;
  const totalFailed = failedData?.total ?? failedRuns.length;
  const totalRuns = totalCompleted + totalFailed;
  const passRate = totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          title="Board"
          value={board?.hostname ?? board?.name ?? "—"}
          icon={<Server className="h-4 w-4" />}
          action={board ? <a href="/settings" className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Settings</a> : undefined}
          compact
        />
        <KpiCard
          title="Active Runs"
          value={activeRuns.length === 0 ? "None" : String(activeRuns.length)}
          numericValue={activeRuns.length}
          icon={<Activity className="h-4 w-4" />}
          action={<a href="/runs/new" className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">New run</a>}
          compact
        />
        <KpiCard
          title="Pass Rate"
          value={`${passRate}%`}
          numericValue={passRate}
          suffix="%"
          icon={<CheckCircle2 className="h-4 w-4" />}
          compact
        />
        <KpiCard
          title="Failures"
          value={String(totalFailed)}
          numericValue={totalFailed}
          icon={<XCircle className="h-4 w-4" />}
          action={totalFailed > 0 ? <a href="/runs?status=failed" className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">View</a> : undefined}
          compact
        />
        <KpiCard
          title="Modules"
          value={String(modules.length)}
          numericValue={modules.length}
          icon={<Gauge className="h-4 w-4" />}
          compact
        />
        <KpiCard
          title="Server"
          value={serverUnreachable ? "Offline" : "Online"}
          icon={<Zap className="h-4 w-4" />}
          compact
        />
      </div>

      {/* ── Active runs + module tiles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active runs */}
        <SectionCard
          title="Active Runs"
          actions={
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
              <Link href="/runs/new"><Plus className="h-3 w-3" /> New Run</Link>
            </Button>
          }
        >
          {activeRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No active runs</p>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/runs/new">Start a run</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRuns.map((run) => <ActiveRunCard key={run.id} run={run} />)}
            </div>
          )}
        </SectionCard>

        {/* Hardware module grid */}
        <SectionCard
          title="Hardware Modules"
          className="lg:col-span-2"
          actions={
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link href="/modules">View all <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          }
          contentClassName="p-2"
          noPadding
        >
          {modulesLoading ? (
            <div className="grid grid-cols-5 gap-1.5 p-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-5 gap-1.5 p-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
            >
              {modules.slice(0, 20).map((m) => (
                <ModuleTile key={m.id} id={m.id} />
              ))}
            </motion.div>
          )}
        </SectionCard>
      </div>

      {/* ── Recent runs table + recent failures ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Recent Runs"
          className="lg:col-span-2"
          noPadding
          actions={
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link href="/runs">All runs <ChevronRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          }
        >
          {recentLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 text-xs">ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Started</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {recentRuns.map((run) => <RunRow key={run.id} run={run} />)}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {/* Recent failures */}
        <SectionCard
          title="Recent Failures"
          actions={
            failedRuns.length > 0 ? (
              <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                <Link href="/runs?status=failed">All <ChevronRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            ) : undefined
          }
        >
          {failedRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-status-pass/40" />
              <p className="text-sm text-muted-foreground">No recent failures</p>
            </div>
          ) : (
            <div className="space-y-2">
              {failedRuns.map((run) => (
                <Link key={run.id} href={`/runs/${run.id}`}>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/30 transition-colors group cursor-pointer">
                    <LiveDot state="fail" size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] text-muted-foreground">{run.id.slice(0, 12)}</div>
                      <div className="text-xs truncate">{run.name || "Unnamed run"}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {run.started_at ? formatRelativeTime(run.started_at) : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Reports & compare quick links ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/runs", label: "All Runs", icon: Activity },
          { href: "/runs/compare", label: "Compare Runs", icon: BarChart3 },
          { href: "/reports", label: "Reports", icon: BarChart3 },
          { href: "/schedules", label: "Schedules", icon: Zap },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <motion.div
              whileHover={{ y: -1 }}
              className="instrument-tile rounded-lg p-4 flex items-center gap-3 cursor-pointer group hover:border-primary/40 transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="text-sm font-medium">{label}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
