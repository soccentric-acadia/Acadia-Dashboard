"use client";
import * as React from "react";
import { motion } from "motion/react";
import { BarChart3, Download, FileText, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { pageVariants } from "@/components/motion/presets";
import { useRuns, useExportRun, useRerunRun } from "@/data";
import { RunStateBadge } from "@/components/runs/run-state-badge";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Run, RunStatus } from "@/lib/api/types";

export default function ReportsPage() {
  const router = useRouter();
  const { data: runsPage, isLoading } = useRuns({ limit: 50 });
  const runs = (runsPage?.runs ?? []) as Run[];
  const completedRuns = runs.filter((r) => r.status === "completed" || r.status === "failed");

  const exportRun = useExportRun();
  const rerunRun = useRerunRun();

  const handleExport = async (id: string, format: "csv" | "json") => {
    try {
      const blob = await exportRun.mutateAsync({ id, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `run-${id.slice(0, 8)}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleRerun = (id: string) => {
    rerunRun.mutate(id, {
      onSuccess: (newRun) => { toast.success("Re-run created"); router.push(`/runs/${newRun.id}`); },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Export and analyze completed run data</p>
        </div>
      </div>

      <SectionCard title="Completed Runs">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : completedRuns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No completed runs yet</p>
            <p className="text-xs text-muted-foreground">Reports are generated from completed runs</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground">Run</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground">Mode</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground">Finished</th>
                  <th className="px-3 py-2 text-right text-xs text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedRuns.map((run) => (
                  <tr key={run.id} className="border-b last:border-0 hover:bg-accent/5 transition-colors">
                    <td className="px-3 py-2">
                      <Link href={`/runs/${run.id}`} className="font-medium hover:underline text-foreground">
                        {run.name || run.id.slice(0, 16)}
                      </Link>
                      <div className="text-[10px] text-muted-foreground font-mono">{run.id}</div>
                    </td>
                    <td className="px-3 py-2"><RunStateBadge state={run.status as RunStatus} /></td>
                    <td className="px-3 py-2">
                      {run.mode && <Badge variant="outline" className="text-[9px] px-1 h-4 font-mono">{run.mode.replace("_", " ")}</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {run.ended_at ? formatRelativeTime(run.ended_at) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => handleExport(run.id, "csv")}
                          disabled={exportRun.isPending}
                        >
                          <Download className="h-3 w-3" /> CSV
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => handleExport(run.id, "json")}
                          disabled={exportRun.isPending}
                        >
                          <FileText className="h-3 w-3" /> JSON
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 text-xs gap-1"
                          onClick={() => handleRerun(run.id)}
                          disabled={rerunRun.isPending}
                        >
                          <Repeat className="h-3 w-3" /> Re-run
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}

