"use client";
import * as React from "react";
import { motion } from "motion/react";
import {
  useRunLogs,
  useGlobalLogs,
  useSearchLogs,
  useLogBookmarks,
  useCreateLogBookmark,
  useSavedViews,
  useCreateSavedView,
} from "@/lib/api/queries";
import { useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/primitives/section-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Bookmark, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageVariants } from "@/components/motion/presets";
import { toast } from "sonner";
import type { LogEntry } from "@/lib/api/types";

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "text-status-error",
  WARN: "text-status-timeout",
  WARNING: "text-status-timeout",
  INFO: "text-foreground/80",
  DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
  return (
    <React.Suspense>
      <LogsPageContent />
    </React.Suspense>
  );
}

function LogsPageContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("run") ?? "";
  const [filter, setFilter] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [source, setSource] = React.useState("");
  const [selectedViewId, setSelectedViewId] = React.useState("");

  const runLogs = useRunLogs(runId || null, { level: level || undefined });
  const globalLogs = useGlobalLogs({ level: level || undefined, source: source || undefined });
  const searchLogs = useSearchLogs(filter, {
    run_id: runId || undefined,
    source: source || undefined,
    level: level || undefined,
    limit: 200,
  });
  const { data: bookmarks = [] } = useLogBookmarks();
  const { data: savedViews = [] } = useSavedViews();
  const createBookmark = useCreateLogBookmark();
  const createSavedView = useCreateSavedView();

  const baseLogs = runId ? (runLogs.data ?? []) : (globalLogs.data ?? []);
  const logs: LogEntry[] = filter.trim().length > 1 ? (searchLogs.data ?? []) : baseLogs;
  const isLoading = (filter.trim().length > 1 ? searchLogs.isLoading : (runId ? runLogs.isLoading : globalLogs.isLoading));

  const bookmarkedIds = React.useMemo(() => new Set(bookmarks.map((b) => b.log_id)), [bookmarks]);

  const filtered = logs;

  const onSaveCurrentView = async () => {
    const name = window.prompt("Saved view name", runId ? "Run logs view" : "Global logs view");
    if (!name) return;
    try {
      await createSavedView.mutateAsync({
        name,
        filters_json: JSON.stringify({ runId, level, source, query: filter }),
      });
      toast.success("Saved view created");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save view";
      toast.error(message);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Logs</h1>
          <p className="text-sm text-muted-foreground">{runId ? `Run ${runId.slice(0, 12)}` : "System logs"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={source || "all"} onValueChange={(v) => setSource(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All src</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="hal">HAL</SelectItem>
              <SelectItem value="os">OS</SelectItem>
            </SelectContent>
          </Select>
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
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search logs…" className="h-8 pl-7 text-xs w-40 font-mono" />
          </div>
          <Select
            value={selectedViewId}
            onValueChange={(v) => {
              if (!v) return;
              setSelectedViewId(v);
              const selected = savedViews.find((view) => view.id === v);
              if (!selected) return;
              try {
                const parsed = JSON.parse(selected.filters_json || "{}") as { level?: string; source?: string; query?: string };
                setLevel(parsed.level ?? "");
                setSource(parsed.source ?? "");
                setFilter(parsed.query ?? "");
              } catch {
                toast.error("Saved view payload is invalid");
              }
            }}
          >
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Saved views" /></SelectTrigger>
            <SelectContent>
              {savedViews.length > 0 ? (
                savedViews.map((view) => (
                  <SelectItem key={view.id} value={view.id}>{view.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="__none" disabled>No views</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onSaveCurrentView}>
            <Save className="mr-1 h-3.5 w-3.5" />Save view
          </Button>
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
                  <span className={cn("shrink-0 w-12 font-semibold", LEVEL_COLORS[(entry.severity || "").toUpperCase()] ?? "text-foreground")}>{entry.severity}</span>
                  <span className="break-all">{entry.message}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {bookmarkedIds.has(entry.id) ? <Badge variant="secondary">Saved</Badge> : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={async () => {
                        try {
                          await createBookmark.mutateAsync({ log_id: entry.id });
                          toast.success("Log bookmarked");
                        } catch (e) {
                          const message = e instanceof Error ? e.message : "Failed to bookmark log";
                          toast.error(message);
                        }
                      }}
                      aria-label="Bookmark log"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SectionCard>
    </motion.div>
  );
}
