"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";
import type { ExecutionMode, ModuleRunSelection } from "@/lib/types/api";

interface AppShellState {
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeRunId: string | null;
  setActiveRunId: (runId: string | null) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  reviewingRunId: string | null;
  setReviewingRunId: (runId: string | null) => void;
  themeMode: "system" | "light" | "dark";
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  activeModuleSelection: ModuleRunSelection | null;
  setActiveModuleSelection: (selection: ModuleRunSelection | null) => void;
  registerModuleSearchFocus: (focusFn: (() => void) | null) => void;
  focusModuleSearch: () => void;
  serverOnline: boolean | null;
}

const AppShellContext = createContext<AppShellState | null>(null);

const SIDEBAR_KEY = "acadia.sidebar.collapsed";
const THEME_KEY = "acadia.theme.mode";
const DEFAULT_MODE_KEY = "acadia.prefs.defaultMode";

function readDefaultMode(): ExecutionMode {
  if (typeof window === "undefined") return "single_shot";
  try {
    const storedMode = JSON.parse(window.localStorage.getItem(DEFAULT_MODE_KEY) ?? "null") as unknown;
    if (storedMode === "single_shot" || storedMode === "monitoring" || storedMode === "event" || storedMode === "long_run") {
      return storedMode;
    }
  } catch {
    return "single_shot";
  }
  return "single_shot";
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ExecutionMode>(() => readDefaultMode());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [reviewingRunId, setReviewingRunId] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(() => {
    if (typeof window === "undefined") return "system";
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme;
    }
    return "system";
  });
  const [activeModuleSelection, setActiveModuleSelection] = useState<ModuleRunSelection | null>(null);
  const [moduleSearchFocusFn, setModuleSearchFocusFn] = useState<(() => void) | null>(null);

  const { data: healthData, isError: healthError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 10_000,
    retry: 0,
  });
  const serverOnline: boolean | null = healthData
    ? !healthError && healthData.status === "ok"
    : healthError
      ? false
      : null;

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, themeMode);

    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
      return;
    }

    if (themeMode === "light") {
      root.classList.remove("dark");
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (media.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  const registerModuleSearchFocus = useCallback((focusFn: (() => void) | null) => {
    setModuleSearchFocusFn(() => focusFn);
  }, []);

  const focusModuleSearch = useCallback(() => {
    moduleSearchFocusFn?.();
  }, [moduleSearchFocusFn]);

  const value = useMemo<AppShellState>(
    () => ({
      mode,
      setMode,
      sidebarCollapsed,
      setSidebarCollapsed,
      activeRunId,
      setActiveRunId,
      isRunning,
      setIsRunning,
      reviewingRunId,
      setReviewingRunId,
      themeMode,
      setThemeMode,
      activeModuleSelection,
      setActiveModuleSelection,
      registerModuleSearchFocus,
      focusModuleSearch,
      serverOnline,
    }),
    [
      mode,
      sidebarCollapsed,
      activeRunId,
      isRunning,
      reviewingRunId,
      themeMode,
      activeModuleSelection,
      registerModuleSearchFocus,
      focusModuleSearch,
      serverOnline,
    ],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used inside AppShellProvider");
  }
  return ctx;
}
