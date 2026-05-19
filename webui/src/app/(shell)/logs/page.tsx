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
} from "@/data";
import { useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/primitives/section-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Search, Bookmark, Save, ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageVariants } from "@/components/motion/presets";
import { toast } from "sonner";
import type { LogEntry } from "@/lib/api/types";

/** ±5 000 ms window around the correlated result timestamp. */
const CORRELATION_WINDOW_MS = 5_000;

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
  /** result_id from a jump link — e.g. /logs?result_id=<uuid>&result_ts=<iso> */
  const resultId = searchParams.get("result_id") ?? "";
  const resultTs = searchParams.get("result_ts") ?? "";
  const correlationAnchorMs = resultTs ? new Date(resultTs).getTime() : null;

  const [filter, setFilter] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [source, setSource] = React.useState("");
  const [selectedViewId, setSelectedViewId] = React.useState("");

  /** Ref for the first correlated log row — used for auto-scroll. */
  const firstCorrelatedRef = React.useRef<HTMLDivElement | null>(null);

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

  /** Scroll to the first correlated entry once logs are loaded. */
  React.useEffect(() => {
    if (!correlationAnchorMs || isLoading || filtered.length === 0) return;
    // Give the DOM a tick to render before scrolling
    const id = setTimeout(() => {
      firstCorrelatedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(id);
  }, [correlationAnchorMs, isLoading, filtered.length]);

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
      {/* ── Result correlation banner ────────────────────────────────────── */}
      {resultId && (
        <Alert className="border-primary/40 bg-primary/5">
          <Link2 className="h-4 w-4" />
          <AlertDescription className="font-mono text-xs">
            Showing context for result{" "}
            <span className="font-semibold">{resultId.slice(0, 20)}…</span>
            {correlationAnchorMs && (
              <> — entries within ±5s of {new Date(correlationAnchorMs).toLocaleTimeString()} are highlighted</>
            )}
          </AlertDescription>
        </Alert>
      )}
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
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No log entries</div>
        ) : (
          <ScrollArea className="h-[560px]">
            <div className="font-mono text-[11px] leading-5 p-3 space-y-0.5">
              {filtered.map((entry, i) => {
                const entryMs = new Date(entry.timestamp).getTime();
                const isCorrelated =
                  correlationAnchorMs !== null &&
                  Math.abs(entryMs - correlationAnchorMs) <= CORRELATION_WINDOW_MS;
                // Track the first correlated row for auto-scroll
                const isFirstCorrelated =
                  isCorrelated &&
                  filtered
                    .slice(0, i)
                    .every((e) => Math.abs(new Date(e.timestamp).getTime() - (correlationAnchorMs ?? 0)) > CORRELATION_WINDOW_MS);

                return (
                  <div
                    key={i}
                    ref={isFirstCorrelated ? firstCorrelatedRef : undefined}
                    data-result-correlated={isCorrelated ? "true" : undefined}
                    className={cn(
                      "flex gap-3 py-0.5 hover:bg-accent/10 rounded px-1",
                      isCorrelated && "bg-primary/10 ring-1 ring-primary/30 animate-result-flash",
                    )}
                  >
                    <span className="text-muted-foreground/60 shrink-0 w-20">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    <span className={cn("shrink-0 w-12 font-semibold", LEVEL_COLORS[(entry.severity || "").toUpperCase()] ?? "text-foreground")}>{entry.severity}</span>
                    <span className="break-all">{entry.message}</span>
                    <div className="ml-auto flex items-center gap-1 shrink-0">
                      {bookmarkedIds.has(entry.id) ? <Badge variant="secondary">Saved</Badge> : null}
                      {entry.run_id && entry.run_id !== runId && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild aria-label="View run">
                          <Link href={`/runs/${entry.run_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
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
                );
              })}
            </div>
          </ScrollArea>
        )}
      </SectionCard>
    </motion.div>
  );
}
