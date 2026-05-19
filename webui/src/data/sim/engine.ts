/**
 * src/data/sim/engine.ts
 *
 * The in-browser simulation engine.
 *
 * Provides:
 *  - In-memory store (Zustand) for runs, results, templates, schedules
 *  - Result generation via generators/index.ts
 *  - Per-mode streaming (rAF-driven for long-term/monitoring/event)
 *  - Fault injection API
 *  - IndexedDB persistence via persistence.ts
 *  - Profile switching
 */

import { create } from "zustand";
import type { TestResult } from "@/proto/types";
import { ALL_MODULE_IDS } from "@/proto/types";
import type { SimProfile, ProfileConfig } from "./profiles";
import { getProfile, PROFILES } from "./profiles";
import { generateSingleShotResult, generateStreamingResult, generateEventResult } from "./generators";
import { simSet } from "./persistence";
import { setRngSeed } from "./rng";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RunMode = "single_shot" | "long_term" | "monitoring" | "event_based";
export type RunStatus = "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";

export interface SimRun {
    id: string;
    name: string;
    description?: string;
    mode: RunMode;
    moduleIds: string[];
    status: RunStatus;
    startedAt: string;
    endedAt?: string;
    tags?: string[];
    frequencyHz?: number;
    templateId?: string;
    resultCount: number;
}

export interface SimTemplate {
    id: string;
    name: string;
    description?: string;
    mode: RunMode;
    moduleIds: string[];
    createdAt: string;
    lastUsedAt?: string;
}

export interface SimSchedule {
    id: string;
    name: string;
    templateId: string;
    cron?: string;
    oneTimeAt?: string;
    enabled: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
}

export interface FaultInjection {
    moduleId: string;
    pinnedStatus?: string;
    pinnedSeverity?: string;
    errorMessage?: string;
}

export interface SimStore {
    // Runs
    runs: SimRun[];
    activeRunId: string | null;

    // Results keyed by runId → moduleId → TestResult[]
    results: Record<string, Record<string, TestResult[]>>;

    // Templates
    templates: SimTemplate[];

    // Schedules
    schedules: SimSchedule[];

    // Fault injections per module
    faultInjections: Record<string, FaultInjection>;

    // Active streaming intervals (not persisted)
    _streamingHandles: Record<string, number>;

    // Profile
    profile: SimProfile;

