/**
 * Hardware module sidebar — the persistent left-hand inventory.
 * Built on shadcn Sidebar + Accordion for category groups.
 * Modules displayed UNCONDITIONALLY regardless of board state.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry, getCategoryForModule } from "@/lib/proto/registry";
import type { ModuleInfo } from "@/lib/proto/registry";
import { useRuns, useCancelRun } from "@/lib/api/queries";
import { getModuleLabel, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { LiveDot, type LiveDotState } from "@/components/primitives/live-dot";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search, Square } from "lucide-react";
import type { Status } from "@/lib/api/types";
import { toast } from "sonner";

type ModuleStatus = LiveDotState;

const CATEGORY_ORDER = [
  "Processor", "Memory", "Storage", "Network", "Peripherals",
  "Sensors", "Display", "Camera", "Audio", "Power",
  "Timing", "Safety", "Debug", "Other",
];

function dotStateFromStatus(s: string | undefined | null): ModuleStatus {
  if (!s) return "never";
  if (s === "PASS") return "pass";
  if (s === "FAIL") return "fail";
  if (s === "ERROR") return "error";
  if (s === "TIMEOUT") return "timeout";
  if (s === "SKIPPED") return "skipped";
  if (s === "ABORTED") return "aborted";
  return "idle";
}

interface ModuleRowProps {
  mod: ModuleInfo;
  dotState: ModuleStatus;
  lastStatus: string | null;
  lastTested: string | null;
}

function ModuleRow({ mod, dotState, lastStatus, lastTested }: ModuleRowProps) {
  const pathname = usePathname();
  const active = pathname === `/modules/${mod.id}`;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const label = getModuleLabel(mod.id);

  return (
    <SidebarMenuItem>
      <HoverCard openDelay={400} closeDelay={100}>
        <HoverCardTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={collapsed ? label : undefined}
            className={cn("h-8 gap-2 px-2 text-xs", active && "font-medium")}
          >
            <Link href={`/modules/${mod.id}`}>
              <ModuleIcon moduleId={mod.id} size="sm" className="text-muted-foreground shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate font-mono text-[11px]">{label}</span>
                  <LiveDot state={dotState} size="xs" className="ml-auto shrink-0" />
                </>
              )}
            </Link>
          </SidebarMenuButton>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="w-60 p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ModuleIcon moduleId={mod.id} size="md" className="text-foreground/70" />
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{label}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{mod.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <LiveDot state={dotState} size="sm" />
              {lastStatus
                ? <span>{lastStatus}{lastTested ? ` · ${lastTested}` : ""}</span>
                : <span className="italic">Never tested</span>}
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs" asChild>
              <Link href={`/modules/${mod.id}`}>Open module page →</Link>
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </SidebarMenuItem>
  );
}

function ActiveRunCard() {
  const { data } = useRuns({ status: "running", limit: 1 });
  const activeRun = data?.runs?.[0];
  const cancelRun = useCancelRun();

  if (!activeRun) return null;

  const elapsed = activeRun.started_at
    ? Math.floor((Date.now() - new Date(activeRun.started_at).getTime()) / 1000)
    : 0;
  const elapsedStr =
    elapsed > 3600 ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
    : elapsed > 60  ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
    : `${elapsed}s`;

  return (
    <div className="mx-2 mb-2 rounded-md border border-status-running/30 bg-status-running-bg p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <LiveDot state="running" size="sm" />
        <Link
          href={`/runs/${activeRun.id}`}
          className="font-medium text-xs text-status-running-fg hover:underline truncate flex-1"
        >
          {activeRun.name || activeRun.id.slice(0, 16)}
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">
          {activeRun.mode?.replace("_", " ")}
        </Badge>
        <span className="text-[10px] text-muted-foreground font-technical">{elapsedStr}</span>
      </div>
      <Progress className="h-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-full text-[10px] text-destructive hover:bg-destructive/10 gap-1"
        onClick={() =>
          cancelRun.mutate(activeRun.id, {
            onSuccess: () => toast.success("Run cancelled"),
            onError: (e: Error) => toast.error(e.message),
          })
        }
      >
        <Square className="h-2.5 w-2.5" /> Abort run
      </Button>
    </div>
  );
}

function SidebarBody() {
  const [filter, setFilter] = React.useState("");
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: getModuleRegistry,
    staleTime: Infinity,
  });

  const filtered = React.useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter(
      (m) => m.id.toLowerCase().includes(q) || getModuleLabel(m.id).toLowerCase().includes(q),
    );
  }, [modules, filter]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, ModuleInfo[]>();
    for (const mod of filtered) {
      const cat = getCategoryForModule(mod);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(mod);
    }
    return map;
  }, [filtered]);

  const sortedCategories = React.useMemo(
    () =>
      Array.from(grouped.keys()).sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }),
    [grouped],
  );

  return (
    <>
      <SidebarHeader className="px-2 pb-2 pt-3">
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hardware
          </span>
          <SidebarTrigger className="ml-auto h-6 w-6" />
        </div>
        <div className="relative mt-1.5">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter modules…"
            className="h-7 pl-7 text-xs font-mono"
            aria-label="Filter hardware modules"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {isLoading && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            Loading modules…
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No modules match &ldquo;{filter}&rdquo;
          </div>
        )}
        <Accordion
          type="multiple"
          defaultValue={sortedCategories}
          className="w-full"
        >
          {sortedCategories.map((cat) => {
            const mods = grouped.get(cat) ?? [];
            return (
              <AccordionItem key={cat} value={cat} className="border-b-0">
                <AccordionTrigger className="px-3 py-1.5 hover:no-underline hover:bg-accent/40 [&[data-state=open]>svg]:rotate-180">
                  <SidebarGroupLabel className="p-0 h-auto text-[10px] uppercase tracking-wider font-semibold">
                    {cat}
                  </SidebarGroupLabel>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pt-0">
                  <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {mods.map((mod) => (
                          <ModuleRow
                            key={mod.id}
                            mod={mod}
                            dotState={"never"}
                            lastStatus={null}
                            lastTested={null}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <ActiveRunCard />
      </SidebarFooter>
    </>
  );
}

export function SidebarModules() {
  return (
    <SidebarProvider defaultOpen style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/60">
        <SidebarBody />
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
}
