"use client";

import { useState, useEffect, useRef } from "react";
import { useRuns, useRunLogs } from "@/lib/api/queries";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Search, Bookmark, BookmarkX, Globe } from "lucide-react";
import {
    fetchGlobalLogs, searchLogs,
    fetchLogBookmarks, createLogBookmark, deleteLogBookmark,
    type LogBookmark,
} from "@/lib/api/client";
import { toast } from "sonner";
import type { LogEntry } from "@/lib/api/types";

const LEVEL_COLORS: Record<string, string> = {
    error: "text-red-400",
    warn: "text-yellow-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
    debug: "text-muted-foreground",
    ERROR: "text-red-400",
    WARN: "text-yellow-400",
    INFO: "text-blue-400",
    DEBUG: "text-muted-foreground",
};

export default function LogsPage() {
    const qc = useQueryClient();
    const { data: runs } = useRuns({ limit: 30 });
    const [selectedRunId, setSelectedRunId] = useState<string>("");
    const [filter, setFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<LogEntry[]>([]);
    const [searching, setSearching] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);

    const { data: logData } = useRunLogs(selectedRunId || null, {});
    const { data: globalLogs = [] } = useQuery<LogEntry[]>({
        queryKey: ["global-logs"],
        queryFn: () => fetchGlobalLogs({ limit: 200 }),
    });
    const { data: bookmarks = [] } = useQuery<LogBookmark[]>({
        queryKey: ["log-bookmarks"],
        queryFn: fetchLogBookmarks,
    });

    const deleteBookmarkMutation = useMutation({
        mutationFn: (id: string) => deleteLogBookmark(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["log-bookmarks"] }),
        onError: (e: Error) => toast.error(e.message),
    });

    const addBookmarkMutation = useMutation({
        mutationFn: (logId: string) => createLogBookmark(logId, ""),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["log-bookmarks"] }); toast.success("Bookmarked"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const results = await searchLogs(searchQuery, { limit: 200 });
            setSearchResults(results);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSearching(false);
        }
    };

    const logs: LogEntry[] = logData ?? [];

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const filteredLogs = filter
        ? logs.filter(
            (l) =>
                (l.message ?? "").toLowerCase().includes(filter.toLowerCase()) ||
                (l.source ?? "").toLowerCase().includes(filter.toLowerCase())
        )
        : logs;

    const runList = runs?.runs ?? [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Log Viewer</h1>

            <Tabs defaultValue="run">
                <TabsList>
                    <TabsTrigger value="run">Run logs</TabsTrigger>
                    <TabsTrigger value="global"><Globe className="h-3.5 w-3.5 mr-1" />Global</TabsTrigger>
                    <TabsTrigger value="search"><Search className="h-3.5 w-3.5 mr-1" />Search</TabsTrigger>
                    <TabsTrigger value="bookmarks"><Bookmark className="h-3.5 w-3.5 mr-1" />Bookmarks</TabsTrigger>
                </TabsList>

                <TabsContent value="run" className="space-y-4 mt-4">
                    <div className="flex gap-3 flex-wrap">
                        <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                            <SelectTrigger className="w-80">
                                <SelectValue placeholder="Select a run to view logs…" />
                            </SelectTrigger>
                            <SelectContent>
                                {runList.map((run) => (
                                    <SelectItem key={run.id} value={run.id}>
                                        <span className="font-mono text-xs">{run.id.slice(0, 16)}</span>
                                        <span className="ml-2 text-muted-foreground">{run.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Filter messages…" className="pl-8" value={filter} onChange={(e) => setFilter(e.target.value)} />
                        </div>
                    </div>
                    <LogTerminal logs={filteredLogs} onBookmark={id => addBookmarkMutation.mutate(id)} emptyMessage={!selectedRunId ? "Select a run to view its logs" : "No logs found"} />
                    <div ref={logsEndRef} />
                </TabsContent>

                <TabsContent value="global" className="mt-4">
                    <LogTerminal logs={globalLogs} onBookmark={id => addBookmarkMutation.mutate(id)} emptyMessage="No global logs" />
                </TabsContent>

                <TabsContent value="search" className="space-y-4 mt-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Full-text search across all logs…"
                                className="pl-8"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={searching}>
                            {searching ? "Searching…" : "Search"}
                        </Button>
                    </div>
                    {searchResults.length > 0 && (
                        <LogTerminal logs={searchResults} onBookmark={id => addBookmarkMutation.mutate(id)} emptyMessage="No results" />
                    )}
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-4 space-y-2">
                    {bookmarks.length === 0 && (
                        <p className="text-sm text-muted-foreground">No bookmarked log entries.</p>
                    )}
                    {bookmarks.map(b => (
                        <div key={b.id} className="flex items-start gap-2 rounded-md border px-3 py-2 font-mono text-xs">
                            <span className="text-muted-foreground/50 shrink-0">{b.created_at ? new Date(b.created_at).toISOString().slice(0, 19) : "—"}</span>
                            <span className="flex-1 break-all">{b.note || b.log_id}</span>
                            <button
                                onClick={() => deleteBookmarkMutation.mutate(b.id)}
                                className="text-destructive hover:text-destructive/80 shrink-0"
                            >
                                <BookmarkX className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function LogTerminal({ logs, onBookmark, emptyMessage }: {
    logs: LogEntry[];
    onBookmark: (id: string) => void;
    emptyMessage: string;
}) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="h-[60vh] overflow-y-auto bg-zinc-950 rounded-md font-mono text-xs p-4 space-y-0.5">
                    {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                            <Terminal className="h-5 w-5" />
                            <span>{emptyMessage}</span>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="group flex gap-2 items-start">
                                <span className="text-muted-foreground/50 shrink-0 tabular-nums">
                                    {log.timestamp ? new Date(log.timestamp).toISOString().slice(11, 23) : "—"}
                                </span>
                                <Badge variant="outline" className={`shrink-0 text-[10px] px-1 py-0 ${LEVEL_COLORS[log.severity] ?? "text-muted-foreground"}`}>
                                    {(log.severity ?? "info").toUpperCase().slice(0, 4)}
                                </Badge>
                                <span className="text-muted-foreground/70 shrink-0">{log.source}</span>
                                <span className="text-zinc-100 break-all flex-1">{log.message}</span>
                                <button
                                    onClick={() => onBookmark(log.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-400 shrink-0 transition-opacity"
                                >
                                    <Bookmark className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card >
    );
}
