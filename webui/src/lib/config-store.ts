// Zustand store for saved configurations (client-side persistence via localStorage).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TestMode } from "@/lib/api/types";

export interface SavedConfig {
    id: string;
    name: string;
    moduleId: string;
    mode: TestMode;
    commonConfig: CommonConfigValues;
    moduleConfig: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CommonConfigValues {
    interval_ms?: number;
    duration_ms?: number;
    run_forever?: boolean;
    poll_interval_ms?: number;
    monitor_item_names?: string[];
    event_condition?: {
        test_name?: string;
        expected_pass?: boolean;
        expression?: string;
    };
}

interface ConfigStore {
    configs: SavedConfig[];
    save: (config: Omit<SavedConfig, "id" | "createdAt" | "updatedAt">) => SavedConfig;
    update: (id: string, patch: Partial<Omit<SavedConfig, "id" | "createdAt">>) => void;
    remove: (id: string) => void;
    get: (id: string) => SavedConfig | undefined;
}

export const useConfigStore = create<ConfigStore>()(
    persist(
        (set, get) => ({
            configs: [],
            save: (config) => {
                const now = new Date().toISOString();
                const newConfig: SavedConfig = {
                    ...config,
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                };
                set((s) => ({ configs: [newConfig, ...s.configs] }));
                return newConfig;
            },
            update: (id, patch) => {
                set((s) => ({
                    configs: s.configs.map((c) =>
                        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
                    ),
                }));
            },
            remove: (id) => {
                set((s) => ({ configs: s.configs.filter((c) => c.id !== id) }));
            },
            get: (id) => get().configs.find((c) => c.id === id),
        }),
        { name: "acadia-configs" }
    )
);
