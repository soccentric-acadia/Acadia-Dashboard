"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useRunLogs } from "@/lib/api/queries";
import { useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/primitives/section-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageVariants } from "@/components/motion/presets";

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "text-status-error",
  WARN: "text-status-timeout",
  WARNING: "text-status-timeout",
  INFO: "text-foreground/80",
  DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run") ?? "";
  const [filter, setFilter] = React.useState("");
  const [level, setLevel] = React.useState("");
  const { data, isLoading } = useRunLogs(runId || null, { level: level || undefined });
  const logs = (data as { logs?: { timestamp: string; level: string; message: string }[] })?.logs ?? [];

  const filtered = React.useMemo(() => {
    if (!filter) return logs;
    const q = filter.toLowerCase();
    return logs.filter((l) => l.message.toLowerCase().includes(q));
  }, [logs, filter]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Logs</h1>
          <p className="text-sm text-muted-foreground">{runId ? `Run ${runId.slice(0, 12)}` : "System logs"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={level || "all"} onValueChange={(v) => setLevel(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="All levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="h-8 pl-7 text-xs w-40 font-mono" />
          </div>
        </div>
      </div>
      <SectionCard title={`${filtered.length} entries`} noPadding>
        {isLoading ? (
          <div className="p-3 space-y-1">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
        ) : !runId ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Navigate to a run to see its logs</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No log entries</div>
        ) : (
          <ScrollArea className="h-[560px]">
            <div className="font-mono text-[11px] leading-5 p-3 space-y-0.5">
              {filtered.map((entry, i) => (
                <div key={i} className="flex gap-3 py-0.5 hover:bg-accent/10 rounded px-1">
                  <span className="text-muted-foreground/60 shrink-0 w-20">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className={cn("shrink-0 w-12 font-semibold", LEVEL_COLORS[entry.level] ?? "text-foreground")}>{entry.level}</span>
                  <span className="break-all">{entry.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SectionCard>
    </motion.div>
  );
}
