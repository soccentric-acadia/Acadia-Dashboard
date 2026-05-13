"use client";

import Link from "next/link";
import { useClients, useRuns, useHealth } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Play, CheckCircle2, AlertCircle, Activity, ChevronRight, BarChart3, WifiOff, Zap, Pin, Clock, XCircle, TrendingDown } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Client, Run } from "@/lib/api/types";
import { ResponsiveContainer, LineChart, Line } from "recharts";

// Mock data for failure trend sparkline as per requirements
const sparklineDataFail = [
  { value: 5 }, { value: 8 }, { value: 3 }, { value: 2 }, { value: 6 }, { value: 4 }, { value: 1 }
];

function HealthBadge() {
  const { isLoading, isError } = useHealth();
  if (isLoading) return <Badge variant="outline" className="bg-background/50">Checking Server…</Badge>;
  if (isError) return <Badge variant="destructive" className="shadow-sm shadow-red-500/20">Server unreachable</Badge>;
  return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 shadow-sm">Server reachable</Badge>;
}

function RunStateBadge({ state }: { state: string }) {
  const variantMap: Record<string, "success" | "destructive" | "secondary" | "warning" | "default"> = {
    completed: "success",
    failed: "destructive",
    running: "default",
    paused: "warning",
    stopped: "secondary",
    disconnected: "secondary",
    configuring: "secondary",
    ready: "secondary",
  };
  
  const v = variantMap[state] ?? "outline";
  const styles = v === "success" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                 v === "destructive" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                 v === "default" ? "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse" :
                 v === "warning" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                 "bg-muted text-muted-foreground border-border/50";

  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-md border ${styles}`}>
      {state}
    </span>
  );
}

function calculateDuration(start: string | null, end: string | null) {
  if (!start) return "-";
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diffMs = endTime - startTime;
  
  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function DashboardPage() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: recentRuns, isLoading: recentLoading } = useRuns({ limit: 10 });
  const { data: failedRuns, isLoading: failedLoading } = useRuns({ state: "failed", limit: 5 });
  const { data: successRuns, isLoading: successLoading } = useRuns({ state: "completed", limit: 1 });

  const onlineCount = clients?.filter((c: Client) => c.isConnected).length ?? 0;
  const offlineCount = (clients?.length ?? 0) - onlineCount;
  
  const lastSuccess = successRuns?.edges?.[0]?.node;

  // Mock pinned runs (in a real app this would come from a user preference API or local storage)
  const pinnedRuns = recentRuns?.edges?.slice(0, 2) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* 1. System Health Widget & 6. Big Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 -z-10" />
        
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Acadia Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">System Health & Validation Status</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <HealthBadge />
            
            {clientsLoading ? <Skeleton className="h-6 w-24 rounded-full" /> : (
              <Badge variant="outline" className={onlineCount > 0 ? "border-green-500/30 text-green-500 bg-green-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"}>
                <Server className="h-3 w-3 mr-1.5" />
                {onlineCount > 0 ? "Board Online" : "Board Offline"}
              </Badge>
            )}

            {successLoading ? <Skeleton className="h-6 w-32 rounded-full" /> : (
              <Badge variant="outline" className="border-border/50 bg-background/50">
                <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-500" />
                Last Success: {lastSuccess ? formatRelativeTime(lastSuccess.createdAt) : "Never"}
              </Badge>
            )}
          </div>
        </div>

        <Button size="lg" asChild className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all rounded-full px-8 py-6 text-base font-semibold group w-full md:w-auto">
          <Link href="/runs/new">
            <Play className="mr-2 h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
            Start New Run
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
        
        {/* Left Column: Quick Stats & Pinned Runs & Feed */}
        <div className="md:col-span-4 space-y-6">
          
          {/* 2. Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm relative overflow-hidden group col-span-2 sm:col-span-1 md:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Runs
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">1,248</div>
                <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Pass Rate
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">94.2%</div>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 rotate-180" /> +0.5%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Fail Trend
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-16 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineDataFail}>
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={true} isAnimationActive={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Pinned / Favorite Runs Section */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Pin className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                Pinned Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : pinnedRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No pinned runs.</p>
              ) : (
                <div className="space-y-2">
                  {pinnedRuns.map(({ node }) => (
                    <Link key={`pinned-${node.runId}`} href={`/runs/${node.runId}`} className="block p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{node.moduleId}</span>
                        <RunStateBadge state={node.state} />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">#{node.runId.slice(0, 8)}</span>
                        <span>•</span>
                        <span className="capitalize">{node.mode.replace('_', ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Recent Failures Feed */}
          <Card className="bg-red-500/5 border-red-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                Recent Failures Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {failedLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !failedRuns?.edges?.length ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No recent failures! System is healthy.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {failedRuns.edges.map(({ node }) => (
                    <Link key={node.runId} href={`/runs/${node.runId}`} className="flex flex-col gap-1 p-2 rounded-md hover:bg-red-500/10 transition-colors group">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm group-hover:text-red-500 transition-colors">{node.moduleId}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(node.createdAt)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                        <XCircle className="h-3 w-3 text-red-500/70" />
                        {node.errorMessage || "Validation threshold exceeded"}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Last N Runs Table */}
        <div className="md:col-span-8">
          
          {/* 4. Last N runs table */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle>Recent Run History</CardTitle>
                <CardDescription>Detailed view of the last 10 executions.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-background/50 hover:bg-accent/50"><Link href="/runs">View all history</Link></Button>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="rounded-md border border-border/50 overflow-hidden bg-background/50">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Run</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Results</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : !recentRuns?.edges?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Clock className="h-8 w-8 mb-2 opacity-50" />
                            <p>No runs recorded yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentRuns.edges.map(({ node }) => {
                        const passCount = node.passFail === true ? node.batchCount : Math.max(0, node.batchCount - 1);
                        const failCount = node.passFail === false ? 1 : 0;
                        
                        return (
                          <TableRow key={node.runId} className="cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => window.location.href = `/runs/${node.runId}`}>
                            <TableCell>
                              <div className="font-medium text-sm text-foreground">{node.moduleId}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">#{node.runId.slice(0, 8)}</div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground capitalize">
                                {node.mode.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {node.startedAt ? formatRelativeTime(node.startedAt) : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                              {calculateDuration(node.startedAt, node.endedAt)}
                            </TableCell>
                            <TableCell>
                              <RunStateBadge state={node.state} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2 text-xs">
                                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">{passCount} P</span>
                                <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded font-medium">{failCount} F</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

