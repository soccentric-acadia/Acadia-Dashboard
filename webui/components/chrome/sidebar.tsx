"use client";

import clsx from "clsx";
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
      className={clsx(
        "sticky top-16 h-[calc(100vh-4rem)] border-r border-white/40 bg-white/55 backdrop-blur-xl transition-[width] dark:border-white/10 dark:bg-zinc-950/45",
        collapsed ? "w-[76px]" : "w-[300px]",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/40 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            {!collapsed && (
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search modules"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            )}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg border border-zinc-300 p-2 dark:border-zinc-700"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <Link
            href={locked ? pathname : "/dashboard"}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={clsx(
              "mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
              pathname === "/dashboard"
                ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80",
              locked && "cursor-not-allowed opacity-60",
            )}
          >
            <LayoutDashboard size={16} />
            {!collapsed && "Dashboard"}
          </Link>

          {grouped.map((group) => (
            <details key={group.category} open className="mb-2 rounded-xl border border-transparent bg-white/40 p-1 dark:bg-zinc-900/30">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
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
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80",
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
            className={clsx(
              "mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
              pathname === "/logs"
                ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80",
            )}
          >
            <FileText size={16} />
            {!collapsed && "Logs"}
          </Link>
        </div>

        <div className="border-t border-white/40 p-2 dark:border-white/10">
          <Link
            href={locked ? pathname : "/settings/general"}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
              pathname.startsWith("/settings")
                ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80",
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
