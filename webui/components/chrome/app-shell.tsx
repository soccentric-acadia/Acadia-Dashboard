"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createConfig, createRun, cancelRun } from "@/lib/api";
import type { ExecutionMode } from "@/lib/types/api";
import { HelpShortcutsDialog } from "@/components/chrome/help-shortcuts-dialog";
import { Sidebar } from "@/components/chrome/sidebar";
import { TopBar } from "@/components/chrome/top-bar";
import { useAppShell } from "@/state/app-shell-context";

function modeFromHotkey(key: string): ExecutionMode | null {
  if (key === "1") return "single_shot";
  if (key === "2") return "monitoring";
  if (key === "3") return "event";
  if (key === "4") return "long_run";
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    mode,
    setMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    activeRunId,
    setActiveRunId,
    isRunning,
    setIsRunning,
    activeModuleSelection,
    registerModuleSearchFocus,
    focusModuleSearch,
  } = useAppShell();
  const [search, setSearch] = useState("");
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!activeRunId) {
        if (!activeModuleSelection || activeModuleSelection.enabledTestNames.length === 0) {
          throw new Error("Select a module and enable at least one HAL test before starting a run.");
        }

        const config = await createConfig({
          name: `${activeModuleSelection.moduleName} ${mode}`,
          description: JSON.stringify(
            {
              module_id: activeModuleSelection.moduleId,
              enabled_test_names: activeModuleSelection.enabledTestNames,
            },
            null,
            2,
          ),
          mode,
          common_config: {
            source: "webui",
            execution_mode: mode,
          },
          modules: [
            {
              module_id: activeModuleSelection.moduleId,
              config_type_url: activeModuleSelection.configTypeUrl,
              config: activeModuleSelection.moduleConfig,
            },
          ],
        });
        const run = await createRun(mode, config.id);
        return { type: "start" as const, runId: run.id };
      }
      await cancelRun(activeRunId);
      return { type: "stop" as const, runId: activeRunId };
    },
    onSuccess: (result) => {
      setRunError(null);
      if (result.type === "start") {
        setActiveRunId(result.runId);
        setIsRunning(true);
        setRunningSince(Date.now());
      } else {
        setIsRunning(false);
        setActiveRunId(null);
        setRunningSince(null);
      }
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (error) => {
      setRunError(error instanceof Error ? error.message : "Unable to start run.");
    },
  });

  const lockNavigation = useMemo(() => isRunning, [isRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        setSidebarCollapsed(event.key === "[");
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusModuleSearch();
        return;
      }

      if (event.key === " " && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        runMutation.mutate();
        return;
      }

      if (isRunning) return;
      const nextMode = modeFromHotkey(event.key);
      if (nextMode) {
        event.preventDefault();
        setMode(nextMode);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusModuleSearch, isRunning, runMutation, setMode, setSidebarCollapsed]);

  useEffect(() => {
    if (lockNavigation && pathname.startsWith("/settings")) router.replace(pathname);
  }, [lockNavigation, pathname, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar
        mode={mode}
        setMode={(nextMode) => {
          if (!isRunning) setMode(nextMode);
        }}
        isRunning={isRunning}
        runningSince={runningSince}
        onStartStop={() => runMutation.mutate()}
      />

      {runError && (
        <div className="sticky top-14 z-20 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {runError}
        </div>
      )}

      <div className="flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          locked={lockNavigation}
          search={search}
          setSearch={setSearch}
          onRegisterSearchFocus={registerModuleSearchFocus}
        />

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 overflow-auto p-5">{children}</main>
      </div>

      <HelpShortcutsDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
