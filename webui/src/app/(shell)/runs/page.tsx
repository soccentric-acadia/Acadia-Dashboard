"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useRuns } from "@/data";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, GitCompare, ChevronRight } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import type { RunStatus } from "@/lib/api/types";
import { pageVariants } from "@/components/motion/presets";

export default function RunsPage() {
  return (
    <React.Suspense>
      <RunsPageContent />
    </React.Suspense>
  );
}

function RunsPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState(searchParams.get("status") ?? "");
  const { data, isLoading } = useRuns({ status: status || undefined, limit: 50 });
  const runs = (data?.runs ?? []) as import("@/lib/api/types").Run[];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Runs</h1>
          <p className="text-sm text-muted-foreground">All test run history</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/runs/compare"><GitCompare className="h-3.5 w-3.5" /> Compare</Link>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/runs/new"><Plus className="h-3.5 w-3.5" /> New </Link>
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="pl-4 text-xs">ID</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Mode</TableHead>
              <TableHead className="text-xs">Duration</TableHead>
              <TableHead className="text-xs">Started</TableHead>
              <TableHead className="pr-4 w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={7} className="py-2 pl-4"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
            ))}
            {!isLoading && runs.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No runs found</TableCell></TableRow>
            )}
            {runs.map((run) => {
              const elapsed = run.started_at
                ? ((run.ended_at ? new Date(run.ended_at) : new Date()).getTime() - new Date(run.started_at).getTime())
                : 0;
              return (
                <TableRow key={run.id} className="group border-b border-border/30 hover:bg-accent/10 transition-colors">
                  <TableCell className="pl-4 py-2 font-mono text-[10px] text-primary">
                    <Link href={`/runs/${run.id}`} className="hover:underline">{run.id.slice(0, 12)}</Link>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{run.name || <span className="text-muted-foreground italic">Unnamed</span>}</TableCell>
                  <TableCell className="py-2"><RunStateBadge state={run.status as RunStatus} /></TableCell>
                  <TableCell className="py-2">
                    {run.mode && <Badge variant="outline" className="h-4 text-[9px] px-1 font-mono">{run.mode.replace("_", " ")}</Badge>}
                  </TableCell>
                  <TableCell className="py-2 font-technical text-xs text-muted-foreground">{formatDuration(elapsed)}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">{run.started_at ? formatRelativeTime(run.started_at) : "—"}</TableCell>
                  <TableCell className="pr-4 py-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" asChild>
                      <Link href={`/runs/${run.id}`}><ChevronRight className="h-3 w-3" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
