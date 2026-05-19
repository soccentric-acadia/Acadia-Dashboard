/**
 * src/state/preferences.ts
 *
 * Zustand store for user/operator preferences.
 * Persisted to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Density = "compact" | "normal" | "comfortable";
export type TimeFormat = "relative" | "absolute" | "both";
export type DateFormat = "iso" | "us" | "eu";

interface PreferencesStore {
    density: Density;
    timeFormat: TimeFormat;
    dateFormat: DateFormat;
    timezone: string;
    sidebarExpanded: boolean;
    showSparklines: boolean;
    rawPayloadDefault: boolean;
    /** Simulation profile */
    simProfile: "healthy" | "thermal-throttling" | "memory-degraded" | "sensor-noisy" | "catastrophic";
    /** Deterministic RNG seed (empty = random) */
    simSeed: string;
    deterministicMode: boolean;

    // Actions
    setDensity: (d: Density) => void;
    setTimeFormat: (f: TimeFormat) => void;
    setDateFormat: (f: DateFormat) => void;
    setTimezone: (tz: string) => void;
    setSidebarExpanded: (v: boolean) => void;
    setShowSparklines: (v: boolean) => void;
    setRawPayloadDefault: (v: boolean) => void;
    setSimProfile: (p: PreferencesStore["simProfile"]) => void;
    setSimSeed: (s: string) => void;
    setDeterministicMode: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
    persist(
        (set) => ({
            density: "normal",
            timeFormat: "relative",
            dateFormat: "iso",
            timezone: "UTC",
            sidebarExpanded: true,
            showSparklines: true,
            rawPayloadDefault: false,
            simProfile: "healthy",
            simSeed: "",
            deterministicMode: false,

            setDensity: (density) => set({ density }),
            setTimeFormat: (timeFormat) => set({ timeFormat }),
            setDateFormat: (dateFormat) => set({ dateFormat }),
            setTimezone: (timezone) => set({ timezone }),
            setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),
            setShowSparklines: (showSparklines) => set({ showSparklines }),
            setRawPayloadDefault: (rawPayloadDefault) => set({ rawPayloadDefault }),
            setSimProfile: (simProfile) => set({ simProfile }),
            setSimSeed: (simSeed) => set({ simSeed }),
            setDeterministicMode: (deterministicMode) => set({ deterministicMode }),
        }),
        { name: "acadia-preferences" }
    )
);
