"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Cpu, FileText, HardDrive, LayoutDashboard, Network, RadioTower, Settings } from "lucide-react";
import { getModules } from "@/lib/api";
import { modulesForOfflineDisplay, writeCachedModules } from "@/lib/modules/catalog";
import type { ModuleInfo } from "@/lib/types/api";

function groupModules(modules: ModuleInfo[]): Array<{ category: string; modules: ModuleInfo[] }> {
  const map = new Map<string, ModuleInfo[]>();
  modules.forEach((module) => {
    if (!map.has(module.category)) map.set(module.category, []);
    map.get(module.category)?.push(module);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, list]) => ({
      category,
      modules: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export function Sidebar({
  collapsed,
  setCollapsed,
  locked,
  search,
  setSearch,
  onRegisterSearchFocus,
}: {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  locked: boolean;
  search: string;
  setSearch: (value: string) => void;
  onRegisterSearchFocus: (focusFn: (() => void) | null) => void;
}) {
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: liveModules } = useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
  });

  useEffect(() => {
    if (liveModules && liveModules.length > 0) writeCachedModules(liveModules);
  }, [liveModules]);

  const modules = useMemo(() => modulesForOfflineDisplay(liveModules), [liveModules]);

  const grouped = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = normalized
      ? modules.filter((module) => {
        return (
          module.name.toLowerCase().includes(normalized) ||
          module.id.toLowerCase().includes(normalized) ||
          module.category.toLowerCase().includes(normalized)
        );
      })
      : modules;
    return groupModules(filtered);
  }, [modules, search]);

  const iconForCategory = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes("network")) return Network;
    if (normalized.includes("storage")) return HardDrive;
    if (normalized.includes("sensor")) return Activity;
    if (normalized.includes("bus")) return RadioTower;
    return Cpu;
  };

  useEffect(() => {
    onRegisterSearchFocus(() => searchInputRef.current?.focus());
    return () => onRegisterSearchFocus(null);
  }, [onRegisterSearchFocus]);

  return (
    <aside
      className={cn(
        "sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border bg-background transition-[width]",
        collapsed ? "w-[60px]" : "w-[280px]",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search modules"
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <Link
            href={locked ? pathname : "/dashboard"}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={cn(
              "mb-2 flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              pathname === "/dashboard"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              locked && "cursor-not-allowed opacity-60",
            )}
          >
            <LayoutDashboard size={16} />
            {!collapsed && "Dashboard"}
          </Link>

          {grouped.map((group) => (
            <details key={group.category} open className="mb-1">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                {!collapsed && group.category}
                <ChevronDown size={14} />
              </summary>
              <div className="mt-1 space-y-1">
                {group.modules.map((module) => {
                  const href = `/modules/${module.id}`;
                  const active = pathname === href;
                  const ModuleIcon = iconForCategory(module.category);
                  return (
                    <Link
                      key={module.id}
                      href={locked ? pathname : href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                      onClick={(event) => {
                        if (locked) event.preventDefault();
                      }}
                    >
                      <ModuleIcon size={16} />
                      {!collapsed && <span>{module.name || module.id}</span>}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}

          <Link
            href={locked ? pathname : "/logs"}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={cn(
              "mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              pathname === "/logs"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <FileText size={16} />
            {!collapsed && "Logs"}
          </Link>
        </div>

        <div className="border-t border-border p-2">
          <Link
            href={locked ? pathname : "/settings/general"}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Settings size={16} />
            {!collapsed && "Settings"}
          </Link>
        </div>
      </div>
    </aside>
  );
}