    // Actions
    setProfile: (p: SimProfile) => void;
    createRun: (params: Omit<SimRun, "id" | "startedAt" | "resultCount" | "status">) => SimRun;
    startRun: (runId: string) => void;
    pauseRun: (runId: string) => void;
    resumeRun: (runId: string) => void;
    stopRun: (runId: string) => void;
    deleteRun: (runId: string) => void;
    addResult: (runId: string, moduleId: string, result: TestResult) => void;
    createTemplate: (params: Omit<SimTemplate, "id" | "createdAt">) => SimTemplate;
    deleteTemplate: (id: string) => void;
    createSchedule: (params: Omit<SimSchedule, "id">) => SimSchedule;
    toggleSchedule: (id: string) => void;
    deleteSchedule: (id: string) => void;
    injectFault: (injection: FaultInjection) => void;
    clearFault: (moduleId: string) => void;
    fireEvent: (moduleId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
    return `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Engine store ──────────────────────────────────────────────────────────────

export const useSimStore = create<SimStore>()((set, get) => ({
    runs: [],
    activeRunId: null,
    results: {},
    templates: [],
    schedules: [],
    faultInjections: {},
    _streamingHandles: {},
    profile: "healthy",

    setProfile: (profile) => {
        set({ profile });
    },

    createRun: (params) => {
        const run: SimRun = {
            ...params,
            id: uuid(),
            status: "queued",
            startedAt: new Date().toISOString(),
            resultCount: 0,
        };
        set((s) => ({ runs: [run, ...s.runs] }));
        simSet(`run:${run.id}`, run);
        return run;
    },

    startRun: (runId) => {
        set((s) => ({
            runs: s.runs.map((r) =>
                r.id === runId ? { ...r, status: "running" as RunStatus } : r
            ),
            activeRunId: runId,
        }));

        const { runs, profile: profileName } = get();
        const run = runs.find((r) => r.id === runId);
        if (!run) return;

        const profile = getProfile(profileName);

        if (run.mode === "single_shot") {
            // Generate results immediately for all modules
            let seq = 0;
            for (const moduleId of run.moduleIds) {
                const result = _applyFaultInjection(
                    generateSingleShotResult(moduleId, seq++, profile),
                    get().faultInjections[moduleId]
                );
                get().addResult(runId, moduleId, result);
            }
            // Complete after small delay
            setTimeout(() => {
                set((s) => ({
                    runs: s.runs.map((r) =>
                        r.id === runId ? { ...r, status: "completed" as RunStatus, endedAt: new Date().toISOString() } : r
                    ),
                    activeRunId: null,
                }));
            }, 800);
        } else {
            // Streaming mode — tick via setInterval (rAF would need browser context)
            const freqHz = run.frequencyHz ?? 1;
            const intervalMs = Math.max(500, 1000 / freqHz);
            const seqMap: Record<string, number> = {};

            const handle = setInterval(() => {
                const state = get();
                const currentRun = state.runs.find((r) => r.id === runId);
                if (!currentRun || currentRun.status !== "running") {
                    clearInterval(handle);
                    return;
                }
                const activeProfile = getProfile(state.profile);
                for (const moduleId of currentRun.moduleIds) {
                    seqMap[moduleId] = (seqMap[moduleId] ?? 0) + 1;
                    const result = _applyFaultInjection(
                        run.mode === "event_based"
                            ? generateEventResult(moduleId, seqMap[moduleId], activeProfile)
                            : generateStreamingResult(moduleId, seqMap[moduleId], activeProfile),
                        state.faultInjections[moduleId]
                    );
                    state.addResult(runId, moduleId, result);
                }
            }, intervalMs) as unknown as number;

            set((s) => ({ _streamingHandles: { ...s._streamingHandles, [runId]: handle } }));
        }
    },

    pauseRun: (runId) => {
        set((s) => ({
            runs: s.runs.map((r) =>
                r.id === runId ? { ...r, status: "paused" as RunStatus } : r
            ),
        }));
    },

    resumeRun: (runId) => {
        set((s) => ({
            runs: s.runs.map((r) =>
                r.id === runId ? { ...r, status: "running" as RunStatus } : r
            ),
        }));
    },

    stopRun: (runId) => {
        const { _streamingHandles } = get();
        if (_streamingHandles[runId]) {
            clearInterval(_streamingHandles[runId]);
        }
        set((s) => ({
            runs: s.runs.map((r) =>
                r.id === runId && r.status !== "completed"
                    ? { ...r, status: "cancelled" as RunStatus, endedAt: new Date().toISOString() }
                    : r
            ),
            activeRunId: s.activeRunId === runId ? null : s.activeRunId,
            _streamingHandles: Object.fromEntries(
                Object.entries(s._streamingHandles).filter(([k]) => k !== runId)
            ),
        }));
    },

    deleteRun: (runId) => {
        get().stopRun(runId);
        set((s) => ({
            runs: s.runs.filter((r) => r.id !== runId),
            results: Object.fromEntries(Object.entries(s.results).filter(([k]) => k !== runId)),
        }));
        simSet(`run:${runId}`, undefined);
    },

    addResult: (runId, moduleId, result) => {
        set((s) => {
            const runResults = s.results[runId] ?? {};
            const moduleResults = runResults[moduleId] ?? [];
            const updated = [...moduleResults, result].slice(-500); // keep last 500 per module
            return {
                results: {
                    ...s.results,
                    [runId]: { ...runResults, [moduleId]: updated },
                },
                runs: s.runs.map((r) =>
                    r.id === runId ? { ...r, resultCount: r.resultCount + 1 } : r
                ),
            };
        });
    },

    createTemplate: (params) => {
        const tmpl: SimTemplate = {
            ...params,
            id: uuid(),
            createdAt: new Date().toISOString(),
        };
        set((s) => ({ templates: [tmpl, ...s.templates] }));
        return tmpl;
    },

    deleteTemplate: (id) => {
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    },

    createSchedule: (params) => {
        const sched: SimSchedule = { ...params, id: uuid() };
        set((s) => ({ schedules: [sched, ...s.schedules] }));
        return sched;
    },

    toggleSchedule: (id) => {
        set((s) => ({
            schedules: s.schedules.map((sc) =>
                sc.id === id ? { ...sc, enabled: !sc.enabled } : sc
            ),
        }));
    },

    deleteSchedule: (id) => {
        set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) }));
    },

    injectFault: (injection) => {
        set((s) => ({
            faultInjections: { ...s.faultInjections, [injection.moduleId]: injection },
        }));
    },

    clearFault: (moduleId) => {
        set((s) => {
            const next = { ...s.faultInjections };
            delete next[moduleId];
            return { faultInjections: next };
        });
    },

    fireEvent: (moduleId) => {
        const { runs, activeRunId, profile: profileName } = get();
        if (!activeRunId) return;
        const run = runs.find((r) => r.id === activeRunId);
        if (!run) return;
        const profile = getProfile(profileName);
        const seq = (get().results[activeRunId]?.[moduleId]?.length ?? 0) + 1;
        const result = generateEventResult(moduleId, seq, profile);
        get().addResult(activeRunId, moduleId, result);
    },
}));

// ── Fault injection helper ────────────────────────────────────────────────────

function _applyFaultInjection(result: TestResult, fault?: FaultInjection): TestResult {
    if (!fault) return result;
    return {
        ...result,
        output: {
            ...result.output,
            status: fault.pinnedStatus != null ? (fault.pinnedStatus as never) : result.output?.status ?? (0 as never),
            severity: fault.pinnedSeverity != null ? (fault.pinnedSeverity as never) : result.output?.severity ?? (0 as never),
            reason: result.output?.reason ?? {},
            metrics: result.output?.metrics ?? {},
            monitoring: result.output?.monitoring ?? {},
            event: result.output?.event ?? {},
            errorMessage: fault.errorMessage ?? result.output?.errorMessage ?? "",
        },
    };
}

// ── Seed helper ───────────────────────────────────────────────────────────────

export function initSimEngine(seed?: string, profile?: SimProfile) {
    if (seed) setRngSeed(seed);
    if (profile) useSimStore.getState().setProfile(profile);
}

// ── Seeded boards vitals ──────────────────────────────────────────────────────

export interface SimBoardVitals {
    cpuTempCelsius: number;
    cpuLoadPct: number;
    ramUsedMb: number;
    uptimeSince: string;
    networkState: "up" | "down";
    activeRunName?: string;
    activeRunSequence?: number;
}

export function generateBoardVitals(profile: ProfileConfig): SimBoardVitals {
    const base = PROFILES[profile.name as SimProfile];
    return {
        cpuTempCelsius: parseFloat((35 + base.noiseFactor * 200 + Math.random() * 15).toFixed(1)),
        cpuLoadPct: parseFloat((10 + base.noiseFactor * 400 + Math.random() * 30).toFixed(1)),
        ramUsedMb: Math.floor(512 + Math.random() * 3000),
        uptimeSince: new Date(Date.now() - Math.floor(Math.random() * 86400 * 7 * 1000)).toISOString(),
        networkState: base.passRate > 0.5 ? "up" : "down",
    };
}

// ── Pre-seeded demo data ──────────────────────────────────────────────────────

export function seedDemoData() {
    const store = useSimStore.getState();
    if (store.runs.length > 0) return; // already seeded

    // Create a few completed runs
    const demoModules = ["cpu", "gpu", "system_memory", "thermal_management", "ethernet"].filter(
        (id) => ALL_MODULE_IDS.includes(id)
    );

    for (let i = 0; i < 3; i++) {
        const run = store.createRun({
            name: `Demo Run ${i + 1}`,
            description: "Pre-seeded demo run",
            mode: "single_shot",
            moduleIds: demoModules,
            tags: ["demo"],
        });
        store.startRun(run.id);
    }
}
