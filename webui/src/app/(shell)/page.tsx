"use client";

import Link from "next/link";
import { useClients, useRuns, useHealth } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Play, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Client } from "@/lib/api/types";

function HealthBadge() {
  const { isLoading, isError } = useHealth();
  if (isLoading) return <Badge variant="outline">Checking…</Badge>;
  if (isError) return <Badge variant="destructive">Server unreachable</Badge>;
  return <Badge variant="success">Server reachable</Badge>;
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
  return (
    <Badge variant={variantMap[state] ?? "outline"} className="text-xs capitalize">
      {state}
    </Badge>
  );
}

export default function DashboardPage() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: activeRuns, isLoading: runsLoading } = useRuns({ state: "running" });
  const { data: recentRuns, isLoading: recentLoading } = useRuns({ limit: 5 });

  const onlineCount = clients?.filter((c: Client) => c.isConnected).length ?? 0;
  const offlineCount = (clients?.length ?? 0) - onlineCount;
  const activeCount = activeRuns?.edges.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <HealthBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Targets Online</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {clientsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Targets Offline</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {clientsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-muted-foreground">{offlineCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {runsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{activeCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Runs</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/runs">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !recentRuns?.edges.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Play className="h-8 w-8" />
                <p className="text-sm">No runs yet</p>
                <Button size="sm" asChild><Link href="/configs/new">Create a config to get started</Link></Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentRuns.edges.map(({ node }) => (
                  <Link key={node.runId} href={`/runs/${node.runId}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                    <div className="flex items-center gap-2">
                      {node.state === "completed" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                       node.state === "failed" ? <AlertCircle className="h-3 w-3 text-destructive" /> :
                       <Activity className="h-3 w-3 text-blue-500" />}
                      <span className="font-mono text-xs text-muted-foreground">{node.runId.slice(0, 8)}</span>
                      <span>{node.moduleId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RunStateBadge state={node.state} />
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(node.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Targets</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/targets">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !clients?.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Server className="h-8 w-8" />
                <p className="text-sm">No targets connected</p>
              </div>
            ) : (
              <div className="space-y-1">
                {clients.slice(0, 6).map((c: Client) => (
                  <Link key={c.clientId} href={`/targets/${c.clientId}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.isConnected ? "bg-green-500" : "bg-muted-foreground"}`} />
                      <span>{c.hostname ?? c.clientId.slice(0, 12)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.isConnected ? "online" : formatRelativeTime(c.lastSeen)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
